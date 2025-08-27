import { createClient } from '@/lib/supabase/server';
import { contentCache } from '../cache/contentCache';

export interface HomepageStats {
  totalArticles: number;
  totalNews: number;
  totalCourses: number;
  activeUsers: number;
  lastUpdated: string;
}

export interface DetailedHomepageStats extends HomepageStats {
  recentArticles: number; // Articles published in last 7 days
  recentNews: number; // News published in last 7 days
  popularCategories: Array<{ category: string; count: number }>;
  topContributors: Array<{ name: string; articles: number }>;
}

class HomepageStatsService {
  private readonly CACHE_KEY = 'homepage:stats';
  private readonly DETAILED_CACHE_KEY = 'homepage:stats:detailed';
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly FALLBACK_CACHE_TTL = 3600; // 1 hour for fallback data

  /**
   * Get basic homepage statistics with caching and fallbacks
   */
  async getBasicStats(): Promise<HomepageStats> {
    try {
      // Try to get from cache first
      const cached = await this.getCachedStats();
      if (cached) {
        return cached;
      }

      // Fetch fresh data
      const stats = await this.fetchBasicStatsFromDatabase();

      // Cache the results
      await this.cacheStats(stats);

      return stats;
    } catch (error) {
      console.error('Error fetching homepage stats:', error);

      // Try to get stale cache data
      const staleData = await this.getStaleStats();
      if (staleData) {
        return staleData;
      }

      // Return fallback data
      return this.getFallbackStats();
    }
  }

  /**
   * Get detailed homepage statistics
   */
  async getDetailedStats(): Promise<DetailedHomepageStats> {
    try {
      // Try to get from cache first
      const cached = await this.getCachedDetailedStats();
      if (cached) {
        return cached;
      }

      // Fetch fresh data
      const stats = await this.fetchDetailedStatsFromDatabase();

      // Cache the results
      await this.cacheDetailedStats(stats);

      return stats;
    } catch (error) {
      console.error('Error fetching detailed homepage stats:', error);

      // Fallback to basic stats with empty detailed fields
      const basicStats = await this.getBasicStats();
      return {
        ...basicStats,
        recentArticles: 0,
        recentNews: 0,
        popularCategories: [],
        topContributors: [],
      };
    }
  }

