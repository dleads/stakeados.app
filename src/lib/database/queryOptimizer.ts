import { createClient } from '@supabase/supabase-js';
import { contentCache } from '../cache/contentCache';

export interface QueryOptions {
  cache?: boolean;
  cacheTtl?: number;
  useIndex?: string;
  explain?: boolean;
}

export interface QueryPerformanceMetrics {
  executionTime: number;
  rowsReturned: number;
  indexUsed: boolean;
  cacheHit: boolean;
  queryPlan?: any;
}

export class QueryOptimizer {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Execute optimized query with caching and performance monitoring
   */
  async executeOptimizedQuery<T>(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<{ data: T[]; metrics: QueryPerformanceMetrics }> {
    const startTime = Date.now();
    const { cache = true, cacheTtl = 300, explain = false } = options;

    // Generate cache key
    const cacheKey = cache ? this.generateCacheKey(query, params) : null;

    // Check cache first
    if (cacheKey) {
      try {
        const cached = await contentCache.client.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          return {
            data,
            metrics: {
              executionTime: Date.now() - startTime,
              rowsReturned: data.length,
              indexUsed: true, // Assume cached queries were optimized
              cacheHit: true,
            },
          };
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }
    }

    // Execute query with optional EXPLAIN
    let queryPlan: any = null;
    if (explain) {
      try {
        const { data: planData } = await this.supabase.rpc('explain_query', {
          query_text: query,
        });
        queryPlan = planData;
      } catch (error) {
        console.error('Query explain error:', error);
      }
    }

    // Execute the actual query
    const { data, error } = await this.supabase.rpc('execute_optimized_query', {
      query_text: query,
      query_params: params,
    });

    if (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }

    const executionTime = Date.now() - startTime;

    // Cache the results
    if (cacheKey && data) {
      try {
        await contentCache.client.setex(
          cacheKey,
          cacheTtl,
          JSON.stringify(data)
        );
      } catch (error) {
        console.error('Cache write error:', error);
      }
    }

    return {
      data: data || [],
      metrics: {
        executionTime,
        rowsReturned: data?.length || 0,
        indexUsed: this.detectIndexUsage(queryPlan),
        cacheHit: false,
        queryPlan,
      },
    };
  }

  /**
   * Get trending articles with optimized query
   */
  async getTrendingArticles(
    limit: number = 10,
    days: number = 7,
    locale: string = 'en'
  ) {
    const cacheKey = `trending_articles:${limit}:${days}:${locale}`;

    try {
      const cached = await contentCache.getCachedArticleList(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('Cache error:', error);
    }

    const { data } = await this.supabase.rpc('get_trending_articles', {
      p_limit: limit,
      p_days: days,
      p_locale: locale,
    });

    if (data) {
      await contentCache.cacheArticleList(cacheKey, data, 300); // 5 minutes
    }

    return data || [];
  }

  /**
   * Get personalized news feed with optimized query
   */
  async getPersonalizedNewsFeed(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const cacheKey = `personalized_news:${userId}:${limit}:${offset}`;

    try {
      const cached = await contentCache.getCachedNewsFeed(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('Cache error:', error);
    }

    const { data } = await this.supabase.rpc('get_personalized_news_feed', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    });

    if (data) {
      await contentCache.cacheNewsFeed(cacheKey, data, 180); // 3 minutes
    }

    return data || [];
  }

  /**
   * Advanced content search with optimization
   */
  async searchContent(
    query: string,
    contentType: 'articles' | 'news' | 'all' = 'all',
    categories: string[] = [],
    tags: string[] = [],
    locale: string = 'en',
    limit: number = 20,
    offset: number = 0
  ) {
    // Nota: la clave de búsqueda se genera internamente en el método de caché

    try {
      const cached = await contentCache.getCachedSearchResults(query, {
        contentType,
        categories,
        tags,
        locale,
        limit,
        offset,
      });
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('Cache error:', error);
    }

    const { data } = await this.supabase.rpc('search_content', {
      p_query: query,
      p_content_type: contentType,
      p_categories: categories.length > 0 ? categories : null,
      p_tags: tags.length > 0 ? tags : null,
      p_locale: locale,
      p_limit: limit,
      p_offset: offset,
    });

    if (data) {
      await contentCache.cacheSearchResults(
        query,
        { contentType, categories, tags, locale, limit, offset },
        data,
        600 // 10 minutes
      );
    }

    return data || [];
  }

  /**
   * Get query performance statistics
   */
  async getQueryPerformanceStats() {
    const { data } = await this.supabase.rpc('get_slow_queries', {
      p_limit: 20,
    });

    return data || [];
  }

  /**
   * Get table statistics for optimization analysis
   */
  async getTableStats() {
    const { data } = await this.supabase.rpc('analyze_table_stats');
    return data || [];
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats() {
    const { data } = await this.supabase
      .from('index_usage_stats')
      .select('*')
      .order('idx_scan', { ascending: false });

    return data || [];
  }

  /**
   * Get table access patterns
   */
  async getTableAccessStats() {
    const { data } = await this.supabase
      .from('table_access_stats')
      .select('*')
      .order('seq_scan', { ascending: false });

    return data || [];
  }

  /**
   * Refresh materialized views
   */
  async refreshMaterializedViews() {
    try {
      await Promise.all([
        this.supabase.rpc('refresh_article_stats'),
        this.supabase.rpc('refresh_trending_content'),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to refresh materialized views:', error);
      return false;
    }
  }

  /**
   * Update article view counts from interactions
   */
  async updateArticleViewCounts() {
    try {
      await this.supabase.rpc('update_article_view_counts');
      return true;
    } catch (error) {
      console.error('Failed to update article view counts:', error);
      return false;
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQueryPerformance(query: string): Promise<{
    suggestions: string[];
    estimatedCost: number;
    indexRecommendations: string[];
  }> {
    try {
      const { data } = await this.supabase.rpc('explain_query', {
        query_text: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`,
      });

      const plan = data?.[0]?.['QUERY PLAN']?.[0];
      if (!plan) {
        return {
          suggestions: ['Unable to analyze query'],
          estimatedCost: 0,
          indexRecommendations: [],
        };
      }

      const suggestions: string[] = [];
      const indexRecommendations: string[] = [];

      // Analyze execution time
      if (plan['Execution Time'] > 1000) {
        suggestions.push(
          'Query execution time is high (>1s). Consider optimization.'
        );
      }

      // Check for sequential scans
      if (this.hasSequentialScan(plan)) {
        suggestions.push(
          'Query uses sequential scans. Consider adding indexes.'
        );
        indexRecommendations.push('Add indexes on frequently filtered columns');
      }

      // Check for sorting operations
      if (this.hasSortOperation(plan)) {
        suggestions.push(
          'Query performs sorting. Consider adding composite indexes.'
        );
      }

      return {
        suggestions,
        estimatedCost: plan['Total Cost'] || 0,
        indexRecommendations,
      };
    } catch (error) {
      console.error('Query analysis error:', error);
      return {
        suggestions: ['Query analysis failed'],
        estimatedCost: 0,
        indexRecommendations: [],
      };
    }
  }

  /**
   * Generate cache key for query and parameters
   */
  private generateCacheKey(query: string, params: any[]): string {
    const key = `${query}:${JSON.stringify(params)}`;
    return `query:${Buffer.from(key).toString('base64')}`;
  }

  /**
   * Detect if query plan uses indexes
   */
  private detectIndexUsage(queryPlan: any): boolean {
    if (!queryPlan) return false;

    const planString = JSON.stringify(queryPlan).toLowerCase();
    return (
      planString.includes('index scan') ||
      planString.includes('bitmap heap scan')
    );
  }

  /**
   * Check if query plan has sequential scans
   */
  private hasSequentialScan(plan: any): boolean {
    if (!plan) return false;

    if (plan['Node Type'] === 'Seq Scan') return true;

    if (plan.Plans) {
      return plan.Plans.some((subPlan: any) => this.hasSequentialScan(subPlan));
    }

    return false;
  }

  /**
   * Check if query plan has sort operations
   */
  private hasSortOperation(plan: any): boolean {
    if (!plan) return false;

    if (plan['Node Type'] === 'Sort') return true;

    if (plan.Plans) {
      return plan.Plans.some((subPlan: any) => this.hasSortOperation(subPlan));
    }

    return false;
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();
