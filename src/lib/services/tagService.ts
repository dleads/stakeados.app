import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/types/database-extended';
import type { ContentTag } from '@/types/content';

export interface CreateTagData {
  name: string;
  slug?: string;
}

export interface TagWithUsage extends ContentTag {
  recent_usage: number;
  trending_score: number;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
}

class TagService {
  private supabase: SupabaseClient<DatabaseExtended> = createClient();

  async getTags(
    limit?: number,
    sortBy: 'name' | 'usage' | 'recent' = 'usage'
  ): Promise<ContentTag[]> {
    let query = this.supabase.from('content_tags').select('*');

    switch (sortBy) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'usage':
        query = query.order('usage_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    return (data as any) || [];
  }

  async getTagById(id: string): Promise<ContentTag | null> {
    const { data, error } = await this.supabase
      .from('content_tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch tag: ${error.message}`);
    }

    return data as any;
  }

  async getTagByName(name: string): Promise<ContentTag | null> {
    const { data, error } = await this.supabase
      .from('content_tags')
      .select('*')
      .eq('name', name.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch tag: ${error.message}`);
    }

    return data as any;
  }

  async searchTags(query: string, limit = 10): Promise<ContentTag[]> {
    const { data, error } = await this.supabase
      .from('content_tags')
      .select('*')
      .ilike('name', `%${query.toLowerCase()}%`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search tags: ${error.message}`);
    }

    return (data as any) || [];
  }

  async createTag(tagData: CreateTagData): Promise<ContentTag> {
    const name = tagData.name.toLowerCase().trim();
    const slug = tagData.slug || this.generateSlug(name);

    // Check if tag already exists
    const existing = await this.getTagByName(name);
    if (existing) {
      return existing;
    }

    const { data, error } = await this.supabase
      .from('content_tags')
      .insert({
        name,
        slug,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tag: ${error.message}`);
    }

    return data as any;
  }

  async createMultipleTags(tagNames: string[]): Promise<ContentTag[]> {
    const tags: ContentTag[] = [];

    for (const name of tagNames) {
      try {
        const tag = await this.createTag({ name });
        tags.push(tag);
      } catch (error) {
        console.warn(`Failed to create tag "${name}":`, error);
      }
    }

    return tags;
  }

  async updateTag(
    id: string,
    updates: Partial<CreateTagData>
  ): Promise<ContentTag> {
    const updateData: Partial<DatabaseExtended['public']['Tables']['content_tags']['Update']> = {};

    if (updates.name) {
      updateData.name = updates.name.toLowerCase().trim();
      updateData.slug = updates.slug || this.generateSlug(updateData.name);
    }

    const { data, error } = await this.supabase
      .from('content_tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tag: ${error.message}`);
    }

    return data as any;
  }

  async deleteTag(id: string): Promise<void> {
    // Check if tag is being used
    const { data: articleUsage } = await this.supabase
      .from('article_tags')
      .select('article_id')
      .eq('tag_id', id)
      .limit(1);

    if (articleUsage?.length) {
      throw new Error('Cannot delete tag that is being used by articles');
    }

    const { error } = await this.supabase
      .from('content_tags')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete tag: ${error.message}`);
    }
  }

  async getPopularTags(limit = 20): Promise<TagWithUsage[]> {
    const { data, error } = await this.supabase.rpc('get_popular_tags', {
      limit_count: limit,
    });

    if (error) {
      throw new Error(`Failed to fetch popular tags: ${error.message}`);
    }

    return data || [];
  }

  async getTrendingTags(limit = 10): Promise<TagWithUsage[]> {
    const { data, error } = await this.supabase.rpc('get_trending_tags', {
      limit_count: limit,
    });

    if (error) {
      throw new Error(`Failed to fetch trending tags: ${error.message}`);
    }

    return (data as any) || [];
  }

  async getTagsWithUsageStats(): Promise<TagWithUsage[]> {
    const { data, error } = await this.supabase
      .from('content_tags')
      .select(
        `
        *,
        article_tags(count)
      `
      )
      .order('usage_count', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch tags with usage stats: ${error.message}`
      );
    }

    return ((data as any) || []).map((tag: any) => ({
      ...tag,
      recent_usage: (tag.article_tags as any)?.[0]?.count || 0,
      trending_score: this.calculateTrendingScore(tag as any),
    }));
  }

  async cleanupUnusedTags(): Promise<number> {
    const { data, error } = await this.supabase
      .from('content_tags')
      .delete()
      .eq('usage_count', 0)
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup unused tags: ${error.message}`);
    }

    return (data as any)?.length || 0;
  }

  async mergeTags(sourceTagId: string, targetTagId: string): Promise<void> {
    // Move all article associations from source to target
    const { error: updateError } = await this.supabase
      .from('article_tags')
      .update({ tag_id: targetTagId })
      .eq('tag_id', sourceTagId);

    if (updateError) {
      throw new Error(`Failed to merge tags: ${updateError.message}`);
    }

    // Delete the source tag
    await this.deleteTag(sourceTagId);

    // Update usage count for target tag
    await this.updateTagUsageCount(targetTagId);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private calculateTrendingScore(tag: ContentTag): number {
    // Simple trending score based on recent usage vs historical usage
    const now = new Date();
    const createdAt = new Date(tag.created_at);
    const daysSinceCreated = Math.max(
      1,
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return tag.usage_count / daysSinceCreated;
  }

  private async updateTagUsageCount(tagId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('article_tags')
      .select('tag_id')
      .eq('tag_id', tagId);

    if (error) {
      throw new Error(`Failed to count tag usage: ${error.message}`);
    }

    const usageCount = (data as any)?.length || 0;

    await this.supabase
      .from('content_tags')
      .update({ usage_count: usageCount })
      .eq('id', tagId);
  }

  // AI-powered tag suggestions
  async suggestTagsFromContent(
    content: string,
    title?: string
  ): Promise<TagSuggestion[]> {
    try {
      const response = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, title }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI tag suggestions');
      }

      const suggestions = await response.json();
      return suggestions;
    } catch (error) {
      console.error('Error getting AI tag suggestions:', error);
      return [];
    }
  }

  async suggestTagsFromExisting(partialTag: string): Promise<ContentTag[]> {
    if (partialTag.length < 2) return [];

    return this.searchTags(partialTag, 5);
  }

  async getRelatedTags(tagId: string, limit = 5): Promise<ContentTag[]> {
    const { data, error } = await this.supabase.rpc('get_related_tags', {
      tag_id: tagId,
      limit_count: limit,
    });

    if (error) {
      console.error('Error fetching related tags:', error);
      return [];
    }

    return (data as any) || [];
  }
}

export const tagService = new TagService();
