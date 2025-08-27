import { createClient } from '@/lib/supabase/client';
import type {
  Article,
  NewsArticle,
  SearchResult,
  Locale,
} from '@/types/content';

export interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  contentType?: 'article' | 'news' | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: 'relevance' | 'date' | 'popularity' | 'reading_time';
  sortOrder?: 'asc' | 'desc';
  locale?: Locale;
  limit?: number;
  offset?: number;
}

export interface SearchSuggestion {
  type: 'query' | 'category' | 'tag' | 'author';
  value: string;
  label: string;
  count?: number;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: AdvancedSearchFilters;
  created_at: string;
  last_used: string;
}

class SearchService {
  private supabase = createClient();

  async searchContent(
    filters: AdvancedSearchFilters
  ): Promise<SearchResult<Article | NewsArticle>> {
    const {
      query = '',
      categories = [],
      tags = [],
      difficulty,
      author,
      contentType = 'all',
      dateRange,
      sortBy = 'relevance',
      sortOrder = 'desc',
      locale = 'en',
      limit = 20,
      offset = 0,
    } = filters;

    try {
      // Build the search query
      let searchQuery = this.supabase.rpc('search_content' as any, {
        search_query: query,
        search_categories: categories,
        search_tags: tags,
        search_difficulty: difficulty,
        search_author: author,
        search_content_type: contentType,
        search_date_from: dateRange?.from?.toISOString(),
        search_date_to: dateRange?.to?.toISOString(),
        search_locale: locale,
        sort_by: sortBy,
        sort_order: sortOrder,
        result_limit: limit,
        result_offset: offset,
      });

      const { data, error } = await searchQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Get total count for pagination
      const { count } = await this.supabase.rpc('count_search_results' as any, {
        search_query: query,
        search_categories: categories,
        search_tags: tags,
        search_difficulty: difficulty,
        search_author: author,
        search_content_type: contentType,
        search_date_from: dateRange?.from?.toISOString(),
        search_date_to: dateRange?.to?.toISOString(),
        search_locale: locale,
      });

      return {
        data: data || [],
        total: count || 0,
        query,
        filters,
      };
    } catch (error) {
      console.error('Error searching content:', error);
      throw new Error('Failed to search content');
    }
  }

