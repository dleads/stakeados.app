import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { PerformanceMetric } from '@/lib/monitoring/PerformanceMonitor';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;
    const user = (admin as any).user;

    const metricData: PerformanceMetric = await request.json();

    // Store metric in database
    const { error: insertError } = await (supabase as any)
      .from('performance_metrics')
      .insert({
        metric_id: metricData.id,
        operation: metricData.operation,
        duration: metricData.duration,
        success: metricData.success,
        metadata: metricData.metadata || {},
        user_id: metricData.userId || user?.id || null,
        timestamp: metricData.timestamp,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to store performance metric:', insertError);
      return NextResponse.json(
        { error: 'Failed to store metric' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to store metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase as any;

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const aggregation = searchParams.get('aggregation') || 'hour'; // hour, day, week

    // Get performance metrics with filters
    let query = (supabase as any)
      .from('performance_metrics')
      .select('*')
      .order('timestamp', { ascending: false });

    if (operation) {
      query = query.eq('operation', operation);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: metrics, error: fetchError } = await query.limit(10000);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Aggregate metrics
    const aggregatedMetrics = aggregateMetrics(metrics || [], aggregation);
    const operationStats = generateOperationStats(metrics || []);

    return NextResponse.json({
      metrics: aggregatedMetrics,
      operationStats,
      summary: {
        totalOperations: metrics?.length || 0,
        averageDuration: calculateAverage(metrics || [], 'duration'),
        successRate: calculateSuccessRate(metrics || []),
        slowestOperations: getSlowOperations(metrics || []),
      },
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

function aggregateMetrics(
  metrics: any[],
  aggregation: string
): Record<
  string,
  {
    timestamp: string;
    averageDuration: number;
    operationCount: number;
    successRate: number;
    operations: Record<string, number>;
  }
> {
  const aggregated: Record<string, any> = {};

  metrics.forEach(metric => {
    const date = new Date(metric.timestamp);
    let key: string;

    switch (aggregation) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        timestamp: key,
        totalDuration: 0,
        operationCount: 0,
        successCount: 0,
        operations: {},
      };
    }

    const bucket = aggregated[key];
    bucket.totalDuration += metric.duration;
    bucket.operationCount++;
    if (metric.success) bucket.successCount++;

    bucket.operations[metric.operation] =
      (bucket.operations[metric.operation] || 0) + 1;
  });

  // Calculate averages and rates
  Object.keys(aggregated).forEach(key => {
    const bucket = aggregated[key];
    bucket.averageDuration = bucket.totalDuration / bucket.operationCount;
    bucket.successRate = bucket.successCount / bucket.operationCount;
    delete bucket.totalDuration;
    delete bucket.successCount;
  });

  return aggregated;
}

function generateOperationStats(metrics: any[]): Record<
  string,
  {
    count: number;
    averageDuration: number;
    successRate: number;
    p95Duration: number;
    p99Duration: number;
  }
> {
  const operationGroups: Record<string, any[]> = {};

  metrics.forEach(metric => {
    if (!operationGroups[metric.operation]) {
      operationGroups[metric.operation] = [];
    }
    operationGroups[metric.operation].push(metric);
  });

  const stats: Record<string, any> = {};

  Object.entries(operationGroups).forEach(([operation, operationMetrics]) => {
    const durations = operationMetrics
      .map(m => m.duration)
      .sort((a, b) => a - b);
    const successCount = operationMetrics.filter(m => m.success).length;

    stats[operation] = {
      count: operationMetrics.length,
      averageDuration: calculateAverage(operationMetrics, 'duration'),
      successRate: successCount / operationMetrics.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
    };
  });

  return stats;
}

function calculateAverage(metrics: any[], field: string): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
  return sum / metrics.length;
}

function calculateSuccessRate(metrics: any[]): number {
  if (metrics.length === 0) return 1;
  const successCount = metrics.filter(m => m.success).length;
  return successCount / metrics.length;
}

function getSlowOperations(metrics: any[], limit = 10): any[] {
  return [...metrics]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit)
    .map(metric => ({
      operation: metric.operation,
      duration: metric.duration,
      timestamp: metric.timestamp,
      success: metric.success,
    }));
}
