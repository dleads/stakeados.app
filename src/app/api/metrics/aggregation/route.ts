import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { metricsAggregationService } from '../../../../lib/services/metricsAggregationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobType, targetDate, retentionDays } = body;

    let result;

    switch (jobType) {
      case 'daily':
        result = await metricsAggregationService.runDailyAggregation(
          targetDate ? new Date(targetDate) : undefined
        );
        break;

      case 'weekly':
        await metricsAggregationService.runWeeklyAggregation();
        result = { message: 'Weekly aggregation completed' };
        break;

      case 'monthly':
        await metricsAggregationService.runMonthlyAggregation();
        result = { message: 'Monthly aggregation completed' };
        break;

      case 'cleanup':
        result = await metricsAggregationService.runCleanup(
          retentionDays || 90
        );
        break;

      case 'trending':
        await metricsAggregationService.updateTrendingScores();
        result = { message: 'Trending scores updated' };
        break;

      default:
        return NextResponse.json(
          {
            error:
              'Invalid job type. Must be one of: daily, weekly, monthly, cleanup, trending',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      jobType,
      result,
    });
  } catch (error) {
    console.error('Metrics aggregation API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run aggregation job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.role ||
      !['admin', 'editor'].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (jobId) {
      // Get specific job status
      const job = await metricsAggregationService.getJobStatus(jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({ job });
    }

    // Get recent jobs and aggregation stats
    const [recentJobs, stats] = await Promise.all([
      metricsAggregationService.getRecentJobs(limit),
      metricsAggregationService.getAggregationStats(),
    ]);

    return NextResponse.json({
      recentJobs,
      stats,
      summary: {
        totalJobs: recentJobs.length,
        completedJobs: recentJobs.filter(job => job.status === 'completed')
          .length,
        failedJobs: recentJobs.filter(job => job.status === 'failed').length,
        runningJobs: recentJobs.filter(job => job.status === 'running').length,
      },
    });
  } catch (error) {
    console.error('Metrics aggregation GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
