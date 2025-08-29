import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint for production monitoring
 * Returns system status and basic health metrics
 */
export async function GET(_request: NextRequest) {
  const start = Date.now();

  try {
    // Basic system checks
    const checks: any = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        api: { status: 'healthy', responseTime: 0 },
        database: { status: 'unknown', responseTime: 0, details: {} },
        memory: { status: 'healthy', usage: 0, details: {} },
        uptime: process.uptime(),
      },
    };

    // Database connectivity check
    try {
      const supabase = await createClient();
      const dbStart = Date.now();
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      const dbResponseTime = Date.now() - dbStart;

      checks.checks.database = {
        status: error
          ? 'unhealthy'
          : dbResponseTime > 1000
            ? 'degraded'
            : 'healthy',
        responseTime: dbResponseTime,
        ...(error && { details: { error: error.message } }),
      };
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }

    // Memory usage check
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      checks.checks.memory = {
        status:
          memoryUsagePercent > 90
            ? 'unhealthy'
            : memoryUsagePercent > 70
              ? 'degraded'
              : 'healthy',
        usage: Math.round(memoryUsagePercent),
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
      };
    }

    // API response time
    checks.checks.api.responseTime = Date.now() - start;

    // Overall status
    const hasUnhealthy = Object.values(checks.checks).some(
      (check: any) => check.status === 'unhealthy'
    );
    const hasDegraded = Object.values(checks.checks).some(
      (check: any) => check.status === 'degraded'
    );

    checks.status = hasUnhealthy
      ? 'unhealthy'
      : hasDegraded
        ? 'degraded'
        : 'healthy';

    // Return appropriate status code
    const statusCode =
      checks.status === 'healthy'
        ? 200
        : checks.status === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(checks, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
