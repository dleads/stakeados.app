import { NextRequest, NextResponse } from 'next/server';
import { contentMonitoring } from '@/lib/monitoring/contentMonitoring';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('system_alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data to match our interface
    const transformedAlerts = alerts.map(alert => ({
      id: alert.id,
      ruleId: alert.rule_id,
      ruleName: alert.rule_name,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date(alert.timestamp),
      resolved: alert.resolved,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
    }));

    return NextResponse.json({
      alerts: transformedAlerts,
      total: alerts.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, value, tags, metadata } = body;

    if (!metric || value === undefined) {
      return NextResponse.json(
        { error: 'Metric name and value are required' },
        { status: 400 }
      );
    }

    await contentMonitoring.recordMetric({
      name: metric,
      value: parseFloat(value),
      timestamp: new Date(),
      tags: tags || {},
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record metric:', error);
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Alert ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'resolve') {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    } else if (action === 'acknowledge') {
      // For now, just mark as acknowledged in metadata
      const { error } = await supabase
        .from('system_alerts')
        .update({
          metadata: {
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
          },
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to update alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
