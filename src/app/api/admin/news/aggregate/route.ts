import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { newsAggregationService } from '@/lib/services/newsAggregationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/editor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !profile.role ||
      !['admin', 'editor'].includes(profile.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobType = 'full' } = body;

    let result;

    switch (jobType) {
      case 'fetch':
        result = await newsAggregationService.runFetchJob();
        break;
      case 'process':
        result = await newsAggregationService.runProcessingJob();
        break;
      case 'cleanup':
        result = await newsAggregationService.runCleanupJob();
        break;
      case 'full':
      default:
        result = await newsAggregationService.runFullPipeline();
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('News aggregation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run news aggregation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/editor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      profileError ||
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const daysBack = parseInt(searchParams.get('days') || '7');

    // Get job history and stats
    const [jobHistory, stats] = await Promise.all([
      newsAggregationService.getJobHistory(limit),
      newsAggregationService.getAggregationStats(daysBack),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobHistory,
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to get aggregation data:', error);
    return NextResponse.json(
      {
        error: 'Failed to get aggregation data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
