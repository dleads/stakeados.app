import { createClient } from '@/lib/supabase/client';
import type {
  NewsSource,
  NewsSourceCategory,
  NewsSourceHealth,
  NewsSourceWithHealth,
  CreateNewsSourceRequest,
  UpdateNewsSourceRequest,
  NewsSourceFilters,
  NewsSourceStats,
} from '@/types/news';

export class NewsSourceService {
  private supabase = createClient();

  // Get all news sources with optional filtering
  async getNewsSources(
    filters?: NewsSourceFilters
  ): Promise<NewsSourceWithHealth[]> {
    let query = this.supabase
      .from('news_sources' as any)
      .select(
        `
        *,
        health_status:news_source_health(
          status,
          check_timestamp,
          response_time,
          articles_fetched,
          error_message
        ),
        categories_info:news_source_category_mapping(
          category:news_source_categories(*)
        )
      `
      )
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.source_type) {
      query = query.eq('source_type', filters.source_type);
    }
    if (filters?.language) {
      query = query.eq('language', filters.language);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.priority_min) {
      query = query.gte('priority', filters.priority_min);
    }
    if (filters?.quality_score_min) {
      query = query.gte('quality_score', filters.quality_score_min);
    }
    if (filters?.categories && filters.categories.length > 0) {
      query = query.overlaps('categories', filters.categories);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch news sources: ${error.message}`);
    }

    return (
      data?.map((source: any) => ({
        ...source,
        health_status: source.health_status?.[0] || null,
        categories_info:
          source.categories_info?.map((mapping: any) => mapping.category) || [],
      })) || []
    );
  }

  // Get a single news source by ID
  async getNewsSource(id: string): Promise<NewsSourceWithHealth | null> {
    const { data, error } = await this.supabase
      .from('news_sources' as any)
      .select(
        `
        *,
        health_status:news_source_health(
          status,
          check_timestamp,
          response_time,
          articles_fetched,
          error_message
        ),
        categories_info:news_source_category_mapping(
          category:news_source_categories(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch news source: ${error.message}`);
    }

    const dataAny = data as any;
    return {
      ...dataAny,
      health_status: dataAny.health_status?.[0] || null,
      categories_info:
        dataAny.categories_info?.map((mapping: any) => mapping.category) || [],
    };
  }

  // Create a new news source
  async createNewsSource(
    request: CreateNewsSourceRequest
  ): Promise<NewsSource> {
    const { data, error } = await this.supabase
      .from('news_sources' as any)
      .insert({
        name: request.name,
        description: request.description,
        url: request.url,
        source_type: request.source_type,
        api_key: request.api_key,
        api_endpoint: request.api_endpoint,
        headers: request.headers || {},
        categories: request.categories || [],
        language: request.language || 'en',
        fetch_interval: request.fetch_interval || 3600,
        priority: request.priority || 1,
        quality_score: request.quality_score || 5.0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create news source: ${error.message}`);
    }

    return data as any;
  }

  // Update an existing news source
  async updateNewsSource(
    id: string,
    request: UpdateNewsSourceRequest
  ): Promise<NewsSource> {
    const updateData: any = {};

    // Only include fields that are provided
    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined)
      updateData.description = request.description;
    if (request.url !== undefined) updateData.url = request.url;
    if (request.source_type !== undefined)
      updateData.source_type = request.source_type;
    if (request.api_key !== undefined) updateData.api_key = request.api_key;
    if (request.api_endpoint !== undefined)
      updateData.api_endpoint = request.api_endpoint;
    if (request.headers !== undefined) updateData.headers = request.headers;
    if (request.categories !== undefined)
      updateData.categories = request.categories;
    if (request.language !== undefined) updateData.language = request.language;
    if (request.fetch_interval !== undefined)
      updateData.fetch_interval = request.fetch_interval;
    if (request.priority !== undefined) updateData.priority = request.priority;
    if (request.quality_score !== undefined)
      updateData.quality_score = request.quality_score;
    if (request.is_active !== undefined)
      updateData.is_active = request.is_active;
    if (request.max_failures !== undefined)
      updateData.max_failures = request.max_failures;

