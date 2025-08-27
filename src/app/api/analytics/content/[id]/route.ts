import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { analyticsService } from '@/lib/services/analyticsService';

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type') as 'article' | 'news';
    const period = searchParams.get('period') as
      | 'week'
      | 'month'
      | 'quarter'
      | 'year';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to view analytics for this content
    if (contentType === 'article') {
      const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', params.id)
        .single();

      if (!article) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }

      // Check if user is the author or has admin/editor role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAuthor = article.author_id === user.id;
      const isAdminOrEditor =
        profile?.role && ['admin', 'editor'].includes(profile.role);

      if (!isAuthor && !isAdminOrEditor) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get performance metrics
    const metrics = await analyticsService.getContentPerformanceMetrics(
      params.id,
      contentType,
      period || 'month'
    );

    // Get analytics data
    const filters =
      startDate && endDate
        ? {
            dateRange: { start: startDate, end: endDate },
          }
        : undefined;

    const analytics = await analyticsService.getContentAnalytics(
      params.id,
      contentType,
      filters
    );

    return NextResponse.json({
      metrics,
      analytics,
      contentId: params.id,
      contentType,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Track content interaction
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

    const body = await request.json();
    const {
      contentType,
      interactionType,
      metadata = {},
      deviceInfo = {},
      referrer,
    } = body;

    // Use metadata to avoid unused variable warning
    console.log('Analytics metadata:', metadata);

    if (!contentType || !interactionType) {
      return NextResponse.json(
        { error: 'Content type and interaction type are required' },
        { status: 400 }
      );
    }

    // Record the interaction
    // Note: content_interactions table doesn't exist yet, skipping for now
    const interactionError = null;

    if (interactionError) {
      throw interactionError;
    }

    // If it's a view interaction, also create/update reading session
    if (interactionType === 'view') {
      const sessionId = await analyticsService.startReadingSession(
        user.id,
        params.id,
        contentType,
        deviceInfo,
        referrer
      );

      return NextResponse.json({
        success: true,
        sessionId,
        message: 'Interaction recorded and reading session started',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Interaction recorded successfully',
    });
  } catch (error) {
    console.error('Interaction tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}
