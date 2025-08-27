import { contentCache } from './contentCache';
import { withCache, invalidateCacheByTags } from './cacheMiddleware';

// Cache configuration for homepage data
export const HOMEPAGE_CACHE_CONFIG = {
  stats: {
    ttl: 300, // 5 minutes
    tags: ['homepage', 'stats'],
    key: 'homepage:stats',
  },
  news: {
    ttl: 180, // 3 minutes
    tags: ['homepage', 'news'],
    key: 'homepage:news',
  },
  articles: {
    ttl: 600, // 10 minutes
    tags: ['homepage', 'articles'],
    key: 'homepage:articles',
  },
  courses: {
    ttl: 1800, // 30 minutes
    tags: ['homepage', 'courses'],
    key: 'homepage:courses',
  },
};

// Cache middleware for homepage API routes
export const withHomepageCache = (
  section: keyof typeof HOMEPAGE_CACHE_CONFIG
) => {
  const config = HOMEPAGE_CACHE_CONFIG[section];
  return withCache({
    ttl: config.ttl,
    tags: config.tags,
    key: config.key,
    contentType: 'dynamic',
  });
};

// Prefetch homepage data
export async function prefetchHomepageData(locale: string) {
  const prefetchPromises = [
    prefetchStats(),
    prefetchNews(locale),
    prefetchArticles(locale),
    prefetchCourses(locale),
  ];

  try {
    await Promise.allSettled(prefetchPromises);
  } catch (error) {
    console.error('Failed to prefetch homepage data:', error);
  }
}

async function prefetchStats() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stats/homepage`
    );
    if (response.ok) {
      const data = await response.json();
      await contentCache.client.setex(
        HOMEPAGE_CACHE_CONFIG.stats.key,
        HOMEPAGE_CACHE_CONFIG.stats.ttl,
        JSON.stringify(data)
      );
    }
  } catch (error) {
    console.error('Failed to prefetch stats:', error);
  }
}

async function prefetchNews(locale: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/news?limit=6&locale=${locale}`
    );
    if (response.ok) {
      const data = await response.json();
      await contentCache.client.setex(
        `${HOMEPAGE_CACHE_CONFIG.news.key}:${locale}`,
        HOMEPAGE_CACHE_CONFIG.news.ttl,
        JSON.stringify(data)
      );
    }
  } catch (error) {
    console.error('Failed to prefetch news:', error);
  }
}

async function prefetchArticles(locale: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/articles?limit=4&locale=${locale}&status=published`
    );
    if (response.ok) {
      const data = await response.json();
      await contentCache.client.setex(
        `${HOMEPAGE_CACHE_CONFIG.articles.key}:${locale}`,
        HOMEPAGE_CACHE_CONFIG.articles.ttl,
        JSON.stringify(data)
      );
    }
  } catch (error) {
    console.error('Failed to prefetch articles:', error);
  }
}

async function prefetchCourses(locale: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/courses?limit=3&locale=${locale}&published=true`
    );
    if (response.ok) {
      const data = await response.json();
      await contentCache.client.setex(
        `${HOMEPAGE_CACHE_CONFIG.courses.key}:${locale}`,
        HOMEPAGE_CACHE_CONFIG.courses.ttl,
        JSON.stringify(data)
      );
    }
  } catch (error) {
    console.error('Failed to prefetch courses:', error);
  }
}

// Invalidate homepage cache when content changes
export async function invalidateHomepageCache(
  section?: keyof typeof HOMEPAGE_CACHE_CONFIG
) {
  if (section) {
    await invalidateCacheByTags(HOMEPAGE_CACHE_CONFIG[section].tags);
  } else {
    // Invalidate all homepage cache
    await invalidateCacheByTags(['homepage']);
  }
}

// Get cached homepage data
export async function getCachedHomepageData(locale: string) {
  try {
    const [stats, news, articles, courses] = await Promise.all([
      contentCache.client.get(HOMEPAGE_CACHE_CONFIG.stats.key),
      contentCache.client.get(`${HOMEPAGE_CACHE_CONFIG.news.key}:${locale}`),
      contentCache.client.get(
        `${HOMEPAGE_CACHE_CONFIG.articles.key}:${locale}`
      ),
      contentCache.client.get(`${HOMEPAGE_CACHE_CONFIG.courses.key}:${locale}`),
    ]);

    return {
      stats: stats ? JSON.parse(stats) : null,
      news: news ? JSON.parse(news) : null,
      articles: articles ? JSON.parse(articles) : null,
      courses: courses ? JSON.parse(courses) : null,
    };
  } catch (error) {
    console.error('Failed to get cached homepage data:', error);
    return {
      stats: null,
      news: null,
      articles: null,
      courses: null,
    };
  }
}

// Warm up cache for all locales
export async function warmupHomepageCache() {
  const locales = ['en', 'es'];

  for (const locale of locales) {
    await prefetchHomepageData(locale);
  }
}
