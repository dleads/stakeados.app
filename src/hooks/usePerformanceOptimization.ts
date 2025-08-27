'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// import { contentCache } from '@/lib/cache/contentCache'

// Hook for debouncing values (useful for search inputs)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () => {
            lastCall.current = Date.now();
            callback(...args);
          },
          delay - (now - lastCall.current)
        );
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}

// Hook for caching API responses
export function useCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
    enabled?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const { ttl = 300, staleWhileRevalidate = true, enabled = true } = options;

  const fetchData = useCallback(
    async (useCache = true) => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        // Try cache first
        if (useCache) {
          // Note: This is a simplified cache implementation
          // In a real implementation, you would use contentCache methods
          console.log('Cache lookup for key:', key);
        }

        // Fetch fresh data
        const freshData = await queryFn();

        // Cache the result (simplified)
        console.log('Caching result for key:', key);

        setData(freshData);
        setIsStale(false);
        return freshData;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [key, queryFn, ttl, staleWhileRevalidate, enabled]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(false), [fetchData]);
  const invalidate = useCallback(async () => {
    // Note: This is a simplified cache invalidation
    console.log('Invalidating cache for key:', key);
    return fetchData(false);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    invalidate,
  };
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
}

// Hook for prefetching data
export function usePrefetch() {
  const prefetchedData = useRef<Map<string, any>>(new Map());

  const prefetch = useCallback(
    async <T>(key: string, queryFn: () => Promise<T>, _ttl: number = 300) => {
      try {
        // Check if already prefetched
        if (prefetchedData.current.has(key)) {
          return prefetchedData.current.get(key);
        }

        // Check cache (simplified)
        console.log('Checking prefetch cache for key:', key);

        // Fetch and cache (simplified)
        const data = await queryFn();
        prefetchedData.current.set(key, data);

        console.log('Caching prefetch data for key:', key);

        return data;
      } catch (error) {
        console.error('Prefetch error:', error);
        return null;
      }
    },
    []
  );

  const getPrefetched = useCallback(<T>(key: string): T | null => {
    return prefetchedData.current.get(key) || null;
  }, []);

  const clearPrefetched = useCallback((key?: string) => {
    if (key) {
      prefetchedData.current.delete(key);
    } else {
      prefetchedData.current.clear();
    }
  }, []);

  return { prefetch, getPrefetched, clearPrefetched };
}

// Hook for performance monitoring
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<{
    duration: number;
    memory?: number;
    renderCount: number;
  }>({
    duration: 0,
    renderCount: 0,
  });

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;

    setMetrics(prev => ({
      duration,
      memory: (performance as any).memory?.usedJSHeapSize,
      renderCount: prev.renderCount + 1,
    }));

    // Log performance data in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance [${name}]:`, {
        duration: `${duration.toFixed(2)}ms`,
        memory: (performance as any).memory?.usedJSHeapSize
          ? `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
          : 'N/A',
      });
    }
  }, [name]);

  useEffect(() => {
    start();
    return end;
  });

  return { metrics, start, end };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (optimisticData: T) => {
      // Apply optimistic update
      setData(optimisticData);
      setIsOptimistic(true);
      setError(null);

      try {
        // Perform actual update
        const result = await updateFn(optimisticData);
        setData(result);
      } catch (err) {
        // Revert on error
        setData(initialData);
        setError(err instanceof Error ? err : new Error('Update failed'));
      } finally {
        setIsOptimistic(false);
      }
    },
    [initialData, updateFn]
  );

  return { data, isOptimistic, error, update };
}

// Hook for batch operations
export function useBatchOperations<T>(
  batchSize: number = 10,
  delay: number = 100
) {
  const [queue, setQueue] = useState<T[]>([]);
  const [processing, setProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addToQueue = useCallback((item: T) => {
    setQueue(prev => [...prev, item]);
  }, []);

  const processBatch = useCallback(
    async (processor: (batch: T[]) => Promise<void>) => {
      if (queue.length === 0 || processing) return;

      setProcessing(true);

      try {
        const batch = queue.slice(0, batchSize);
        setQueue(prev => prev.slice(batchSize));

        await processor(batch);

        // Process remaining items after delay
        if (queue.length > batchSize) {
          timeoutRef.current = setTimeout(() => {
            setProcessing(false);
            processBatch(processor);
          }, delay);
        } else {
          setProcessing(false);
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        setProcessing(false);
      }
    },
    [queue, processing, batchSize, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { queue, processing, addToQueue, processBatch };
}

// Hook for resource cleanup
export function useResourceCleanup() {
  const resources = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    resources.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    resources.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    resources.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
}
