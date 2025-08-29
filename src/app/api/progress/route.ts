import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, course_id, content_id, completed_at, score } = body || {};

    if (!user_id || !course_id || !content_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id,
          course_id,
          content_id,
          completed_at: completed_at ?? null,
          score: typeof score === 'number' ? score : null,
        } as any,
        { onConflict: 'user_id,course_id,content_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to upsert progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error in progress POST:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
