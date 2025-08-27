import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(
  request: NextRequest,
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

    const { id } = params;
    const { action } = await request.json();

    if (!action || !['like', 'share', 'bookmark'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be like, share, or bookmark' },
        { status: 400 }
      );
    }

    // Verify news exists
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('id')
      .eq('id', id)
      .single();

    if (newsError || !news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // TODO: Implement when content_interactions table is created
    // Return mock success response for now
    console.log(`User ${user.id} performed ${action} on news ${id}`);

    return NextResponse.json({
      success: true,
      message: `${action} action recorded (mock response)`,
      action,
      newsId: id,
      userId: user.id,
    });
  } catch (error) {
    console.error('News interaction error:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}

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

    const { id } = params;

    // TODO: Implement when content_interactions table is created
    // Return mock interaction data for now
    console.log('Getting interactions for news:', id);
    const mockInteractions = {
      newsId: id,
      likes: 25,
      shares: 8,
      bookmarks: 12,
      userInteractions: {
        liked: false,
        shared: false,
        bookmarked: false,
      },
    };

    return NextResponse.json(mockInteractions);
  } catch (error) {
    console.error('Get news interactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get interactions' },
      { status: 500 }
    );
  }
}
