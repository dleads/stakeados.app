import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.role ||
      !['admin', 'super_admin', 'editor'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeCompleted = searchParams.get('include_completed') === 'true';

    // Validate job type
    const validJobTypes = [
      'ai_processing',
      'rss_fetch',
      'bulk_operation',
      'backup',
      'maintenance',
    ] as const;
    const validStatuses = [
      'started',
      'progress',
      'completed',
      'failed',
      'cancelled',
    ] as const;

    let query = supabase
      .from('background_jobs')
      .select(
        `
        *,
        profiles:started_by(id, name, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type && validJobTypes.includes(type as any)) {
      query = query.eq('job_type', type as any);
    }

    if (status && validStatuses.includes(status as any)) {
      query = query.eq('status', status as any);
    } else if (!includeCompleted) {
      query = query.in('status', ['started', 'progress']);
    }

    const { data: processes, error } = await query;

    if (error) {
      console.error('Error fetching background processes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch processes' },
        { status: 500 }
      );
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('background_jobs')
      .select('status');

    const statistics = {
      total: stats?.length || 0,
      running:
        stats?.filter(s => ['started', 'progress'].includes(s.status)).length ||
        0,
      completed: stats?.filter(s => s.status === 'completed').length || 0,
      failed: stats?.filter(s => s.status === 'failed').length || 0,
      cancelled: stats?.filter(s => s.status === 'cancelled').length || 0,
    };

    return NextResponse.json({
      processes,
      statistics,
    });
  } catch (error) {
    console.error('Error in background processes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.role ||
      !['admin', 'super_admin'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { jobType, data = {}, message } = body;

    if (!jobType) {
      return NextResponse.json(
        { error: 'Missing required field: jobType' },
        { status: 400 }
      );
    }

    const validJobTypes = [
      'ai_processing',
      'rss_fetch',
      'bulk_operation',
      'backup',
      'maintenance',
    ];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    const { data: process, error } = await supabase
      .from('background_jobs')
      .insert({
        job_type: jobType,
        status: 'started',
        progress: 0,
        message,
        data,
        started_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating background process:', error);
      return NextResponse.json(
        { error: 'Failed to create process' },
        { status: 500 }
      );
    }

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error('Error in background processes POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
