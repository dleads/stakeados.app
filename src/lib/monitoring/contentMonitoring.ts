/**
 * Content Management System Monitoring
 * Tracks performance, errors, and system health for content processing
 */

import { createClient } from '@supabase/supabase-js';

export interface MonitoringMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  enabled: boolean;
}

export interface SystemAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

class ContentMonitoringService {
  private supabase;
  private metrics: MonitoringMetric[] = [];
  private alerts: SystemAlert[] = [];
  private alertRules: AlertRule[] = [];

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeAlertRules();
  }

  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'ai-processing-failure-rate',
        name: 'AI Processing Failure Rate',
        metric: 'ai_processing_failure_rate',
        condition: 'gt',
        threshold: 0.1, // 10%
        duration: 300, // 5 minutes
        severity: 'high',
        channels: ['slack', 'email'],
        enabled: true,
      },
      {
        id: 'news-aggregation-lag',
        name: 'News Aggregation Lag',
        metric: 'news_aggregation_lag_minutes',
        condition: 'gt',
        threshold: 30, // 30 minutes
        duration: 600, // 10 minutes
        severity: 'medium',
        channels: ['slack'],
        enabled: true,
      },
      {
        id: 'content-processing-queue-size',
        name: 'Content Processing Queue Size',
        metric: 'content_processing_queue_size',
        condition: 'gt',
        threshold: 100,
        duration: 300,
        severity: 'medium',
        channels: ['slack'],
        enabled: true,
      },
      {
        id: 'database-connection-errors',
        name: 'Database Connection Errors',
        metric: 'database_connection_errors',
        condition: 'gt',
        threshold: 5,
        duration: 60,
        severity: 'critical',
        channels: ['slack', 'email', 'sms'],
        enabled: true,
      },
      {
        id: 'api-response-time',
        name: 'API Response Time',
        metric: 'api_response_time_ms',
        condition: 'gt',
        threshold: 2000, // 2 seconds
        duration: 300,
        severity: 'medium',
        channels: ['slack'],
        enabled: true,
      },
      {
        id: 'content-moderation-queue',
        name: 'Content Moderation Queue',
        metric: 'moderation_queue_size',
        condition: 'gt',
        threshold: 50,
        duration: 1800, // 30 minutes
        severity: 'low',
        channels: ['email'],
        enabled: true,
      },
    ];
  }

  // Metric collection methods
  async recordMetric(metric: MonitoringMetric): Promise<void> {
    this.metrics.push(metric);

    // Store in database for persistence
    try {
      await this.supabase.from('monitoring_metrics').insert({
        name: metric.name,
        value: metric.value,
        timestamp: metric.timestamp.toISOString(),
        tags: metric.tags || {},
        metadata: metric.metadata || {},
      });
    } catch (error) {
      console.error('Failed to store monitoring metric:', error);
    }

    // Check alert rules
    await this.checkAlertRules(metric);
  }

  async recordAIProcessingMetrics(
    operation: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const timestamp = new Date();

    // Record operation duration
    await this.recordMetric({
      name: 'ai_processing_duration_ms',
      value: duration,
      timestamp,
      tags: { operation, success: success.toString() },
      metadata,
    });

    // Record success/failure
    await this.recordMetric({
      name: 'ai_processing_result',
      value: success ? 1 : 0,
      timestamp,
      tags: { operation },
      metadata,
    });

    // Calculate and record failure rate
    const recentMetrics = await this.getRecentMetrics(
      'ai_processing_result',
      300
    ); // 5 minutes
    const failureRate =
      recentMetrics.length > 0
        ? recentMetrics.filter(m => m.value === 0).length / recentMetrics.length
        : 0;

    await this.recordMetric({
      name: 'ai_processing_failure_rate',
      value: failureRate,
      timestamp,
      tags: { operation },
    });
  }

  async recordNewsAggregationMetrics(
    sourceCount: number,
    articlesProcessed: number,
    processingTime: number,
    lastSuccessfulFetch: Date
  ): Promise<void> {
    const timestamp = new Date();
    const lagMinutes =
      (timestamp.getTime() - lastSuccessfulFetch.getTime()) / (1000 * 60);

    await Promise.all([
      this.recordMetric({
        name: 'news_sources_active',
        value: sourceCount,
        timestamp,
        tags: { type: 'aggregation' },
      }),
      this.recordMetric({
        name: 'news_articles_processed',
        value: articlesProcessed,
        timestamp,
        tags: { type: 'aggregation' },
      }),
      this.recordMetric({
        name: 'news_processing_time_ms',
        value: processingTime,
        timestamp,
        tags: { type: 'aggregation' },
      }),
      this.recordMetric({
        name: 'news_aggregation_lag_minutes',
        value: lagMinutes,
        timestamp,
        tags: { type: 'aggregation' },
      }),
    ]);
  }

  async recordContentProcessingMetrics(
    queueSize: number,
    processingRate: number,
    errorCount: number
  ): Promise<void> {
    const timestamp = new Date();

    await Promise.all([
      this.recordMetric({
        name: 'content_processing_queue_size',
        value: queueSize,
        timestamp,
        tags: { type: 'processing' },
      }),
      this.recordMetric({
        name: 'content_processing_rate',
        value: processingRate,
        timestamp,
        tags: { type: 'processing' },
      }),
      this.recordMetric({
        name: 'content_processing_errors',
        value: errorCount,
        timestamp,
        tags: { type: 'processing' },
      }),
    ]);
  }

  async recordAPIMetrics(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    _userAgent?: string
  ): Promise<void> {
    const timestamp = new Date();

    await Promise.all([
      this.recordMetric({
        name: 'api_response_time_ms',
        value: responseTime,
        timestamp,
        tags: { endpoint, method, status: statusCode.toString() },
      }),
      this.recordMetric({
        name: 'api_request_count',
        value: 1,
        timestamp,
        tags: { endpoint, method, status: statusCode.toString() },
      }),
    ]);

    // Record error rate for 4xx and 5xx responses
    if (statusCode >= 400) {
      await this.recordMetric({
        name: 'api_error_count',
        value: 1,
        timestamp,
        tags: { endpoint, method, status: statusCode.toString() },
      });
    }
  }

  async recordModerationMetrics(
    queueSize: number,
    processingTime: number,
    autoApprovalRate: number
  ): Promise<void> {
    const timestamp = new Date();

    await Promise.all([
      this.recordMetric({
        name: 'moderation_queue_size',
        value: queueSize,
        timestamp,
        tags: { type: 'moderation' },
      }),
      this.recordMetric({
        name: 'moderation_processing_time_ms',
        value: processingTime,
        timestamp,
        tags: { type: 'moderation' },
      }),
      this.recordMetric({
        name: 'moderation_auto_approval_rate',
        value: autoApprovalRate,
        timestamp,
        tags: { type: 'moderation' },
      }),
    ]);
  }

  // Alert management
  private async checkAlertRules(metric: MonitoringMetric): Promise<void> {
    const applicableRules = this.alertRules.filter(
      rule => rule.enabled && rule.metric === metric.name
    );

    for (const rule of applicableRules) {
      const shouldAlert = this.evaluateAlertCondition(rule, metric.value);

      if (shouldAlert) {
        const existingAlert = this.alerts.find(
          alert => alert.ruleId === rule.id && !alert.resolved
        );

        if (!existingAlert) {
          await this.createAlert(rule, metric);
        }
      } else {
        // Check if we should resolve existing alerts
        const existingAlert = this.alerts.find(
          alert => alert.ruleId === rule.id && !alert.resolved
        );

        if (existingAlert) {
          await this.resolveAlert(existingAlert.id);
        }
      }
    }
  }

  private evaluateAlertCondition(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold;
      case 'gte':
        return value >= rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'lte':
        return value <= rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  private async createAlert(
    rule: AlertRule,
    metric: MonitoringMetric
  ): Promise<void> {
    const alert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metric.value),
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Store in database
    try {
      await this.supabase.from('system_alerts').insert({
        id: alert.id,
        rule_id: alert.ruleId,
        rule_name: alert.ruleName,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        resolved: false,
      });
    } catch (error) {
      console.error('Failed to store alert:', error);
    }

    // Send notifications
    await this.sendAlertNotifications(alert, rule.channels);
  }

  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      // Update in database
      try {
        await this.supabase
          .from('system_alerts')
          .update({
            resolved: true,
            resolved_at: alert.resolvedAt.toISOString(),
          })
          .eq('id', alertId);
      } catch (error) {
        console.error('Failed to update alert resolution:', error);
      }
    }
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    const condition = {
      gt: 'greater than',
      gte: 'greater than or equal to',
      lt: 'less than',
      lte: 'less than or equal to',
      eq: 'equal to',
    }[rule.condition];

    return `${rule.name}: Current value ${value} is ${condition} threshold ${rule.threshold}`;
  }

  private async sendAlertNotifications(
    alert: SystemAlert,
    channels: string[]
  ): Promise<void> {
    const notifications = channels.map(async channel => {
      try {
        switch (channel) {
          case 'slack':
            await this.sendSlackNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'sms':
            await this.sendSMSNotification(alert);
            break;
          default:
            console.warn(`Unknown notification channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    });

    await Promise.allSettled(notifications);
  }

  private async sendSlackNotification(alert: SystemAlert): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const color = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff0000',
      critical: '#8b0000',
    }[alert.severity];

    const payload = {
      attachments: [
        {
          color,
          title: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.ruleName}`,
          text: alert.message,
          fields: [
            {
              title: 'Metric',
              value: alert.metric,
              short: true,
            },
            {
              title: 'Current Value',
              value: alert.value.toString(),
              short: true,
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true,
            },
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
          footer: 'Content Management System Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  private async sendEmailNotification(alert: SystemAlert): Promise<void> {
    // Implementation would depend on your email service (Resend, SendGrid, etc.)
    console.log('Email notification would be sent:', alert);
  }

  private async sendSMSNotification(alert: SystemAlert): Promise<void> {
    // Implementation would depend on your SMS service (Twilio, etc.)
    console.log('SMS notification would be sent:', alert);
  }

  // Query methods
  async getRecentMetrics(
    metricName: string,
    seconds: number
  ): Promise<MonitoringMetric[]> {
    const cutoff = new Date(Date.now() - seconds * 1000);

    try {
      const { data, error } = await this.supabase
        .from('monitoring_metrics')
        .select('*')
        .eq('name', metricName)
        .gte('timestamp', cutoff.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        name: row.name,
        value: row.value,
        timestamp: new Date(row.timestamp),
        tags: row.tags,
        metadata: row.metadata,
      }));
    } catch (error) {
      console.error('Failed to fetch recent metrics:', error);
      return [];
    }
  }

  async getActiveAlerts(): Promise<SystemAlert[]> {
    try {
      const { data, error } = await this.supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        ruleId: row.rule_id,
        ruleName: row.rule_name,
        metric: row.metric,
        value: row.value,
        threshold: row.threshold,
        severity: row.severity,
        message: row.message,
        timestamp: new Date(row.timestamp),
        resolved: row.resolved,
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch active alerts:', error);
      return [];
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeAlerts: number;
    criticalAlerts: number;
    lastUpdate: Date;
  }> {
    const activeAlerts = await this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      a => a.severity === 'critical'
    ).length;
    const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (criticalAlerts > 0) {
      status = 'unhealthy';
    } else if (highAlerts > 0 || activeAlerts.length > 5) {
      status = 'degraded';
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      criticalAlerts,
      lastUpdate: new Date(),
    };
  }
}

// Singleton instance
export const contentMonitoring = new ContentMonitoringService();

// Middleware for automatic API monitoring
export function withMonitoring<T extends (...args: any[]) => any>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let statusCode = 200;

    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      statusCode =
        error instanceof Error && 'status' in error
          ? (error as any).status
          : 500;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      const request = args[0]; // Assuming first arg is request object

      await contentMonitoring.recordAPIMetrics(
        endpoint,
        request?.method || 'UNKNOWN',
        statusCode,
        responseTime,
        request?.headers?.['user-agent']
      );
    }
  }) as T;
}
