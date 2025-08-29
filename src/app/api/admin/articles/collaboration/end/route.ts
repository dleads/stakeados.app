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
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // TODO: Implement when article_collaboration_sessions table is available
    // End the collaboration session
    // const { data: session, error } = await supabase
    //   .from('article_collaboration_sessions')
    //   .update({
    //     is_active: false,
    //     session_end: new Date().toISOString()
    //   })
    //   .eq('id', sessionId)
    //   .eq('user_id', user.id)
    //   .select()
    //   .single()

    // if (error) {
    //   console.error('Error ending collaboration session:', error)
    //   return NextResponse.json({ error: 'Failed to end collaboration session' }, { status: 500 })
    // }

    // if (!session) {
    //   return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    // }

    return NextResponse.json({
      message: 'Collaboration feature not yet implemented',
      note: 'Article collaboration sessions table not available',
    });
  } catch (error) {
    console.error('Error in collaboration end API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
