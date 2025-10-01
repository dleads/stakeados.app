export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { PerformanceAlert } from '@/lib/monitoring/PerformanceMonitor';

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

    const alertData: PerformanceAlert = await request.json();

    // Store alert in database
    const { error: insertError } = await (supabase as any)
      .from('performance_alerts')
      .insert({
        alert_id: alertData.id,
        alert_type: alertData.type,
        message: alertData.message,
        severity: alertData.severity,
        metadata: alertData.metadata || {},
        timestamp: alertData.timestamp,
        created_at: new Date().toISOString(),
        acknowledged: false,
        created_by: user?.id || null,
      });

    if (insertError) {
      console.error('Failed to store performance alert:', insertError);
      return NextResponse.json(
        { error: 'Failed to store alert' },
        { status: 500 }
      );
    }

    // Send critical alerts to external monitoring
    if (alertData.severity === 'critical') {
      await sendCriticalAlertNotification(alertData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alerts endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to store alert' },
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const acknowledged = searchParams.get('acknowledged');

    let query = (supabase as any)
      .from('performance_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }

    if (type) {
      query = query.eq('alert_type', type);
    }

    if (acknowledged !== null) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }

    const { data: alerts, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    // Get alert statistics
    const { data: stats } = await (supabase as any)
      .from('performance_alerts')
      .select('severity, alert_type, acknowledged, created_at')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const alertStats = generateAlertStats(stats || []);

    return NextResponse.json({
      alerts,
      stats: alertStats,
      pagination: {
        limit,
        offset,
        hasMore: alerts?.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { alertIds, action } = await request.json();

    if (action === 'acknowledge') {
      const { error: updateError } = await (supabase as any)
        .from('performance_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .in('alert_id', alertIds);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to acknowledge alerts' },
          { status: 500 }
        );
      }
    } else if (action === 'dismiss') {
      const { error: deleteError } = await (supabase as any)
        .from('performance_alerts')
        .delete()
        .in('alert_id', alertIds);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to dismiss alerts' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alerts:', error);
    return NextResponse.json(
      { error: 'Failed to update alerts' },
      { status: 500 }
    );
  }
}

async function sendCriticalAlertNotification(
  alert: PerformanceAlert
): Promise<void> {
  try {
    // Send to Slack webhook (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 Critical Performance Alert: ${alert.type}`,
          attachments: [
            {
              color: 'danger',
              fields: [
                {
                  title: 'Alert Type',
                  value: alert.type,
                  short: true,
                },
                {
                  title: 'Severity',
                  value: alert.severity,
                  short: true,
                },
                {
                  title: 'Message',
                  value: alert.message,
                  short: false,
                },
                {
                  title: 'Timestamp',
                  value: alert.timestamp.toISOString(),
                  short: true,
                },
              ],
            },
          ],
        }),
      });
    }

    // Send email notification (if configured)
    if (process.env.ADMIN_ALERT_EMAIL) {
      // Implement email sending logic here
      console.log(
        'Would send email alert for critical performance issue:',
        alert.type
      );
    }
  } catch (error) {
    console.error('Failed to send critical alert notification:', error);
  }
}

function generateAlertStats(alerts: any[]): {
  totalAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByType: Record<string, number>;
  acknowledgedCount: number;
  recentAlerts: number;
} {
  const alertsBySeverity: Record<string, number> = {};
  const alertsByType: Record<string, number> = {};
  let acknowledgedCount = 0;
  let recentAlerts = 0;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  alerts.forEach(alert => {
    // Count by severity
    alertsBySeverity[alert.severity] =
      (alertsBySeverity[alert.severity] || 0) + 1;

    // Count by type
    alertsByType[alert.alert_type] = (alertsByType[alert.alert_type] || 0) + 1;

    // Count acknowledged
    if (alert.acknowledged) {
      acknowledgedCount++;
    }

    // Count recent alerts
    if (new Date(alert.created_at) > oneHourAgo) {
      recentAlerts++;
    }
  });

  return {
    totalAlerts: alerts.length,
    alertsBySeverity,
    alertsByType,
    acknowledgedCount,
    recentAlerts,
  };
}
