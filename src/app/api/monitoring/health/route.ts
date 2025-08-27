import { NextRequest, NextResponse } from 'next/server';
import { contentMonitoring } from '@/lib/monitoring/contentMonitoring';
import { performanceMonitoring } from '@/lib/monitoring/performanceMonitoring';

export async function GET(_request: NextRequest) {
  try {
    // Get system health from monitoring service
    const systemHealth = await contentMonitoring.getSystemHealth();
    const performanceMetrics =
      await performanceMonitoring.getPerformanceMetrics();

    // Basic health checks
    const healthChecks = {
      database: await checkDatabase(),
      cache: await checkCache(),
      aiService: await checkAIService(),
      emailService: await checkEmailService(),
    };

    const allServicesHealthy = Object.values(healthChecks).every(
      check => check.healthy
    );

    const response = {
      status:
        allServicesHealthy && systemHealth.status === 'healthy'
          ? 'healthy'
          : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      systemHealth,
      services: healthChecks,
      performance: {
        averageResponseTime:
          performanceMetrics.contentDelivery.averageResponseTime,
        cacheHitRate: performanceMetrics.contentDelivery.cacheHitRate,
        errorRate: performanceMetrics.contentDelivery.errorRate,
      },
      uptime: process.uptime(),
    };

    const statusCode = response.status === 'healthy' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

async function checkDatabase() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const startTime = Date.now();
    const { error } = await supabase.from('articles').select('count').limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime,
      };
    }

    return {
      healthy: true,
      responseTime,
      status: 'connected',
    };
  } catch (error) {
    return {
      healthy: false,
      error:
        error instanceof Error ? error.message : 'Database connection failed',
      responseTime: 0,
    };
  }
}

async function checkCache() {
  try {
    const Redis = await import('ioredis');
    const redis = new Redis.default(process.env.REDIS_URL!);

    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;

    const info = await redis.info('memory');
    const memoryUsage = info.match(/used_memory:(\d+)/)?.[1];

    redis.disconnect();

    return {
      healthy: true,
      responseTime,
      memoryUsage: memoryUsage ? parseInt(memoryUsage) : 0,
      status: 'connected',
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Cache connection failed',
      responseTime: 0,
    };
  }
}

async function checkAIService() {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const startTime = Date.now();

    // Simple test request
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5,
    });

    const responseTime = Date.now() - startTime;

    if (response.choices && response.choices.length > 0) {
      return {
        healthy: true,
        responseTime,
        status: 'connected',
        model: 'gpt-3.5-turbo',
      };
    }

    return {
      healthy: false,
      error: 'Invalid response from AI service',
      responseTime,
    };
  } catch (error) {
    return {
      healthy: false,
      error:
        error instanceof Error ? error.message : 'AI service connection failed',
      responseTime: 0,
    };
  }
}

async function checkEmailService() {
  try {
    // For Resend, we'll just check if the API key is configured
    // A full test would require sending an actual email
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return {
        healthy: false,
        error: 'Email service API key not configured',
        responseTime: 0,
      };
    }

    // Basic API connectivity check
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now();

    return {
      healthy: response.ok,
      responseTime,
      status: response.ok ? 'connected' : 'error',
      statusCode: response.status,
    };
  } catch (error) {
    return {
      healthy: false,
      error:
        error instanceof Error ? error.message : 'Email service check failed',
      responseTime: 0,
    };
  }
}
