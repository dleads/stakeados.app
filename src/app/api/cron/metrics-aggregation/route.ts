import { NextRequest, NextResponse } from 'next/server';
import { metricsAggregationService } from '../../../../lib/services/metricsAggregationService';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run scheduled aggregation jobs
    await metricsAggregationService.scheduleAutomaticJobs();

    // Update trending scores (run more frequently)
    await metricsAggregationService.updateTrendingScores();

    return NextResponse.json({
      success: true,
      message: 'Metrics aggregation jobs completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron metrics aggregation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run metrics aggregation',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const stats = await metricsAggregationService.getAggregationStats();

    return NextResponse.json({
      status: 'healthy',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
