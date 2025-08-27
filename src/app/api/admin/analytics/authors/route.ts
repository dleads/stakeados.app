import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

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

    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const authorId = url.searchParams.get('author_id');
    const sortBy = url.searchParams.get('sort_by') || 'totalArticles';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all authors with their articles and performance data
    let authorsQuery = supabase
      .from('profiles')
      .select(
        `
        id,
        full_name,
        email,
        created_at,
        articles:articles(
          id,
          title,
          status,
          views,
          likes,
          reading_time,
          published_at,
          created_at,
          updated_at,
          category_id,
          content_metrics:content_metrics(
            metric_type,
            value,
            recorded_at
          )
        )
      `
      )
      .not('articles', 'is', null);

    // Filter by specific author if requested
    if (authorId) {
      authorsQuery = authorsQuery.eq('id', authorId);
    }

    const { data: authors, error } = await authorsQuery;

    if (error) {
      throw error;
    }

    // Process authors data to calculate productivity metrics
    const processedAuthors =
      authors?.map(author => {
        const allArticles = author.articles || [];
        const recentArticles = allArticles.filter(
          article => new Date(article.created_at) >= startDate
        );
        const publishedArticles = allArticles.filter(
          article => article.status === 'published'
        );
        const recentPublished = recentArticles.filter(
          article => article.status === 'published'
        );

        // Calculate engagement metrics
        const totalViews = publishedArticles.reduce(
          (sum, article) => sum + (article.views || 0),
          0
        );
        const totalLikes = publishedArticles.reduce(
          (sum, article) => sum + (article.likes || 0),
          0
        );
        const avgViewsPerArticle =
          publishedArticles.length > 0
            ? Math.round(totalViews / publishedArticles.length)
            : 0;
        const avgLikesPerArticle =
          publishedArticles.length > 0
            ? Math.round(totalLikes / publishedArticles.length)
            : 0;

        // Calculate reading time statistics
        const totalReadingTime = publishedArticles.reduce(
          (sum, article) => sum + (article.reading_time || 0),
          0
        );
        const avgReadingTime =
          publishedArticles.length > 0
            ? Math.round(totalReadingTime / publishedArticles.length)
            : 0;

        // Calculate productivity metrics
        const daysActive = Math.max(
          1,
          Math.ceil(
            (new Date().getTime() - new Date(author.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        const articlesPerDay =
          Math.round((allArticles.length / daysActive) * 100) / 100;
        const recentProductivity =
          Math.round((recentArticles.length / days) * 100) / 100;

        // Calculate category distribution
        const categoryDistribution: Record<string, number> = {};
        publishedArticles.forEach(article => {
          const categoryName = article.category_id
            ? `Category ${article.category_id}`
            : 'Uncategorized';
          categoryDistribution[categoryName] =
            (categoryDistribution[categoryName] || 0) + 1;
        });

        // Calculate monthly productivity for the last 12 months
        const monthlyProductivity: Record<string, any> = {};
        for (let i = 0; i < 12; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          const monthArticles = allArticles.filter(article => {
            const articleDate = new Date(article.created_at);
            return (
              articleDate.getFullYear() === date.getFullYear() &&
              articleDate.getMonth() === date.getMonth()
            );
          });

          monthlyProductivity[monthKey] = {
            total: monthArticles.length,
            published: monthArticles.filter(a => a.status === 'published')
              .length,
            draft: monthArticles.filter(a => a.status === 'draft').length,
            review: monthArticles.filter(a => a.status === 'review').length,
          };
        }

        // Calculate engagement trends
        const engagementTrend = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          let dayViews = 0;
          let dayLikes = 0;

          publishedArticles.forEach(article => {
            const metrics = article.content_metrics || [];
            const dayMetrics = metrics.filter(
              m => m.recorded_at && m.recorded_at.startsWith(dateStr)
            );
            dayViews += dayMetrics.filter(m => m.metric_type === 'view').length;
            dayLikes += dayMetrics.filter(m => m.metric_type === 'like').length;
          });

          engagementTrend.push({
            date: dateStr,
            views: dayViews,
            likes: dayLikes,
          });
        }

        return {
          id: author.id,
          name: author.full_name,
          email: author.email,
          joinedAt: author.created_at,
          productivity: {
            totalArticles: allArticles.length,
            publishedArticles: publishedArticles.length,
            draftArticles: allArticles.filter(a => a.status === 'draft').length,
            reviewArticles: allArticles.filter(a => a.status === 'review')
              .length,
            recentArticles: recentArticles.length,
            recentPublished: recentPublished.length,
            articlesPerDay,
            recentProductivity,
            monthlyProductivity,
          },
          performance: {
            totalViews,
            totalLikes,
            avgViewsPerArticle,
            avgLikesPerArticle,
            avgReadingTime,
            engagementRate:
              totalViews > 0
                ? Math.round((totalLikes / totalViews) * 10000) / 100
                : 0,
            engagementTrend,
          },
          content: {
            categoryDistribution,
            topPerformingArticles: publishedArticles
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 5)
              .map(article => ({
                id: article.id,
                title: article.title,
                views: article.views || 0,
                likes: article.likes || 0,
                publishedAt: article.published_at,
              })),
          },
        };
      }) || [];

    // Apply sorting
    const sortedAuthors = processedAuthors.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'totalArticles':
          aValue = a.productivity.totalArticles;
          bValue = b.productivity.totalArticles;
          break;
        case 'publishedArticles':
          aValue = a.productivity.publishedArticles;
          bValue = b.productivity.publishedArticles;
          break;
        case 'totalViews':
          aValue = a.performance.totalViews;
          bValue = b.performance.totalViews;
          break;
        case 'avgViewsPerArticle':
          aValue = a.performance.avgViewsPerArticle;
          bValue = b.performance.avgViewsPerArticle;
          break;
        case 'engagementRate':
          aValue = a.performance.engagementRate;
          bValue = b.performance.engagementRate;
          break;
        case 'recentProductivity':
          aValue = a.productivity.recentProductivity;
          bValue = b.productivity.recentProductivity;
          break;
        default:
          aValue = a.productivity.totalArticles;
          bValue = b.productivity.totalArticles;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Apply pagination
    const paginatedAuthors = sortedAuthors.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      totalAuthors: processedAuthors.length,
      activeAuthors: processedAuthors.filter(
        a => a.productivity.recentArticles > 0
      ).length,
      totalArticles: processedAuthors.reduce(
        (sum, a) => sum + a.productivity.totalArticles,
        0
      ),
      totalPublished: processedAuthors.reduce(
        (sum, a) => sum + a.productivity.publishedArticles,
        0
      ),
      totalViews: processedAuthors.reduce(
        (sum, a) => sum + a.performance.totalViews,
        0
      ),
      totalLikes: processedAuthors.reduce(
        (sum, a) => sum + a.performance.totalLikes,
        0
      ),
      avgProductivity:
        processedAuthors.length > 0
          ? Math.round(
              (processedAuthors.reduce(
                (sum, a) => sum + a.productivity.articlesPerDay,
                0
              ) /
                processedAuthors.length) *
                100
            ) / 100
          : 0,
      topPerformers: processedAuthors
        .sort((a, b) => b.performance.totalViews - a.performance.totalViews)
        .slice(0, 5)
        .map(author => ({
          id: author.id,
          name: author.name,
          totalViews: author.performance.totalViews,
          totalArticles: author.productivity.totalArticles,
        })),
    };

    const response = {
      authors: paginatedAuthors,
      summary,
      pagination: {
        total: processedAuthors.length,
        limit,
        offset,
        hasMore: offset + limit < processedAuthors.length,
      },
      filters: {
        days,
        authorId,
        sortBy,
        sortOrder,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Authors analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors analytics' },
      { status: 500 }
    );
  }
}
