import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

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

    // Perform comprehensive health checks
    const healthChecks = await Promise.allSettled([
      checkDatabaseHealth(supabase),
      checkStorageHealth(supabase),
      checkExternalServices(),
      checkSystemResources(),
    ]);

    const systemHealth = performanceMonitor.getSystemHealth();

    const results = {
      database: healthChecks[0],
      storage: healthChecks[1],
      externalServices: healthChecks[2],
      systemResources: healthChecks[3],
      performance: systemHealth,
      timestamp: new Date().toISOString(),
      overallStatus: determineOverallStatus(healthChecks, systemHealth),
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
        overallStatus: 'critical',
      },
      { status: 500 }
    );
  }
}

async function checkDatabaseHealth(supabase: any) {
  const startTime = Date.now();

  try {
    // Test basic connectivity
    const { data: _data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;

    const responseTime = Date.now() - startTime;

    // Test write capability
    const testWrite = await supabase.from('system_health_checks').upsert({
      check_type: 'database_health',
      status: 'healthy',
      checked_at: new Date().toISOString(),
    });

    return {
      status: 'healthy',
      responseTime,
      details: {
        connectivity: 'ok',
        writeCapability: testWrite.error ? 'error' : 'ok',
        error: testWrite.error?.message,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

async function checkStorageHealth(supabase: any) {
  const startTime = Date.now();

  try {
    // Test storage bucket access
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) throw error;

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: {
        bucketsAccessible: buckets?.length || 0,
        buckets: buckets?.map((b: any) => b.name) || [],
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown storage error',
    };
  }
}

async function checkExternalServices() {
  const startTime = Date.now();
  const services = [];

  try {
    // Check OpenAI API (if configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000),
        });

        services.push({
          name: 'OpenAI API',
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
        });
      } catch (error) {
        services.push({
          name: 'OpenAI API',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Check other external services as needed
    // Add more service checks here

    const overallStatus = services.every(s => s.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    return {
      status: overallStatus,
      responseTime: Date.now() - startTime,
      services,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown external services error',
    };
  }
}

async function checkSystemResources() {
  const startTime = Date.now();

  try {
    // Get memory usage (if available)
    let memoryUsage = 0;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      memoryUsage = memory.heapUsed / memory.heapTotal;
    }

    // Get performance metrics
    const performanceStats = performanceMonitor.getPerformanceStats();

    return {
      status: memoryUsage > 0.9 ? 'warning' : 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        memoryUsage: Math.round(memoryUsage * 100),
        averageResponseTime: Math.round(performanceStats.averageDuration),
        errorRate: Math.round(performanceStats.errorRate * 100),
        totalOperations: performanceStats.totalOperations,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown system resources error',
    };
  }
}

function determineOverallStatus(
  healthChecks: PromiseSettledResult<any>[],
  systemHealth: any
): 'healthy' | 'degraded' | 'unhealthy' | 'critical' {
  const results = healthChecks.map(check =>
    check.status === 'fulfilled' ? check.value.status : 'unhealthy'
  );

  // If system performance is critical, overall status is critical
  if (systemHealth.status === 'critical') {
    return 'critical';
  }

  // If any critical service is unhealthy, overall is unhealthy
  if (results[0] === 'unhealthy') {
    // Database is critical
    return 'unhealthy';
  }

  // If any service is unhealthy or system is warning, overall is degraded
  if (results.includes('unhealthy') || systemHealth.status === 'warning') {
    return 'degraded';
  }

  return 'healthy';
}
