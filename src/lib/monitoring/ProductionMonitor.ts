/**
 * Production monitoring and alerting system
 * Handles error tracking, performance monitoring, and health checks
 */

interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableHealthChecks: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  notifications: {
    slack?: string;
    email?: string;
    webhook?: string;
  };
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: any;
  timestamp: Date;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

class ProductionMonitor {
  private config: MonitoringConfig;
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> =
    new Map();
  private metrics: PerformanceMetric[] = [];
  private errorCount = 0;
  private lastErrorReset = Date.now();

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeHealthChecks();
    this.startPeriodicChecks();
  }

  /**
   * Initialize default health checks
   */
  private initializeHealthChecks() {
    // Database health check
    this.healthChecks.set('database', async () => {
      const start = Date.now();
      try {
        // Simple query to check database connectivity
        const response = await fetch('/api/health/database');
        const responseTime = Date.now() - start;

        if (response.ok) {
          return {
            service: 'database',
            status: responseTime < 1000 ? 'healthy' : 'degraded',
            responseTime,
            timestamp: new Date(),
          };
        } else {
          return {
            service: 'database',
            status: 'unhealthy',
            responseTime,
            details: { statusCode: response.status },
            timestamp: new Date(),
          };
        }
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime: Date.now() - start,
          details: { error: error.message },
          timestamp: new Date(),
        };
      }
    });

    // API health check
    this.healthChecks.set('api', async () => {
      const start = Date.now();
      try {
        const response = await fetch('/api/health');
        const responseTime = Date.now() - start;

        return {
          service: 'api',
          status: response.ok && responseTime < 2000 ? 'healthy' : 'degraded',
          responseTime,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          service: 'api',
          status: 'unhealthy',
          responseTime: Date.now() - start,
          details: { error: error.message },
          timestamp: new Date(),
        };
      }
    });

    // External services health check
    this.healthChecks.set('external-services', async () => {
      const start = Date.now();
      const services = ['supabase', 'openai', 'resend'];
      const results = [];

      for (const service of services) {
        try {
          const response = await fetch(`/api/health/${service}`);
          results.push({
            service,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - start,
          });
        } catch (error) {
          results.push({
            service,
            status: 'unhealthy',
            error: error.message,
          });
        }
      }

      const allHealthy = results.every(r => r.status === 'healthy');
      const someHealthy = results.some(r => r.status === 'healthy');

      return {
        service: 'external-services',
        status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
        responseTime: Date.now() - start,
        details: results,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Start periodic health checks and monitoring
   */
  private startPeriodicChecks() {
    if (!this.config.enableHealthChecks) return;

    // Run health checks every 30 seconds
    setInterval(async () => {
      await this.runHealthChecks();
    }, 30000);

    // Reset error count every hour
    setInterval(() => {
      this.errorCount = 0;
      this.lastErrorReset = Date.now();
    }, 3600000);

    // Clean old metrics every 10 minutes
    setInterval(() => {
      this.cleanOldMetrics();
    }, 600000);
  }

  /**
   * Run all registered health checks
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [name, check] of this.healthChecks) {
      try {
        const result = await check();
        results.push(result);

        // Alert on unhealthy services
        if (result.status === 'unhealthy') {
          await this.sendAlert('health_check_failed', {
            service: name,
            details: result.details,
            timestamp: result.timestamp,
          });
        }
      } catch (error) {
        const failedResult: HealthCheckResult = {
          service: name,
          status: 'unhealthy',
          responseTime: 0,
          details: { error: error.message },
          timestamp: new Date(),
        };
        results.push(failedResult);

        await this.sendAlert('health_check_error', {
          service: name,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Track application errors
   */
  async trackError(error: Error, context?: Record<string, any>) {
    if (!this.config.enableErrorTracking) return;

    this.errorCount++;

    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : context?.url,
    };

    // Send to external error tracking service (e.g., Sentry)
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
      console.error('Error tracked:', errorData);
    }

    // Check error rate threshold
    const errorRate =
      this.errorCount / ((Date.now() - this.lastErrorReset) / 60000); // errors per minute
    if (errorRate > this.config.alertThresholds.errorRate) {
      await this.sendAlert('high_error_rate', {
        errorRate,
        threshold: this.config.alertThresholds.errorRate,
        recentError: errorData,
      });
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ) {
    if (!this.config.enablePerformanceMonitoring) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Check performance thresholds
    if (
      name === 'response_time' &&
      value > this.config.alertThresholds.responseTime
    ) {
      this.sendAlert('slow_response_time', {
        responseTime: value,
        threshold: this.config.alertThresholds.responseTime,
        endpoint: tags?.endpoint,
      });
    }
  }

  /**
   * Send alerts to configured channels
   */
  private async sendAlert(type: string, data: any) {
    const alert = {
      type,
      data,
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
      application: 'Stakeados Admin',
    };

    // Slack notification
    if (this.config.notifications.slack) {
      try {
        await fetch(this.config.notifications.slack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Alert: ${type}`,
            attachments: [
              {
                color: 'danger',
                fields: [
                  { title: 'Type', value: type, short: true },
                  {
                    title: 'Environment',
                    value: process.env.NODE_ENV,
                    short: true,
                  },
                  {
                    title: 'Details',
                    value: JSON.stringify(data, null, 2),
                    short: false,
                  },
                ],
              },
            ],
          }),
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }

    // Email notification
    if (this.config.notifications.email) {
      try {
        await fetch('/api/admin/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: this.config.notifications.email,
            subject: `Stakeados Alert: ${type}`,
            html: `
              <h2>Alert: ${type}</h2>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
              <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            `,
          }),
        });
      } catch (error) {
        console.error('Failed to send email alert:', error);
      }
    }

    // Custom webhook
    if (this.config.notifications.webhook) {
      try {
        await fetch(this.config.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }
  }

  /**
   * Clean old metrics to prevent memory leaks
   */
  private cleanOldMetrics() {
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo);
  }

  /**
   * Get current system status
   */
  async getSystemStatus() {
    const healthResults = await this.runHealthChecks();
    const recentMetrics = this.metrics.filter(
      m => m.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
    );

    return {
      overall: healthResults.every(r => r.status === 'healthy')
        ? 'healthy'
        : 'degraded',
      services: healthResults,
      metrics: {
        errorRate:
          this.errorCount / ((Date.now() - this.lastErrorReset) / 60000),
        averageResponseTime: this.calculateAverageResponseTime(recentMetrics),
        totalRequests: recentMetrics.filter(m => m.name === 'request_count')
          .length,
      },
      timestamp: new Date(),
    };
  }

  private calculateAverageResponseTime(metrics: PerformanceMetric[]): number {
    const responseTimes = metrics.filter(m => m.name === 'response_time');
    if (responseTimes.length === 0) return 0;

    const sum = responseTimes.reduce((acc, m) => acc + m.value, 0);
    return sum / responseTimes.length;
  }
}

// Initialize production monitor
export const productionMonitor = new ProductionMonitor({
  enableErrorTracking: process.env.NODE_ENV === 'production',
  enablePerformanceMonitoring: process.env.NODE_ENV === 'production',
  enableHealthChecks: process.env.NODE_ENV === 'production',
  alertThresholds: {
    errorRate: 10, // errors per minute
    responseTime: 5000, // milliseconds
    memoryUsage: 80, // percentage
    cpuUsage: 80, // percentage
  },
  notifications: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.ADMIN_NOTIFICATION_EMAIL,
    webhook: process.env.ADMIN_ALERT_WEBHOOK,
  },
});

export default ProductionMonitor;