  /**
   * Fetch basic statistics from database with optimized queries
   */
  private async fetchBasicStatsFromDatabase(): Promise<HomepageStats> {
    const supabase = createClient();

    // Execute all queries in parallel for better performance
    const [articlesResult, newsResult, coursesResult, usersResult] =
      await Promise.allSettled([
        // Count published articles using optimized query
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),

        // Count news articles
        supabase
          .from('news_articles' as any)
          .select('id', { count: 'exact', head: true }),

        // Count published courses
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),

        // Count total registered users
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

    // Extract counts with fallbacks
    const totalArticles =
      articlesResult.status === 'fulfilled'
        ? articlesResult.value.count || 0
        : 0;

    const totalNews =
      newsResult.status === 'fulfilled' ? newsResult.value.count || 0 : 0;

    const totalCourses =
      coursesResult.status === 'fulfilled' ? coursesResult.value.count || 0 : 0;

    const activeUsers =
      usersResult.status === 'fulfilled' ? usersResult.value.count || 0 : 0;

    return {
      totalArticles,
      totalNews,
      totalCourses,
      activeUsers,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Fetch detailed statistics from database
   */
  private async fetchDetailedStatsFromDatabase(): Promise<DetailedHomepageStats> {
    const basicStats = await this.fetchBasicStatsFromDatabase();
    const supabase = createClient();

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [
      recentArticlesResult,
      recentNewsResult,
      categoriesResult,
      contributorsResult,
    ] = await Promise.allSettled([
      // Count recent articles
      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', sevenDaysAgo),

      // Count recent news
      supabase
        .from('news_articles' as any)
        .select('id', { count: 'exact', head: true })
        .gte('published_at', sevenDaysAgo),

      // Get popular categories
      supabase
        .from('articles')
        .select('category')
        .eq('status', 'published')
        .not('category', 'is', null)
        .not('category', 'eq', ''),

      // Get top contributors
      supabase
        .from('articles')
        .select(
          `
          author_id,
          profiles!inner(display_name, username)
        `
        )
        .eq('status', 'published')
        .gte('published_at', sevenDaysAgo),
    ]);

    // Process results
    const recentArticles =
      recentArticlesResult.status === 'fulfilled'
        ? recentArticlesResult.value.count || 0
        : 0;

    const recentNews =
      recentNewsResult.status === 'fulfilled'
        ? recentNewsResult.value.count || 0
        : 0;

    // Process categories
    let popularCategories: Array<{ category: string; count: number }> = [];
    if (
      categoriesResult.status === 'fulfilled' &&
      categoriesResult.value.data
    ) {
      const categoryCount = new Map<string, number>();
      categoriesResult.value.data.forEach((item: any) => {
        if (item.category) {
          categoryCount.set(
            item.category,
            (categoryCount.get(item.category) || 0) + 1
          );
        }
      });

      popularCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    // Process contributors
    let topContributors: Array<{ name: string; articles: number }> = [];
    if (
      contributorsResult.status === 'fulfilled' &&
      contributorsResult.value.data
    ) {
      const contributorCount = new Map<string, number>();
      contributorsResult.value.data.forEach((item: any) => {
        const profile = item.profiles;
        if (profile) {
          const name = profile.display_name || profile.username || 'Anonymous';
          contributorCount.set(name, (contributorCount.get(name) || 0) + 1);
        }
      });

      topContributors = Array.from(contributorCount.entries())
        .map(([name, articles]) => ({ name, articles }))
        .sort((a, b) => b.articles - a.articles)
        .slice(0, 5);
    }

    return {
      ...basicStats,
      recentArticles,
      recentNews,
      popularCategories,
      topContributors,
    };
  }

  /**
   * Get cached basic stats
   */
  private async getCachedStats(): Promise<HomepageStats | null> {
    try {
      const cached = await contentCache.client.get(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  /**
   * Get cached detailed stats
   */
  private async getCachedDetailedStats(): Promise<DetailedHomepageStats | null> {
    try {
      const cached = await contentCache.client.get(this.DETAILED_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  /**
   * Cache basic stats
   */
  private async cacheStats(stats: HomepageStats): Promise<void> {
    try {
      await contentCache.client.setex(
        this.CACHE_KEY,
        this.CACHE_TTL,
        JSON.stringify(stats)
      );

      // Also store as fallback with longer TTL
      await contentCache.client.setex(
        `${this.CACHE_KEY}:fallback`,
        this.FALLBACK_CACHE_TTL,
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Cache detailed stats
   */
  private async cacheDetailedStats(
    stats: DetailedHomepageStats
  ): Promise<void> {
    try {
      await contentCache.client.setex(
        this.DETAILED_CACHE_KEY,
        this.CACHE_TTL,
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Get stale cache data as fallback
   */
  private async getStaleStats(): Promise<HomepageStats | null> {
    try {
      const stale = await contentCache.client.get(`${this.CACHE_KEY}:fallback`);
      if (stale) {
        return JSON.parse(stale);
      }
    } catch (error) {
      console.error('Stale cache read error:', error);
    }
    return null;
  }

  /**
   * Get fallback stats when all else fails
   */
  private getFallbackStats(): HomepageStats {
    return {
      totalArticles: 0,
      totalNews: 0,
      totalCourses: 0,
      activeUsers: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Invalidate homepage stats cache
   */
  async invalidateCache(): Promise<void> {
    try {
      await Promise.all([
        contentCache.client.del(this.CACHE_KEY),
        contentCache.client.del(this.DETAILED_CACHE_KEY),
        contentCache.client.del(`${this.CACHE_KEY}:fallback`),
      ]);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Warm up the cache by pre-fetching data
   */
  async warmupCache(): Promise<void> {
    try {
      await Promise.all([this.getBasicStats(), this.getDetailedStats()]);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  /**
   * Get cache status and performance metrics
   */
  async getCacheMetrics(): Promise<{
    basicStatsCache: { exists: boolean; ttl: number };
    detailedStatsCache: { exists: boolean; ttl: number };
    fallbackCache: { exists: boolean; ttl: number };
  }> {
    try {
      const [basicTtl, detailedTtl, fallbackTtl] = await Promise.all([
        contentCache.client.ttl(this.CACHE_KEY),
        contentCache.client.ttl(this.DETAILED_CACHE_KEY),
        contentCache.client.ttl(`${this.CACHE_KEY}:fallback`),
      ]);

      return {
        basicStatsCache: { exists: basicTtl > 0, ttl: basicTtl },
        detailedStatsCache: { exists: detailedTtl > 0, ttl: detailedTtl },
        fallbackCache: { exists: fallbackTtl > 0, ttl: fallbackTtl },
      };
    } catch (error) {
      console.error('Cache metrics error:', error);
      return {
        basicStatsCache: { exists: false, ttl: 0 },
        detailedStatsCache: { exists: false, ttl: 0 },
        fallbackCache: { exists: false, ttl: 0 },
      };
    }
  }
}

// Export singleton instance
export const homepageStatsService = new HomepageStatsService();
