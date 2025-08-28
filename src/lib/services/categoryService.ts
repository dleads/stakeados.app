// SSR-safe Supabase selector: use server client on server, browser client on client
function getSupabase() {
  if (typeof window === 'undefined') {
    // Server/runtime (Netlify/Node): use service role client without browser APIs
    // Use require to avoid static import in edge build graph
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@/lib/supabase/server');
    return createClient();
  }
  // Browser runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@/lib/supabase/client');
  return createClient();
}
import type { Database } from '@/types/supabase';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  parent_id?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export interface CategoryStats {
  id: string;
  name: string;
  article_count: number;
  news_count: number;
  total_views: number;
  total_interactions: number;
}

class CategoryService {
  // Lazy getter ensures correct client per runtime and avoids SSR import-time pitfalls
  private get supabase() {
    return getSupabase();
  }

  async getCategories(_includeInactive: boolean = false): Promise<Category[]> {
    let query = this.supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    // If not including inactive, we could add a filter here if there's an active/inactive field
    // For now, we'll return all categories since there's no active field in the schema

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  async getCategoriesHierarchical(
    includeInactive: boolean = false
  ): Promise<Category[]> {
    const categories = await this.getCategories(includeInactive);

    // Build hierarchical structure using parent_id
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    const rootCategories: (Category & { children: Category[] })[] = [];

    // First pass: create map and add children array
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build hierarchy
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    // Check if slug already exists
    const existing = await this.getCategoryBySlug(categoryData.slug);
    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    const insertData: CategoryInsert = {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || null,
      color: categoryData.color || null,
      icon: categoryData.icon || null,
      sort_order: categoryData.sort_order || 0,
      parent_id: categoryData.parent_id || null,
    };

    const { data, error } = await this.supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  async updateCategory(updateData: UpdateCategoryData): Promise<Category> {
    const { id, ...updates } = updateData;

    // If slug is being updated, check for conflicts
    if (updates.slug) {
      const existing = await this.getCategoryBySlug(updates.slug);
      if (existing && existing.id !== id) {
        throw new Error('Category with this slug already exists');
      }
    }

    const updatePayload: CategoryUpdate = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.slug !== undefined) updatePayload.slug = updates.slug;
    if (updates.description !== undefined)
      updatePayload.description = updates.description;
    if (updates.color !== undefined) updatePayload.color = updates.color;
    if (updates.icon !== undefined) updatePayload.icon = updates.icon;
    if (updates.sort_order !== undefined)
      updatePayload.sort_order = updates.sort_order;
    if (updates.parent_id !== undefined)
      updatePayload.parent_id = updates.parent_id;

    const { data, error } = await this.supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  async reorderCategories(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      await this.supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }
  }

  async getCategoryStats(): Promise<CategoryStats[]> {
    const categories = await this.getCategories();
    const stats: CategoryStats[] = [];

    for (const category of categories) {
      const categoryStats = await this.getCategoryStatsById(category.id);
      if (categoryStats) {
        stats.push(categoryStats);
      }
    }

    return stats;
  }

  async searchCategories(query: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .or(
        `name.ilike.%${query}%,slug.ilike.%${query}%,description.ilike.%${query}%`
      )
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to search categories: ${error.message}`);
    }

    return data || [];
  }

  async getCategoriesWithCounts(): Promise<
    (Category & { article_count: number; news_count: number })[]
  > {
    const categories = await this.getCategories();
    const categoriesWithCounts: (Category & {
      article_count: number;
      news_count: number;
    })[] = [];

    for (const category of categories) {
      // Get article count
      const { count: articleCount } = await this.supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      // Get news count
      const { count: newsCount } = await this.supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      categoriesWithCounts.push({
        ...category,
        article_count: articleCount || 0,
        news_count: newsCount || 0,
      });
    }

    return categoriesWithCounts;
  }

  async getCategoryStatsById(id: string): Promise<CategoryStats | null> {
    // First check if category exists
    const category = await this.getCategoryById(id);
    if (!category) {
      return null;
    }

    // Get article count and views
    const { count: articleCount } = await this.supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    // Get news count
    const { count: newsCount } = await this.supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    // Get total views from articles in this category
    const { data: articleViews } = await this.supabase
      .from('articles')
      .select('views')
      .eq('category_id', id);

    const totalViews =
      articleViews?.reduce(
        (sum: number, article: { views?: number | null }) =>
          sum + (article.views || 0),
        0
      ) || 0;
    const totalInteractions = 0; // TODO: Implement when news interactions are available

    return {
      id: category.id,
      name: category.name,
      article_count: articleCount || 0,
      news_count: newsCount || 0,
      total_views: totalViews,
      total_interactions: totalInteractions,
    };
  }

  async deleteCategory(
    id: string,
    reassignToCategoryId?: string
  ): Promise<void> {
    // Check if category is being used
    const { count: articleCount } = await this.supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    const { count: newsCount } = await this.supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    // Check if category has child categories
    const { count: childCount } = await this.supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id);

    // If category is being used and no reassignment category provided, throw error
    if ((articleCount || newsCount || childCount) && !reassignToCategoryId) {
      throw new Error(
        'Cannot delete category that is being used by articles, news, or has child categories. Please provide a reassignment category.'
      );
    }

    // If reassignment category is provided, reassign content
    if (reassignToCategoryId) {
      // Verify reassignment category exists
      const reassignCategory = await this.getCategoryById(reassignToCategoryId);
      if (!reassignCategory) {
        throw new Error('Reassignment category not found');
      }

      // Reassign articles
      if (articleCount) {
        await this.supabase
          .from('articles')
          .update({ category_id: reassignToCategoryId })
          .eq('category_id', id);
      }

      // Reassign news
      if (newsCount) {
        await this.supabase
          .from('news')
          .update({ category_id: reassignToCategoryId })
          .eq('category_id', id);
      }

      // Reassign child categories
      if (childCount) {
        await this.supabase
          .from('categories')
          .update({ parent_id: reassignToCategoryId })
          .eq('parent_id', id);
      }
    }

    // Delete the category
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
}

export const categoryService = new CategoryService();
