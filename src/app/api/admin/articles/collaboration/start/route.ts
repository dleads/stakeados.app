import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    // Check if user has access to the article
    const { data: article } = await supabase
      .from('articles')
      .select('id, author_id')
      .eq('id', articleId)
      .single();

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const hasAccess =
      article.author_id === user.id ||
      (profile &&
        profile.role &&
        ['admin', 'super_admin', 'editor'].includes(profile.role));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // End any existing active sessions for this user on this article
    await supabase
      .from('article_collaboration_sessions')
      .update({
        is_active: false,
        session_end: new Date().toISOString(),
      })
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Create new collaboration session
    const { data: session, error } = await supabase
      .from('article_collaboration_sessions')
      .insert({
        article_id: articleId,
        user_id: user.id,
        session_start: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating collaboration session:', error);
      return NextResponse.json(
        { error: 'Failed to start collaboration session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      message: 'Collaboration session started',
    });
  } catch (error) {
    console.error('Error in collaboration start API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