  async getSearchSuggestions(
    query: string,
    locale: Locale = 'en'
  ): Promise<SearchSuggestion[]> {
    if (query.length < 2) return [];

    try {
      const suggestions: SearchSuggestion[] = [];

      // Get category suggestions
      const { data: categories } = await this.supabase
        .from('content_categories' as any)
        .select('id, name, slug')
        .or(
          `name->>en.ilike.%${query}%,name->>es.ilike.%${query}%,slug.ilike.%${query}%`
        )
        .eq('is_active', true)
        .limit(5);

      if (categories) {
        suggestions.push(
          ...(categories as any[]).map(cat => ({
            type: 'category' as const,
            value: cat.id,
            label: cat.name[locale] || cat.name.en,
            count: 0, // Could be enhanced with actual count
          }))
        );
      }

      // Get tag suggestions
      const { data: tags } = await this.supabase
        .from('content_tags' as any)
        .select('id, name, usage_count')
        .ilike('name', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(5);

      if (tags) {
        suggestions.push(
          ...(tags as any[]).map((tag: any) => ({
            type: 'tag' as const,
            value: tag.name,
            label: `#${tag.name}`,
            count: tag.usage_count,
          }))
        );
      }

      // Get author suggestions
      const { data: authors } = await this.supabase
        .from('profiles' as any)
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(3);

      if (authors) {
        suggestions.push(
          ...(authors as any[]).map((author: any) => ({
            type: 'author' as const,
            value: author.id,
            label: author.name,
            count: 0, // Could be enhanced with article count
          }))
        );
      }

      // Add query suggestion if it doesn't match existing suggestions
      if (
        !suggestions.some(s =>
          s.label.toLowerCase().includes(query.toLowerCase())
        )
      ) {
        suggestions.unshift({
          type: 'query',
          value: query,
          label: `Search for "${query}"`,
        });
      }

      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  async getPopularSearches(limit = 10): Promise<string[]> {
    try {
      // This would typically come from search analytics
      // For now, return some common searches
      const popularSearches = [
        'DeFi',
        'NFT',
        'Bitcoin',
        'Ethereum',
        'Base network',
        'Trading',
        'Staking',
        'Smart contracts',
        'Web3',
        'Blockchain',
      ];

      return popularSearches.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }

  async saveSearch(
    userId: string,
    name: string,
    filters: AdvancedSearchFilters
  ): Promise<SavedSearch> {
    try {
      const { data, error } = await this.supabase
        .from('saved_searches' as any)
        .insert({
          user_id: userId,
          name,
          filters,
          last_used: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save search: ${error.message}`);
      }

      return data as any;
    } catch (error) {
      console.error('Error saving search:', error);
      throw new Error('Failed to save search');
    }
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const { data, error } = await this.supabase
        .from('saved_searches' as any)
        .select('*')
        .eq('user_id', userId)
        .order('last_used', { ascending: false });

      if (error) {
        throw new Error(`Failed to get saved searches: ${error.message}`);
      }

      return (data as any) || [];
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  }

  async updateSavedSearch(
    id: string,
    updates: Partial<SavedSearch>
  ): Promise<SavedSearch> {
    try {
      const { data, error } = await this.supabase
        .from('saved_searches' as any)
        .update({
          ...updates,
          last_used: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update saved search: ${error.message}`);
      }

      return data as any;
    } catch (error) {
      console.error('Error updating saved search:', error);
      throw new Error('Failed to update saved search');
    }
  }

  async deleteSavedSearch(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('saved_searches' as any)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete saved search: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw new Error('Failed to delete saved search');
    }
  }

  async getSearchHistory(userId: string, limit = 10): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('search_history' as any)
        .select('query')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get search history: ${error.message}`);
      }

      return ((data as any) || []).map((item: any) => item.query);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  async addToSearchHistory(userId: string, query: string): Promise<void> {
    if (!query.trim()) return;

    try {
      // Check if query already exists in recent history
      const { data: existing } = await this.supabase
        .from('search_history' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('query', query.trim())
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ) // Last 24 hours
        .single();

      if (existing) {
        // Update timestamp if exists
        await this.supabase
          .from('search_history' as any)
          .update({ created_at: new Date().toISOString() })
          .eq('id', (existing as any).id);
      } else {
        // Insert new search
        await this.supabase.from('search_history' as any).insert({
          user_id: userId,
          query: query.trim(),
        });
      }

      // Clean up old history (keep only last 50 searches)
      const { data: oldSearches } = await this.supabase
        .from('search_history' as any)
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(50, 1000);

      if (oldSearches && oldSearches.length > 0) {
        await this.supabase
          .from('search_history' as any)
          .delete()
          .in(
            'id',
            (oldSearches as any[]).map((s: any) => s.id)
          );
      }
    } catch (error) {
      console.error('Error adding to search history:', error);
      // Don't throw error for history tracking
    }
  }

  async clearSearchHistory(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('search_history' as any)
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to clear search history: ${error.message}`);
      }
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw new Error('Failed to clear search history');
    }
  }

  // Advanced search with faceted results
  async facetedSearch(filters: AdvancedSearchFilters): Promise<{
    results: SearchResult<Article | NewsArticle>;
    facets: {
      categories: Array<{ id: string; name: string; count: number }>;
      tags: Array<{ name: string; count: number }>;
      authors: Array<{ id: string; name: string; count: number }>;
      difficulty: Array<{ level: string; count: number }>;
    };
  }> {
    try {
      // Get main search results
      const results = await this.searchContent(filters);

      // Get facet counts
      const { data: facetData } = await this.supabase.rpc(
        'get_search_facets' as any,
        {
          search_query: filters.query || '',
          search_categories: filters.categories || [],
          search_tags: filters.tags || [],
          search_difficulty: filters.difficulty,
          search_author: filters.author,
          search_content_type: filters.contentType || 'all',
          search_date_from: filters.dateRange?.from?.toISOString(),
          search_date_to: filters.dateRange?.to?.toISOString(),
          search_locale: filters.locale || 'en',
        }
      );

      return {
        results,
        facets: (facetData as any) || {
          categories: [],
          tags: [],
          authors: [],
          difficulty: [],
        },
      };
    } catch (error) {
      console.error('Error performing faceted search:', error);
      throw new Error('Failed to perform faceted search');
    }
  }
}

export const searchService = new SearchService();
