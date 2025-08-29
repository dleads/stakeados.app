import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const articleId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get article details
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        content,
        summary,
        status,
        published_at,
        created_at,
        updated_at,
        reading_time,
        language,
        views,
        likes,
        profiles!articles_author_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        categories (
          id,
          name,
          color
        ),
        article_tags (
          tags (
            name
          )
        )
      `
      )
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get time series metrics data - TODO: Implement when content_metrics table is available
    // const { data: metricsData } = await supabase
    //   .from('content_metrics')
    //   .select('*')
    //   .eq('content_type', 'article')
    //   .eq('content_id', articleId)
    //   .gte('recorded_at', startDate.toISOString())
    //   .lte('recorded_at', endDate.toISOString())
    //   .order('recorded_at', { ascending: true });

    // TODO: Process metrics data when content_metrics table is available
    // For now, we'll use mock data
    const mockTimeSeriesData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      mockTimeSeriesData.push({
        date: dateStr,
        views: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 20) + 2,
        shares: Math.floor(Math.random() * 10) + 1,
        readingTime: Math.floor(Math.random() * 300) + 60,
        readingTimeCount: 1,
      });
    }

    const timeSeriesData = mockTimeSeriesData.reverse();

    // Convert to array and calculate averages
    const processedTimeSeriesData = timeSeriesData.map(day => ({
      ...day,
      readingTime:
        day.readingTimeCount > 0 ? day.readingTime / day.readingTimeCount : 0,
    }));

    // Calculate growth rates (comparing first and last week)
    const firstWeekData = processedTimeSeriesData.slice(0, 7);
    const lastWeekData = processedTimeSeriesData.slice(-7);

    const firstWeekViews = firstWeekData.reduce(
      (sum, day) => sum + day.views,
      0
    );
    const lastWeekViews = lastWeekData.reduce((sum, day) => sum + day.views, 0);
    const firstWeekLikes = firstWeekData.reduce(
      (sum, day) => sum + day.likes,
      0
    );
    const lastWeekLikes = lastWeekData.reduce((sum, day) => sum + day.likes, 0);

    const viewsGrowth =
      firstWeekViews > 0
        ? ((lastWeekViews - firstWeekViews) / firstWeekViews) * 100
        : 0;
    const likesGrowth =
      firstWeekLikes > 0
        ? ((lastWeekLikes - firstWeekLikes) / firstWeekLikes) * 100
        : 0;

    // Calculate engagement metrics
    const totalViews = processedTimeSeriesData.reduce(
      (sum, day) => sum + day.views,
      0
    );
    const totalLikes = processedTimeSeriesData.reduce(
      (sum, day) => sum + day.likes,
      0
    );
    const totalShares = processedTimeSeriesData.reduce(
      (sum, day) => sum + day.shares,
      0
    );
    const avgReadingTime =
      processedTimeSeriesData.length > 0
        ? processedTimeSeriesData.reduce(
            (sum, day) => sum + day.readingTime,
            0
          ) / processedTimeSeriesData.length
        : 0;

    const engagementRate =
      totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0;
    const bounceRate = Math.random() * 30 + 20; // Mock data - would need real analytics

    // Mock demographics data (would come from real analytics service)
    const demographics = {
      topCountries: [
        {
          country: 'United States',
          views: Math.floor(totalViews * 0.35),
          percentage: 35,
        },
        {
          country: 'Spain',
          views: Math.floor(totalViews * 0.25),
          percentage: 25,
        },
        {
          country: 'Mexico',
          views: Math.floor(totalViews * 0.15),
          percentage: 15,
        },
        {
          country: 'Argentina',
          views: Math.floor(totalViews * 0.12),
          percentage: 12,
        },
        {
          country: 'Colombia',
          views: Math.floor(totalViews * 0.08),
          percentage: 8,
        },
        {
          country: 'Other',
          views: Math.floor(totalViews * 0.05),
          percentage: 5,
        },
      ],
      deviceTypes: [
        {
          device: 'Mobile',
          views: Math.floor(totalViews * 0.65),
          percentage: 65,
        },
        {
          device: 'Desktop',
          views: Math.floor(totalViews * 0.25),
          percentage: 25,
        },
        {
          device: 'Tablet',
          views: Math.floor(totalViews * 0.1),
          percentage: 10,
        },
      ],
      referralSources: [
        {
          source: 'Direct',
          views: Math.floor(totalViews * 0.4),
          percentage: 40,
        },
        {
          source: 'Google',
          views: Math.floor(totalViews * 0.3),
          percentage: 30,
        },
        {
          source: 'Social Media',
          views: Math.floor(totalViews * 0.2),
          percentage: 20,
        },
        {
          source: 'Other',
          views: Math.floor(totalViews * 0.1),
          percentage: 10,
        },
      ],
    };

    // Get related articles (by category or tags)
    const { data: relatedArticles } = await supabase
      .from('articles')
      .select('id, title, views')
      .neq('id', articleId)
      .eq('status', 'published')
      .or(`category_id.eq.${article.categories?.id}`)
      .order('views', { ascending: false })
      .limit(10);

    const response = {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary,
        author: article.profiles,
        category: article.categories,
        tags: [], // TODO: Fix article_tags relationship
        status: article.status,
        published_at: article.published_at,
        created_at: article.created_at,
        updated_at: article.updated_at,
        reading_time: article.reading_time,
        language: article.language,
      },
      metrics: {
        totalViews,
        totalLikes,
        totalShares,
        avgReadingTime,
        bounceRate,
        engagementRate,
        viewsGrowth,
        likesGrowth,
      },
      timeSeriesData,
      demographics,
      relatedArticles:
        relatedArticles?.map(ra => ({
          id: ra.id,
          title: ra.title,
          views: ra.views || 0,
          similarity: Math.random() * 0.4 + 0.6, // Mock similarity score
        })) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Article performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
