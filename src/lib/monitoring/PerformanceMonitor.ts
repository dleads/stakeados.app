/**
 * Performance monitoring system for admin operations
 * Tracks performance metrics and provides alerting
 */
export interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  userId?: string;
  success: boolean;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_operation' | 'high_error_rate' | 'memory_usage' | 'api_latency';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private maxMetrics = 10000;
  private performanceObserver?: PerformanceObserver;

  // Thresholds for alerts
  private thresholds = {
    slowOperation: 5000, // 5 seconds
    highErrorRate: 0.1, // 10%
    apiLatency: 2000, // 2 seconds
    memoryUsage: 0.8, // 80%
  };

  private constructor() {
    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operation: string): () => void {
    const startTime = performance.now();
    const id = `${operation}_${Date.now()}_${Math.random()}`;

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        id,
        operation,
        duration,
        timestamp: new Date(),
        success: true,
      });
    };
  }

  /**
   * Time an async operation
   */
  async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const id = `${operation}_${Date.now()}_${Math.random()}`;
    let success = true;
    let result: T;

    try {
      result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric({
        id,
        operation,
        duration,
        timestamp: new Date(),
        metadata,
        success,
      });
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Maintain metrics size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metric);

    // Send to monitoring service
    this.sendMetricToService(metric);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeRange?: { start: Date; end: Date }): {
    totalOperations: number;
    averageDuration: number;
    slowestOperations: PerformanceMetric[];
    errorRate: number;
    operationBreakdown: Record<
      string,
      {
        count: number;
        averageDuration: number;
        errorRate: number;
      }
    >;
  } {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        metric =>
          metric.timestamp >= timeRange.start &&
          metric.timestamp <= timeRange.end
      );
    }

    const totalOperations = filteredMetrics.length;
    const successfulOperations = filteredMetrics.filter(m => m.success);
    const averageDuration =
      filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const errorRate =
      (totalOperations - successfulOperations.length) / totalOperations;

    // Get slowest operations
    const slowestOperations = [...filteredMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Operation breakdown
    const operationBreakdown: Record<
      string,
      {
        count: number;
        averageDuration: number;
        errorRate: number;
      }
    > = {};

    filteredMetrics.forEach(metric => {
      if (!operationBreakdown[metric.operation]) {
        operationBreakdown[metric.operation] = {
          count: 0,
          averageDuration: 0,
          errorRate: 0,
        };
      }

      const breakdown = operationBreakdown[metric.operation];
      breakdown.count++;
      breakdown.averageDuration =
        (breakdown.averageDuration * (breakdown.count - 1) + metric.duration) /
        breakdown.count;
    });

    // Calculate error rates for each operation
    Object.keys(operationBreakdown).forEach(operation => {
      const operationMetrics = filteredMetrics.filter(
        m => m.operation === operation
      );
      const errors = operationMetrics.filter(m => !m.success).length;
      operationBreakdown[operation].errorRate =
        errors / operationMetrics.length;
    });

    return {
      totalOperations,
      averageDuration,
      slowestOperations,
      errorRate,
      operationBreakdown,
    };
  }

  /**
   * Get current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      averageResponseTime: number;
      errorRate: number;
      memoryUsage: number;
      activeAlerts: number;
    };
    recommendations: string[];
  } {
    const stats = this.getPerformanceStats();
    const memoryUsage = this.getCurrentMemoryUsage();
    const activeAlerts = this.alerts.length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    // Determine status based on metrics
    if (stats.errorRate > this.thresholds.highErrorRate) {
      status = 'critical';
      recommendations.push('High error rate detected. Check system logs.');
    }

    if (stats.averageDuration > this.thresholds.slowOperation) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push('Slow operations detected. Consider optimization.');
    }

    if (memoryUsage > this.thresholds.memoryUsage) {
      status = 'critical';
      recommendations.push(
        'High memory usage. Consider restarting the application.'
      );
    }

    if (activeAlerts > 5) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push(
        'Multiple alerts active. Review system performance.'
      );
    }

    return {
      status,
      metrics: {
        averageResponseTime: stats.averageDuration,
        errorRate: stats.errorRate,
        memoryUsage,
        activeAlerts,
      },
      recommendations,
    };
  }

  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (
            entry.entryType === 'navigation' ||
            entry.entryType === 'resource'
          ) {
            this.recordMetric({
              id: `browser_${entry.name}_${Date.now()}`,
              operation: `browser_${entry.entryType}`,
              duration: entry.duration,
              timestamp: new Date(),
              metadata: {
                name: entry.name,
                type: entry.entryType,
              },
              success: true,
            });
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'resource', 'measure'],
      });
    }
  }

  private startMemoryMonitoring(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        const memoryUsage = this.getCurrentMemoryUsage();
        if (memoryUsage > this.thresholds.memoryUsage) {
          this.createAlert({
            type: 'memory_usage',
            message: `High memory usage detected: ${(memoryUsage * 100).toFixed(1)}%`,
            severity: memoryUsage > 0.9 ? 'critical' : 'high',
            metadata: { memoryUsage },
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private getCurrentMemoryUsage(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in performance
    ) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return 0;
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    // Check for slow operations
    if (metric.duration > this.thresholds.slowOperation) {
      this.createAlert({
        type: 'slow_operation',
        message: `Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(0)}ms`,
        severity: metric.duration > 10000 ? 'critical' : 'high',
        metadata: { metric },
      });
    }

    // Check error rate for recent operations
    const recentMetrics = this.metrics.filter(
      m =>
        m.operation === metric.operation &&
        m.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );

    if (recentMetrics.length >= 10) {
      const errorRate =
        recentMetrics.filter(m => !m.success).length / recentMetrics.length;
      if (errorRate > this.thresholds.highErrorRate) {
        this.createAlert({
          type: 'high_error_rate',
          message: `High error rate for ${metric.operation}: ${(errorRate * 100).toFixed(1)}%`,
          severity: errorRate > 0.5 ? 'critical' : 'high',
          metadata: { operation: metric.operation, errorRate },
        });
      }
    }
  }

  private createAlert(
    alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      ...alertData,
    };

    this.alerts.push(alert);

    // Limit alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Send alert to monitoring service
    this.sendAlertToService(alert);
  }

  private async sendMetricToService(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch('/api/admin/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send metric to monitoring service:', error);
    }
  }

  private async sendAlertToService(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch('/api/admin/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error('Failed to send alert to monitoring service:', error);
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