    const { data, error } = await this.supabase
      .from('news_sources' as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update news source: ${error.message}`);
    }

    return data as any;
  }

  // Delete a news source
  async deleteNewsSource(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('news_sources' as any)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete news source: ${error.message}`);
    }
  }

  // Get sources ready for fetching
  async getSourcesReadyForFetch(): Promise<NewsSource[]> {
    const { data, error } = await this.supabase.rpc(
      'get_sources_ready_for_fetch' as any
    );

    if (error) {
      throw new Error(
        `Failed to get sources ready for fetch: ${error.message}`
      );
    }

    return data || [];
  }

  // Record health check for a source
  async recordHealthCheck(
    sourceId: string,
    status: 'healthy' | 'warning' | 'error' | 'timeout',
    responseTime?: number,
    articlesFetched?: number,
    errorMessage?: string,
    httpStatusCode?: number,
    metadata?: Record<string, any>
  ): Promise<NewsSourceHealth> {
    const { data, error } = await this.supabase
      .from('news_source_health' as any)
      .insert({
        source_id: sourceId,
        status,
        response_time: responseTime,
        articles_fetched: articlesFetched || 0,
        error_message: errorMessage,
        http_status_code: httpStatusCode,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record health check: ${error.message}`);
    }

    return data as any;
  }

  // Get health history for a source
  async getSourceHealthHistory(
    sourceId: string,
    limit: number = 50
  ): Promise<NewsSourceHealth[]> {
    const { data, error } = await this.supabase
      .from('news_source_health' as any)
      .select('*')
      .eq('source_id', sourceId)
      .order('check_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get source health history: ${error.message}`);
    }

    return (data as any) || [];
  }

  // Get news source categories
  async getNewsSourceCategories(): Promise<NewsSourceCategory[]> {
    const { data, error } = await this.supabase
      .from('news_source_categories' as any)
      .select('*')
      .order('name');

    if (error) {
      throw new Error(
        `Failed to fetch news source categories: ${error.message}`
      );
    }

    return (data as any) || [];
  }

  // Create a new news source category
  async createNewsSourceCategory(
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ): Promise<NewsSourceCategory> {
    const { data, error } = await this.supabase
      .from('news_source_categories' as any)
      .insert({
        name,
        description,
        color: color || '#00FF88',
        icon,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create news source category: ${error.message}`
      );
    }

    return data as any;
  }

  // Get news source statistics
  async getNewsSourceStats(): Promise<NewsSourceStats> {
    // Get basic source counts
    const { data: sourceCounts, error: sourceError } = await this.supabase
      .from('news_sources' as any)
      .select('is_active, quality_score');

    if (sourceError) {
      throw new Error(`Failed to get source stats: ${sourceError.message}`);
    }

    // Get health status counts
    const { data: healthCounts, error: healthError } = await this.supabase
      .from('news_source_health' as any)
      .select('status, source_id')
      .gte(
        'check_timestamp',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ); // Last 24 hours

    if (healthError) {
      throw new Error(`Failed to get health stats: ${healthError.message}`);
    }

    const totalSources = sourceCounts?.length || 0;
    const activeSources =
      sourceCounts?.filter((s: any) => s.is_active).length || 0;
    const avgQualityScore = sourceCounts?.length
      ? sourceCounts.reduce((sum, s: any) => sum + (s.quality_score || 0), 0) /
        sourceCounts.length
      : 0;

    // Get unique healthy sources from recent health checks
    const recentHealthBySource = new Map();
    healthCounts?.forEach((health: any) => {
      if (
        !recentHealthBySource.has(health.source_id) ||
        recentHealthBySource.get(health.source_id).check_timestamp <
          health.check_timestamp
      ) {
        recentHealthBySource.set(health.source_id, health);
      }
    });

    const healthySources = Array.from(recentHealthBySource.values()).filter(
      h => h.status === 'healthy'
    ).length;
    const sourcesWithErrors = Array.from(recentHealthBySource.values()).filter(
      h => h.status === 'error'
    ).length;

    return {
      total_sources: totalSources,
      active_sources: activeSources,
      healthy_sources: healthySources,
      sources_with_errors: sourcesWithErrors,
      avg_quality_score: Math.round(avgQualityScore * 100) / 100,
      last_24h_fetches: healthCounts?.length || 0,
    };
  }

  // Validate a news source URL
  async validateNewsSource(
    url: string,
    sourceType: 'rss' | 'api' | 'scraper'
  ): Promise<{
    isValid: boolean;
    error?: string;
    responseTime?: number;
    articleCount?: number;
  }> {
    try {
      const startTime = Date.now();

      if (sourceType === 'rss') {
        // For RSS feeds, try to fetch and parse
        const response = await fetch(url, {
          method: 'HEAD', // Just check if accessible
          headers: {
            'User-Agent': 'Stakeados News Aggregator 1.0',
          },
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          return {
            isValid: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            responseTime,
          };
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('xml') && !contentType.includes('rss')) {
          return {
            isValid: false,
            error: 'URL does not appear to be an RSS feed',
            responseTime,
          };
        }

        return {
          isValid: true,
          responseTime,
        };
      }

      // For API sources, basic connectivity check
      if (sourceType === 'api') {
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Stakeados News Aggregator 1.0',
          },
        });

        const responseTime = Date.now() - startTime;

        return {
          isValid: response.ok,
          error: response.ok
            ? undefined
            : `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
        };
      }

      // For scraper sources, just check if URL is accessible
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Stakeados News Aggregator 1.0',
        },
      });

      const responseTime = Date.now() - startTime;

      return {
        isValid: response.ok,
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
      };
    } catch (error) {
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const newsSourceService = new NewsSourceService();
