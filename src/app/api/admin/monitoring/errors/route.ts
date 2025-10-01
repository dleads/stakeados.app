export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { AdminError } from '@/lib/errors/AdminErrorCodes';

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

    const errorData: AdminError = await request.json();

    // Store error in database
    const { error: insertError } = await (supabase as any)
      .from('admin_error_logs')
      .insert({
        error_code: errorData.code,
        message: errorData.message,
        details: errorData.details || {},
        user_id: errorData.userId || user?.id || null,
        operation: errorData.operation,
        context: errorData.context || {},
        timestamp: errorData.timestamp,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to store error log:', insertError);
      return NextResponse.json(
        { error: 'Failed to store error log' },
        { status: 500 }
      );
    }

    // Send critical errors to external monitoring (if configured)
    if (shouldAlertExternally(errorData.code)) {
      await sendToExternalMonitoring(errorData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging endpoint error:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const operation = searchParams.get('operation');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = (supabase as any)
      .from('admin_error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }

    if (operation) {
      query = query.eq('operation', operation);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: errors, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      );
    }

    // Get error statistics
    const { data: stats } = await (supabase as any)
      .from('admin_error_logs')
      .select('error_code, created_at')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const errorStats = generateErrorStats(stats || []);

    return NextResponse.json({
      errors,
      stats: errorStats,
      pagination: {
        limit,
        offset,
        hasMore: errors?.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

function shouldAlertExternally(errorCode: string): boolean {
  const criticalErrors = [
    'DATABASE_CONNECTION_ERROR',
    'AUTHENTICATION_FAILED',
    'BACKUP_FAILED',
    'EXTERNAL_SERVICE_ERROR',
  ];

  return criticalErrors.includes(errorCode);
}

async function sendToExternalMonitoring(error: AdminError): Promise<void> {
  try {
    // Send to Slack webhook (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 Critical Admin Error: ${error.code}`,
          attachments: [
            {
              color: 'danger',
              fields: [
                {
                  title: 'Error Code',
                  value: error.code,
                  short: true,
                },
                {
                  title: 'Message',
                  value: error.message,
                  short: true,
                },
                {
                  title: 'Operation',
                  value: error.operation || 'Unknown',
                  short: true,
                },
                {
                  title: 'Timestamp',
                  value: error.timestamp.toISOString(),
                  short: true,
                },
              ],
            },
          ],
        }),
      });
    }

    // Send to email (if configured)
    if (process.env.ADMIN_ALERT_EMAIL) {
      // Implement email sending logic here
      console.log('Would send email alert for critical error:', error.code);
    }
  } catch (monitoringError) {
    console.error('Failed to send external monitoring alert:', monitoringError);
  }
}

function generateErrorStats(errors: any[]): {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByHour: Record<string, number>;
  topErrors: Array<{ code: string; count: number }>;
} {
  const errorsByCode: Record<string, number> = {};
  const errorsByHour: Record<string, number> = {};

  errors.forEach(error => {
    // Count by error code
    errorsByCode[error.error_code] = (errorsByCode[error.error_code] || 0) + 1;

    // Count by hour
    const hour = new Date(error.created_at).getHours();
    const hourKey = `${hour}:00`;
    errorsByHour[hourKey] = (errorsByHour[hourKey] || 0) + 1;
  });

  // Get top errors
  const topErrors = Object.entries(errorsByCode)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalErrors: errors.length,
    errorsByCode,
    errorsByHour,
    topErrors,
  };
}
