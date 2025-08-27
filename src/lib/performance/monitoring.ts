// Performance monitoring and optimization utilities

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime, 'ms');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric(
              'FID',
              entry.processingStart - entry.startTime,
              'ms'
            );
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          let clsValue = 0;
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordMetric('CLS', clsValue, 'score');
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Navigation timing
        const navigationObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric(
              'TTFB',
              entry.responseStart - entry.requestStart,
              'ms'
            );
            this.recordMetric(
              'DOM_LOAD',
              entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              'ms'
            );
            this.recordMetric(
              'LOAD_COMPLETE',
              entry.loadEventEnd - entry.loadEventStart,
              'ms'
            );
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Performance observers not supported:', error);
      }
    }
  }

  recordMetric(name: string, value: number, unit: string = 'ms') {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Measure function execution time
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.recordMetric(`FUNCTION_${name.toUpperCase()}`, end - start, 'ms');
    return result;
  }

  // Measure async function execution time
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.recordMetric(`ASYNC_${name.toUpperCase()}`, end - start, 'ms');
    return result;
  }

  // Resource timing analysis
  analyzeResourceTiming() {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      totalDuration: 0,
      byType: {} as Record<
        string,
        { count: number; size: number; duration: number }
      >,
      slowResources: [] as Array<{
        name: string;
        duration: number;
        size: number;
      }>,
    };

    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.requestStart;
      const size = resource.transferSize || 0;

      analysis.totalDuration += duration;
      analysis.totalSize += size;

      // Categorize by type
      const type = this.getResourceType(resource.name);
      if (!analysis.byType[type]) {
        analysis.byType[type] = { count: 0, size: 0, duration: 0 };
      }
      analysis.byType[type].count++;
      analysis.byType[type].size += size;
      analysis.byType[type].duration += duration;

      // Track slow resources (>1s)
      if (duration > 1000) {
        analysis.slowResources.push({
          name: resource.name,
          duration,
          size,
        });
      }
    });

    return analysis;
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp'))
      return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  // Memory usage monitoring
  getMemoryUsage() {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance utilities
export const performanceUtils = {
  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Intersection Observer for lazy loading
  createIntersectionObserver: (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) => {
    if (typeof window === 'undefined') return null;

    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  },

  // Preload critical resources
  preloadResource: (href: string, as: string, type?: string) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;

    document.head.appendChild(link);
  },

  // Prefetch next page resources
  prefetchPage: (href: string) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    document.head.appendChild(link);
  },
};

// React performance hooks
export function usePerformanceMonitoring() {
  const recordMetric = (name: string, value: number, unit: string = 'ms') => {
    performanceMonitor.recordMetric(name, value, unit);
  };

  const measureFunction = <T>(name: string, fn: () => T): T => {
    return performanceMonitor.measureFunction(name, fn);
  };

  const measureAsyncFunction = async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.measureAsyncFunction(name, fn);
  };

  const getMetrics = () => performanceMonitor.getMetrics();
  const getMemoryUsage = () => performanceMonitor.getMemoryUsage();

  return {
    recordMetric,
    measureFunction,
    measureAsyncFunction,
    getMetrics,
    getMemoryUsage,
  };
}
