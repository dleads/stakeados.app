import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest, // Required for Next.js API route signature
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    // Get job progress from bulk_operations table
    const { data: job, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user can only see their own jobs
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      operation_type: job.operation_type,
      status: job.status,
      progress: job.progress,
      total_items: job.total_items,
      processed_items: job.processed_items,
      success_count: job.success_count,
      error_count: job.error_count,
      errors: job.errors,
      started_at: job.started_at,
      completed_at: job.completed_at,
      estimated_completion: job.estimated_completion,
    });
  } catch (error) {
    console.error('Get bulk operation progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
