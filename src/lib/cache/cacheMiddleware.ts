import { NextRequest, NextResponse } from 'next/server';
import { contentCache } from './contentCache';
import { cdnService } from './cdnService';

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
  revalidate?: boolean;
  contentType?: 'images' | 'static' | 'dynamic';
}

/**
 * Cache middleware for API routes
 */
export function withCache(options: CacheOptions = {}) {
  return function cacheMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(
      req: NextRequest
    ): Promise<NextResponse> {
      const {
        ttl = 300,
        key,
        tags = [],
        revalidate = false,
        contentType = 'dynamic',
      } = options;

      // Generate cache key from request
      const cacheKey = key || generateCacheKey(req);

      // Check for cache hit (unless revalidating)
      if (!revalidate) {
        try {
          const cached = await contentCache.client.get(cacheKey);
          if (cached) {
            const { data, headers } = JSON.parse(cached);
            const response = new NextResponse(data);

            // Set cached headers
            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value as string);
            });

            // Add cache hit header
            response.headers.set('X-Cache', 'HIT');
            response.headers.set('X-Cache-Key', cacheKey);

            return response;
          }
        } catch (error) {
          console.error('Cache read error:', error);
        }
      }

      // Execute handler
      const response = await handler(req);

      // Cache successful responses
      if (response.ok) {
        try {
          const data = await response.text();
          const headers = Object.fromEntries(response.headers.entries());

          // Add cache headers
          const cacheHeaders = cdnService.getCacheHeaders(contentType);
          Object.entries(cacheHeaders).forEach(([key, value]) => {
            headers[key] = value;
          });

          // Store in cache
          await contentCache.client.setex(
            cacheKey,
            ttl,
            JSON.stringify({ data, headers })
          );

          // Store cache tags for invalidation
          if (tags.length > 0) {
            for (const tag of tags) {
              await contentCache.client.sadd(`cache:tags:${tag}`, cacheKey);
              await contentCache.client.expire(`cache:tags:${tag}`, ttl);
            }
          }

          // Create new response with cached data and headers
          const cachedResponse = new NextResponse(data);
          Object.entries(headers).forEach(([key, value]) => {
            cachedResponse.headers.set(key, value);
          });

          cachedResponse.headers.set('X-Cache', 'MISS');
          cachedResponse.headers.set('X-Cache-Key', cacheKey);

          return cachedResponse;
        } catch (error) {
          console.error('Cache write error:', error);
        }
      }

      return response;
    };
  };
}

/**
 * Invalidate cache by tags
 */
export async function invalidateCacheByTags(tags: string[]): Promise<void> {
  try {
    for (const tag of tags) {
      const cacheKeys = await contentCache.client.smembers(`cache:tags:${tag}`);

      if (cacheKeys.length > 0) {
        // Delete cache entries
        await contentCache.client.del(...cacheKeys);
        // Delete tag set
        await contentCache.client.del(`cache:tags:${tag}`);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();

  // Include relevant headers in cache key
  const relevantHeaders = ['accept-language', 'authorization']
    .map(header => {
      const value = req.headers.get(header);
      return value ? `${header}:${value}` : '';
    })
    .filter(Boolean)
    .join('|');

  const keyParts = [method, pathname, searchParams, relevantHeaders].filter(
    Boolean
  );
  return `api:${Buffer.from(keyParts.join('|')).toString('base64')}`;
}

/**
 * Cache decorator for service methods
 */
export function cached(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const { ttl = 300, key } = options;
      const cacheKey =
        key ||
        `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Check cache
        const cached = await contentCache.client.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }

      // Execute method
      const result = await method.apply(this, args);

      try {
        // Cache result
        await contentCache.client.setex(cacheKey, ttl, JSON.stringify(result));
      } catch (error) {
        console.error('Cache write error:', error);
      }

      return result;
    };
  };
}

/**
 * React Query cache integration
 */
export function getQueryCacheKey(queryKey: any[]): string {
  return `query:${JSON.stringify(queryKey)}`;
}

export async function prefetchQuery(
  queryKey: any[],
  data: any,
  ttl: number = 300
): Promise<void> {
  try {
    const cacheKey = getQueryCacheKey(queryKey);
    await contentCache.client.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Query prefetch error:', error);
  }
}

export async function getCachedQuery(queryKey: any[]): Promise<any | null> {
  try {
    const cacheKey = getQueryCacheKey(queryKey);
    const cached = await contentCache.client.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Query cache read error:', error);
    return null;
  }
}
