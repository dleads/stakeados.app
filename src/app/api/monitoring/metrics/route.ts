import { NextRequest, NextResponse } from 'next/server';
import { contentMonitoring } from '@/lib/monitoring/contentMonitoring';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const timeRange = parseInt(searchParams.get('timeRange') || '3600'); // Default 1 hour
    const aggregation = searchParams.get('aggregation') || 'raw'; // raw, hourly, daily
    const tags = searchParams.get('tags');

    if (!metricName) {
      return NextResponse.json(
        { error: 'Metric name is required' },
        { status: 400 }
      );
    }

    let data;

    if (aggregation === 'raw') {
      // Get raw metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeRange * 1000);

      let query = supabase
        .from('monitoring_metrics')
        .select('*')
        .eq('name', metricName)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });

      if (tags) {
        const tagFilter = JSON.parse(tags);
        query = query.contains('tags', tagFilter);
      }

      const { data: metrics, error } = await query;

      if (error) {
        throw error;
      }

      data = metrics.map(metric => ({
        timestamp: metric.timestamp,
        value: metric.value,
        tags: metric.tags,
        metadata: metric.metadata,
      }));
    } else {
      // Get aggregated metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeRange * 1000);

      const { data: metrics, error } = await supabase
        .from('performance_metrics_hourly')
        .select('*')
        .eq('metric_name', metricName)
        .gte('hour_bucket', startTime.toISOString())
        .lte('hour_bucket', endTime.toISOString())
        .order('hour_bucket', { ascending: true });

      if (error) {
        throw error;
      }

      data = metrics.map(metric => ({
        timestamp: metric.hour_bucket,
        avgValue: metric.avg_value,
        minValue: metric.min_value,
        maxValue: metric.max_value,
        count: metric.count_value,
        sum: metric.sum_value,
        tags: metric.tags,
      }));
    }

    return NextResponse.json({
      metric: metricName,
      timeRange,
      aggregation,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics } = body;

    if (!Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Metrics must be an array' },
        { status: 400 }
      );
    }

    // Validate and record each metric
    const results = await Promise.allSettled(
      metrics.map(async metric => {
        const { name, value, tags, metadata } = metric;

        if (!name || value === undefined) {
          throw new Error('Metric name and value are required');
        }

        await contentMonitoring.recordMetric({
          name,
          value: parseFloat(value),
          timestamp: new Date(),
          tags: tags || {},
          metadata: metadata || {},
        });

        return { name, success: true };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      processed: metrics.length,
      successful,
      failed,
      errors: results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason.message),
    });
  } catch (error) {
    console.error('Failed to record metrics:', error);
    return NextResponse.json(
      { error: 'Failed to record metrics' },
      { status: 500 }
    );
  }
}

// Endpoint for specific metric types
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'ai_processing':
        await contentMonitoring.recordAIProcessingMetrics(
          data.operation,
          data.success,
          data.duration,
          data.metadata
        );
        break;

      case 'news_aggregation':
        await contentMonitoring.recordNewsAggregationMetrics(
          data.sourceCount,
          data.articlesProcessed,
          data.processingTime,
          new Date(data.lastSuccessfulFetch)
        );
        break;

      case 'content_processing':
        await contentMonitoring.recordContentProcessingMetrics(
          data.queueSize,
          data.processingRate,
          data.errorCount
        );
        break;

      case 'api_metrics':
        await contentMonitoring.recordAPIMetrics(
          data.endpoint,
          data.method,
          data.statusCode,
          data.responseTime,
          data.userAgent
        );
        break;

      case 'moderation_metrics':
        await contentMonitoring.recordModerationMetrics(
          data.queueSize,
          data.processingTime,
          data.autoApprovalRate
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record typed metric:', error);
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}
