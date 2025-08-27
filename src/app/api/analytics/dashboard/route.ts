import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { analyticsService } from '@/lib/services/analyticsService';

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

    const { searchParams } = new URL(request.url);
    const isAuthor = searchParams.get('author') === 'true';
    const period = searchParams.get('period') || 'month';

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'user';

    // Get dashboard data
    const dashboardData = await analyticsService.getDashboardData(
      user.id,
      isAuthor
    );

    // Get additional data based on user role
    let additionalData = {};

    if (isAuthor || userRole === 'author') {
      // Get author-specific analytics
      const authorAnalytics = await analyticsService.getAuthorAnalytics(
        user.id,
        period === 'week'
          ? 'weekly'
          : period === 'quarter'
            ? 'quarterly'
            : 'monthly',
        12
      );
      additionalData = { authorAnalytics };
    }

    if (['admin', 'editor'].includes(userRole)) {
      // Get top performing content across all authors
      const [topArticles, topNews] = await Promise.all([
        analyticsService.getTopPerformingContent('article', 'week', 10),
        analyticsService.getTopPerformingContent('news', 'week', 10),
      ]);

      additionalData = {
        ...additionalData,
        topArticles,
        topNews,
      };
    }

    return NextResponse.json({
      ...dashboardData,
      ...additionalData,
      userRole,
      period,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
