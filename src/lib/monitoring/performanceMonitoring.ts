/**
 * Performance Monitoring for Content Management System
 * Tracks content delivery performance, cache hit rates, and system resources
 */

import { contentMonitoring } from './contentMonitoring';

export interface PerformanceMetrics {
  contentDelivery: {
    averageResponseTime: number;
    cacheHitRate: number;
    throughput: number;
    errorRate: number;
  };
  database: {
    queryTime: number;
    connectionPool: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    evictionRate: number;
    memoryUsage: number;
  };
  aiProcessing: {
    averageProcessingTime: number;
    queueLength: number;
    successRate: number;
  };
}

class PerformanceMonitoringService {
  private performanceObserver?: PerformanceObserver;
  // private metricsBuffer: Map<string, number[]> = new Map(); // No usado actualmente
  // private readonly BUFFER_SIZE = 100; // No usado actualmente

  constructor() {
    this.initializePerformanceObserver();
    this.startPeriodicReporting();
  }

  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'resource', 'measure', 'paint'],
      });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.recordResourceMetrics(entry as PerformanceResourceTiming);
        break;
      case 'measure':
        this.recordCustomMetrics(entry);
        break;
      case 'paint':
        this.recordPaintMetrics(entry as PerformancePaintTiming);
        break;
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics = {
      domContentLoaded:
        entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstByte: entry.responseStart - entry.requestStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      totalLoadTime: entry.loadEventEnd - entry.fetchStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        contentMonitoring.recordMetric({
          name: `page_${name}_ms`,
          value,
          timestamp: new Date(),
          tags: { type: 'navigation' },
        });
      }
    });
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    const loadTime = entry.responseEnd - entry.startTime;

    if (loadTime > 0) {
      contentMonitoring.recordMetric({
        name: 'resource_load_time_ms',
        value: loadTime,
        timestamp: new Date(),
        tags: {
          type: resourceType,
          cached: entry.transferSize === 0 ? 'true' : 'false',
        },
      });
    }

    // Track cache performance
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
      contentMonitoring.recordMetric({
        name: 'cache_hit',
        value: 1,
        timestamp: new Date(),
        tags: { type: resourceType },
      });
    }
  }

  private recordCustomMetrics(entry: PerformanceEntry): void {
    contentMonitoring.recordMetric({
      name: `custom_${entry.name}`,
      value: entry.duration,
      timestamp: new Date(),
      tags: { type: 'custom_measure' },
    });
  }

  private recordPaintMetrics(entry: PerformancePaintTiming): void {
    contentMonitoring.recordMetric({
      name: `paint_${entry.name.replace('-', '_')}_ms`,
      value: entry.startTime,
      timestamp: new Date(),
      tags: { type: 'paint' },
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (url.match(/\.(css|scss)$/)) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  // Content-specific performance tracking
  async trackContentLoad(
    contentType: 'article' | 'news',
    contentId: string
  ): Promise<() => void> {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;

      contentMonitoring.recordMetric({
        name: 'content_load_time_ms',
        value: loadTime,
        timestamp: new Date(),
        tags: {
          contentType,
          contentId,
        },
      });
    };
  }

  async trackSearchPerformance(
    query: string,
    resultCount: number
  ): Promise<() => void> {
    const startTime = performance.now();

    return () => {
      const searchTime = performance.now() - startTime;

      contentMonitoring.recordMetric({
        name: 'search_response_time_ms',
        value: searchTime,
        timestamp: new Date(),
        tags: {
          hasResults: resultCount > 0 ? 'true' : 'false',
          queryLength: query.length.toString(),
        },
      });

      contentMonitoring.recordMetric({
        name: 'search_result_count',
        value: resultCount,
        timestamp: new Date(),
        tags: {
          queryLength: query.length.toString(),
        },
      });
    };
  }

  async trackAIProcessing(
    operation: string
  ): Promise<(success: boolean, metadata?: any) => void> {
    const startTime = performance.now();

    return (success: boolean, metadata?: any) => {
      const processingTime = performance.now() - startTime;

      contentMonitoring.recordAIProcessingMetrics(
        operation,
        success,
        processingTime,
        metadata
      );
    };
  }

  async trackDatabaseQuery(query: string, table: string): Promise<() => void> {
    const startTime = performance.now();

    return () => {
      const queryTime = performance.now() - startTime;

      contentMonitoring.recordMetric({
        name: 'database_query_time_ms',
        value: queryTime,
        timestamp: new Date(),
        tags: {
          table,
          operation: this.extractQueryOperation(query),
        },
      });

      // Track slow queries
      if (queryTime > 1000) {
        // 1 second threshold
        contentMonitoring.recordMetric({
          name: 'slow_query_count',
          value: 1,
          timestamp: new Date(),
          tags: {
            table,
            operation: this.extractQueryOperation(query),
          },
          metadata: { query: query.substring(0, 200) }, // First 200 chars
        });
      }
    };
  }

  private extractQueryOperation(query: string): string {
    const operation = query.trim().split(' ')[0].toLowerCase();
    return ['select', 'insert', 'update', 'delete'].includes(operation)
      ? operation
      : 'other';
  }

  async trackCacheOperation(
    operation: 'get' | 'set' | 'del',
    key: string
  ): Promise<(hit?: boolean) => void> {
    const startTime = performance.now();

    return (hit?: boolean) => {
      const operationTime = performance.now() - startTime;

      contentMonitoring.recordMetric({
        name: 'cache_operation_time_ms',
        value: operationTime,
        timestamp: new Date(),
        tags: {
          operation,
          keyType: this.getCacheKeyType(key),
        },
      });

      if (operation === 'get' && hit !== undefined) {
        contentMonitoring.recordMetric({
          name: 'cache_hit_rate',
          value: hit ? 1 : 0,
          timestamp: new Date(),
          tags: {
            keyType: this.getCacheKeyType(key),
          },
        });
      }
    };
  }

  private getCacheKeyType(key: string): string {
    if (key.startsWith('articles:')) return 'articles';
    if (key.startsWith('news:')) return 'news';
    if (key.startsWith('categories:')) return 'categories';
    if (key.startsWith('search:')) return 'search';
    if (key.startsWith('user:')) return 'user';
    return 'other';
  }

  // Memory and resource monitoring
  async recordMemoryUsage(): Promise<void> {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;

      contentMonitoring.recordMetric({
        name: 'memory_used_bytes',
        value: memory.usedJSHeapSize,
        timestamp: new Date(),
        tags: { type: 'memory' },
      });

      contentMonitoring.recordMetric({
        name: 'memory_total_bytes',
        value: memory.totalJSHeapSize,
        timestamp: new Date(),
        tags: { type: 'memory' },
      });

      contentMonitoring.recordMetric({
        name: 'memory_limit_bytes',
        value: memory.jsHeapSizeLimit,
        timestamp: new Date(),
        tags: { type: 'memory' },
      });
    }
  }

  // Aggregate performance metrics
  async getPerformanceMetrics(
    _timeRange: number = 3600
  ): Promise<PerformanceMetrics> {
    // const endTime = new Date(); // No usado actualmente
    // const startTime = new Date(endTime.getTime() - timeRange * 1000); // No usado actualmente

    // This would typically query your metrics database
    // For now, returning mock data structure
    return {
      contentDelivery: {
        averageResponseTime: 250,
        cacheHitRate: 0.85,
        throughput: 1200,
        errorRate: 0.02,
      },
      database: {
        queryTime: 45,
        connectionPool: 8,
        slowQueries: 2,
      },
      cache: {
        hitRate: 0.92,
        evictionRate: 0.05,
        memoryUsage: 0.65,
      },
      aiProcessing: {
        averageProcessingTime: 1500,
        queueLength: 5,
        successRate: 0.98,
      },
    };
  }

  // Periodic reporting
  private startPeriodicReporting(): void {
    // Report memory usage every 5 minutes
    setInterval(
      () => {
        this.recordMemoryUsage();
      },
      5 * 60 * 1000
    );

    // Report aggregated metrics every 10 minutes
    setInterval(
      async () => {
        await this.reportAggregatedMetrics();
      },
      10 * 60 * 1000
    );
  }

  private async reportAggregatedMetrics(): Promise<void> {
    try {
      const metrics = await this.getPerformanceMetrics();

      // Report key performance indicators
      await Promise.all([
        contentMonitoring.recordMetric({
          name: 'content_delivery_response_time_ms',
          value: metrics.contentDelivery.averageResponseTime,
          timestamp: new Date(),
          tags: { type: 'aggregated' },
        }),
        contentMonitoring.recordMetric({
          name: 'cache_hit_rate_percentage',
          value: metrics.contentDelivery.cacheHitRate * 100,
          timestamp: new Date(),
          tags: { type: 'aggregated' },
        }),
        contentMonitoring.recordMetric({
          name: 'ai_processing_success_rate_percentage',
          value: metrics.aiProcessing.successRate * 100,
          timestamp: new Date(),
          tags: { type: 'aggregated' },
        }),
      ]);
    } catch (error) {
      console.error('Failed to report aggregated metrics:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// React hook for performance tracking
export function usePerformanceTracking() {
  return {
    trackContentLoad: performanceMonitoring.trackContentLoad.bind(
      performanceMonitoring
    ),
    trackSearchPerformance: performanceMonitoring.trackSearchPerformance.bind(
      performanceMonitoring
    ),
    trackAIProcessing: performanceMonitoring.trackAIProcessing.bind(
      performanceMonitoring
    ),
    trackDatabaseQuery: performanceMonitoring.trackDatabaseQuery.bind(
      performanceMonitoring
    ),
    trackCacheOperation: performanceMonitoring.trackCacheOperation.bind(
      performanceMonitoring
    ),
  };
}
