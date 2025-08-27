import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Database-specific health check endpoint
 */
export async function GET(_request: NextRequest) {
  const start = Date.now();

  try {
    const supabase = createClient();

    // Test basic connectivity
    const { error: connectivityError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectivityError) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: connectivityError.message,
          responseTime: Date.now() - start,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Test write capability (if needed)
    const writeStart = Date.now();
    const { error: writeError } = await supabase
      .from('system_health_checks')
      .upsert(
        {
          check_type: 'database_health',
          status: 'healthy',
          checked_at: new Date().toISOString(),
        },
        { onConflict: 'check_type' }
      );

    const writeTime = Date.now() - writeStart;
    const totalTime = Date.now() - start;

    return NextResponse.json({
      status: writeError ? 'degraded' : 'healthy',
      responseTime: totalTime,
      details: {
        connectivity: 'healthy',
        writeTest: writeError ? 'failed' : 'passed',
        writeTime: writeTime,
        ...(writeError && { writeError: writeError.message }),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error:
          error instanceof Error ? error.message : 'Unknown database error',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
