export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = admin.supabase!;

    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const categoryId = url.searchParams.get('category_id');
    const authorId = url.searchParams.get('author_id');
    const status = url.searchParams.get('status');
    const sortBy = url.searchParams.get('sort_by') || 'views';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = supabase
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        status,
        views,
        likes,
        reading_time,
        published_at,
        created_at,
        updated_at,
        author:profiles(id, full_name),
        category:categories(id, name),
        content_metrics:content_metrics(
          metric_type,
          value,
          recorded_at
        )
      `
      )
      .gte('created_at', startDate.toISOString());

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: articles, error } = await query;

    if (error) {
      throw error;
    }

    // Process articles data to include calculated metrics
    const processedArticles =
      articles?.map(article => {
        const metrics = article.content_metrics || [];

        // Calculate engagement metrics
        const totalViews = article.views || 0;
        const totalLikes = article.likes || 0;
        const engagementRate =
          totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

        // Calculate average read time from metrics
        const readTimeMetrics = Array.isArray(metrics)
          ? metrics.filter(m => m.metric_type === 'read_time')
          : [];
        const avgReadTime =
          readTimeMetrics.length > 0
            ? readTimeMetrics.reduce((sum, m) => sum + m.value, 0) /
              readTimeMetrics.length
            : 0;

        // Calculate daily metrics for the period
        const dailyMetrics: Record<
          string,
          { views: number; likes: number; shares: number }
        > = {};
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayMetrics = Array.isArray(metrics)
            ? metrics.filter(
                m => m.recorded_at && m.recorded_at.startsWith(dateStr)
              )
            : [];

          dailyMetrics[dateStr] = {
            views: dayMetrics.filter(m => m.metric_type === 'view').length,
            likes: dayMetrics.filter(m => m.metric_type === 'like').length,
            shares: dayMetrics.filter(m => m.metric_type === 'share').length,
          };
        }

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
          author: article.author,
          category: article.category,
          publishedAt: article.published_at,
          createdAt: article.created_at,
          updatedAt: article.updated_at,
          readingTime: article.reading_time,
          performance: {
            views: totalViews,
            likes: totalLikes,
            engagementRate: Math.round(engagementRate * 100) / 100,
            avgReadTime: Math.round(avgReadTime),
            dailyMetrics,
          },
        };
      }) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (categoryId) countQuery = countQuery.eq('category_id', categoryId);
    if (authorId) countQuery = countQuery.eq('author_id', authorId);
    if (status) countQuery = countQuery.eq('status', status);

    const { count } = await countQuery;

    // Calculate summary statistics
    const summary = {
      totalArticles: count || 0,
      totalViews: processedArticles.reduce(
        (sum, a) => sum + a.performance.views,
        0
      ),
      totalLikes: processedArticles.reduce(
        (sum, a) => sum + a.performance.likes,
        0
      ),
      avgEngagementRate:
        processedArticles.length > 0
          ? Math.round(
              (processedArticles.reduce(
                (sum, a) => sum + a.performance.engagementRate,
                0
              ) /
                processedArticles.length) *
                100
            ) / 100
          : 0,
      avgReadTime:
        processedArticles.length > 0
          ? Math.round(
              processedArticles.reduce(
                (sum, a) => sum + a.performance.avgReadTime,
                0
              ) / processedArticles.length
            )
          : 0,
    };

    const response = {
      articles: processedArticles,
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
      filters: {
        days,
        categoryId,
        authorId,
        status,
        sortBy,
        sortOrder,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Articles analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles analytics' },
      { status: 500 }
    );
  }
}
