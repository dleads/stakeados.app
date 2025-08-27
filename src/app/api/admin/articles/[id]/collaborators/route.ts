import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const articleId = params.id;

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

    // TODO: Implement when article_collaboration_sessions table is available
    // Get active collaborators
    // const { data: collaborators, error } = await supabase
    //   .from('article_collaboration_sessions')
    //   .select(`
    //     *,
    //     profiles:user_id(id, name, email, avatar_url)
    //   `)
    //   .eq('article_id', articleId)
    //   .eq('is_active', true)
    //   .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes

    // if (error) {
    //   console.error('Error fetching collaborators:', error)
    //   return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 })
    // }

    // const formattedCollaborators = collaborators?.map(collab => ({
    //   userId: collab.user_id,
    //   userName: collab.profiles?.name || collab.profiles?.email || 'Unknown User',
    //   userAvatar: collab.profiles?.avatar_url,
    //   sessionId: collab.id,
    //   lastActivity: collab.last_activity,
    //   cursorPosition: collab.cursor_position,
    //   selectionRange: collab.selection_range,
    //   isActive: collab.is_active
    // })) || []

    return NextResponse.json({
      collaborators: [],
      totalActive: 0,
    });
  } catch (error) {
    console.error('Error in collaborators API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
