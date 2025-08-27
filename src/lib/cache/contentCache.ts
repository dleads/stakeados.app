import { getRedisClient } from './redis';
import type { Article, NewsArticle } from '@/types/content';

export interface ContentCacheConfig {
  articles: {
    list: { ttl: number }; // 5 minutes
    detail: { ttl: number }; // 1 hour
    search: { ttl: number }; // 10 minutes
  };
  news: {
    feed: { ttl: number }; // 3 minutes
    detail: { ttl: number }; // 30 minutes
    trending: { ttl: number }; // 5 minutes
  };
}

const CACHE_CONFIG: ContentCacheConfig = {
  articles: {
    list: { ttl: 300 }, // 5 minutes
    detail: { ttl: 3600 }, // 1 hour
    search: { ttl: 600 }, // 10 minutes
  },
  news: {
    feed: { ttl: 180 }, // 3 minutes
    detail: { ttl: 1800 }, // 30 minutes
    trending: { ttl: 300 }, // 5 minutes
  },
};

export class ContentCache {
  private redis = getRedisClient();

  // Public accessor for internal redis client (read-only)
  public get client() {
    return this.redis;
  }

  // Article caching methods
  async cacheArticleList(
    key: string,
    articles: Article[],
    ttl?: number
  ): Promise<void> {
    const cacheKey = `articles:list:${key}`;
    const cacheTtl = ttl || CACHE_CONFIG.articles.list.ttl;

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(articles));
    } catch (error) {
      console.error('Failed to cache article list:', error);
    }
  }

  async getCachedArticleList(key: string): Promise<Article[] | null> {
    const cacheKey = `articles:list:${key}`;

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached article list:', error);
      return null;
    }
  }

  async cacheArticleDetail(
    articleId: string,
    article: Article,
    ttl?: number
  ): Promise<void> {
    const cacheKey = `articles:detail:${articleId}`;
    const cacheTtl = ttl || CACHE_CONFIG.articles.detail.ttl;

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(article));
    } catch (error) {
      console.error('Failed to cache article detail:', error);
    }
  }

  async getCachedArticleDetail(articleId: string): Promise<Article | null> {
    const cacheKey = `articles:detail:${articleId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached article detail:', error);
      return null;
    }
  }

  // News caching methods
  async cacheNewsFeed(
    key: string,
    news: NewsArticle[],
    ttl?: number
  ): Promise<void> {
    const cacheKey = `news:feed:${key}`;
    const cacheTtl = ttl || CACHE_CONFIG.news.feed.ttl;

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(news));
    } catch (error) {
      console.error('Failed to cache news feed:', error);
    }
  }

  async getCachedNewsFeed(key: string): Promise<NewsArticle[] | null> {
    const cacheKey = `news:feed:${key}`;

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached news feed:', error);
      return null;
    }
  }

  async cacheNewsDetail(
    newsId: string,
    news: NewsArticle,
    ttl?: number
  ): Promise<void> {
    const cacheKey = `news:detail:${newsId}`;
    const cacheTtl = ttl || CACHE_CONFIG.news.detail.ttl;

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(news));
    } catch (error) {
      console.error('Failed to cache news detail:', error);
    }
  }

  async getCachedNewsDetail(newsId: string): Promise<NewsArticle | null> {
    const cacheKey = `news:detail:${newsId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached news detail:', error);
      return null;
    }
  }

  // Search results caching
  async cacheSearchResults(
    query: string,
    filters: any,
    results: any[],
    ttl?: number
  ): Promise<void> {
    const cacheKey = `search:${this.generateSearchKey(query, filters)}`;
    const cacheTtl = ttl || CACHE_CONFIG.articles.search.ttl;

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(results));
    } catch (error) {
      console.error('Failed to cache search results:', error);
    }
  }

  async getCachedSearchResults(
    query: string,
    filters: any
  ): Promise<any[] | null> {
    const cacheKey = `search:${this.generateSearchKey(query, filters)}`;

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached search results:', error);
      return null;
    }
  }

  // Trending content caching
  async cacheTrendingNews(news: NewsArticle[], ttl?: number): Promise<void> {
    const cacheKey = 'news:trending';
    const cacheTtl = ttl || CACHE_CONFIG.news.trending.ttl;

    try {
      await this.redis.setex(cacheKey, cacheTtl, JSON.stringify(news));
    } catch (error) {
      console.error('Failed to cache trending news:', error);
    }
  }

  async getCachedTrendingNews(): Promise<NewsArticle[] | null> {
    const cacheKey = 'news:trending';

    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached trending news:', error);
      return null;
    }
  }

  // Cache invalidation methods
  async invalidateArticleCache(articleId: string): Promise<void> {
    const patterns = [
      `articles:list:*`,
      `articles:detail:${articleId}`,
      `search:*`,
    ];

    try {
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Failed to invalidate article cache:', error);
    }
  }

  async invalidateNewsCache(newsId?: string): Promise<void> {
    const patterns = newsId
      ? [`news:feed:*`, `news:detail:${newsId}`, `news:trending`]
      : [`news:feed:*`, `news:trending`];

    try {
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Failed to invalidate news cache:', error);
    }
  }

  async invalidateSearchCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('search:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Failed to invalidate search cache:', error);
    }
  }

  // Utility methods
  private generateSearchKey(query: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return Buffer.from(`${query}:${filterString}`).toString('base64');
  }

  async clearAllCache(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      return {
        memory: info,
        keyspace: keyspace,
        connected: (await this.redis.ping()) === 'PONG',
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }
}

// Singleton instance
export const contentCache = new ContentCache();
