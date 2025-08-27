// Cache management system for API calls and static content

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      staleWhileRevalidate: true,
      ...config,
    };
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldest = this.cache.keys().next();
      if (!oldest.done) {
        this.cache.delete(oldest.value as string);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.config.ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;

    if (isExpired && !this.config.staleWhileRevalidate) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired && !this.config.staleWhileRevalidate) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let fresh = 0;

    for (const [, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        fresh++;
      }
    }

    return {
      total: this.cache.size,
      fresh,
      expired,
      hitRate: fresh / (fresh + expired) || 0,
    };
  }
}

// Cache instances for different types of data
export const apiCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  staleWhileRevalidate: true,
});

export const userCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 20,
  staleWhileRevalidate: true,
});

export const staticCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
});

// Cache wrapper for API calls
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheInstance: MemoryCache = apiCache,
  keyGenerator?: (...args: T) => string
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Check cache first
    const cached = cacheInstance.get<R>(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    try {
      const result = await fn(...args);
      cacheInstance.set(key, result);
      return result;
    } catch (error) {
      // Return stale data if available during errors
      const stale = cacheInstance.get<R>(key);
      if (stale) {
        console.warn('Returning stale data due to error:', error);
        return stale;
      }
      throw error;
    }
  };
}

// React Query configuration for server state caching
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
};

// Browser storage utilities
export const browserCache = {
  // Session storage for temporary data
  session: {
    set: (key: string, data: any) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, JSON.stringify(data));
      }
    },
    get: <T>(key: string): T | null => {
      if (typeof window === 'undefined') return null;
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    remove: (key: string) => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    },
  },

  // Local storage for persistent data
  local: {
    set: (key: string, data: any, ttl?: number) => {
      if (typeof window !== 'undefined') {
        const item = {
          data,
          timestamp: Date.now(),
          ttl: ttl || 24 * 60 * 60 * 1000, // 24 hours default
        };
        localStorage.setItem(key, JSON.stringify(item));
      }
    },
    get: <T>(key: string): T | null => {
      if (typeof window === 'undefined') return null;
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);
        const isExpired = Date.now() - parsed.timestamp > parsed.ttl;

        if (isExpired) {
          localStorage.removeItem(key);
          return null;
        }

        return parsed.data;
      } catch {
        return null;
      }
    },
    remove: (key: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    },
  },
};

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate all caches
  invalidateAll: () => {
    apiCache.clear();
    userCache.clear();
    staticCache.clear();
  },

  // Invalidate specific patterns
  invalidatePattern: (pattern: string) => {
    // This would be implemented with a more sophisticated cache
    // that supports pattern-based invalidation
    console.log(`Invalidating cache pattern: ${pattern}`);
  },

  // Invalidate user-specific data
  invalidateUser: (userId: string) => {
    userCache.delete(`user:${userId}`);
    apiCache.delete(`user:${userId}:progress`);
    apiCache.delete(`user:${userId}:achievements`);
  },
};
