import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as any;

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const sourceId = url.searchParams.get('source_id');
    const categoryId = url.searchParams.get('category_id');
    const processed = url.searchParams.get('processed');
    const sortBy = url.searchParams.get('sort_by') || 'trending_score';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = supabase
      .from('news')
      .select(
        `
        id,
        title,
        summary,
        source_url,
        source_name,
        published_at,
        created_at,
        updated_at,
        processed,
        trending_score,
        language,
        ai_metadata,
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
    if (sourceId) {
      query = query.eq('source_id', sourceId);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (processed !== null && processed !== undefined) {
      query = query.eq('processed', processed === 'true');
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: news, error }: { data: any[] | null; error: any } = await (query as any);

    if (error) {
      throw error;
    }

    // Process news data to include calculated metrics
    const processedNews =
      news?.map((newsItem: any) => {
        const metrics = newsItem.content_metrics || [];
        const aiMetadata = newsItem.ai_metadata || {};

        // Calculate engagement metrics
        const viewMetrics = metrics.filter(
          (m: any) => m.metric_type === 'view'
        );
        const likeMetrics = metrics.filter(
          (m: any) => m.metric_type === 'like'
        );
        const shareMetrics = metrics.filter(
          (m: any) => m.metric_type === 'share'
        );

        const totalViews = viewMetrics.length;
        const totalLikes = likeMetrics.length;
        const totalShares = shareMetrics.length;
        const engagementRate =
          totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0;

        // Calculate daily metrics for the period
        const dailyMetrics: Record<string, any> = {};
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayMetrics = metrics.filter(
            (m: any) => m.recorded_at && m.recorded_at.startsWith(dateStr)
          );

          dailyMetrics[dateStr] = {
            views: dayMetrics.filter((m: any) => m.metric_type === 'view')
              .length,
            likes: dayMetrics.filter((m: any) => m.metric_type === 'like')
              .length,
            shares: dayMetrics.filter((m: any) => m.metric_type === 'share')
              .length,
          };
        }

        return {
          id: newsItem.id,
          title: newsItem.title,
          summary: newsItem.summary,
          sourceName: newsItem.source_name,
          sourceUrl: newsItem.source_url,
          publishedAt: newsItem.published_at,
          createdAt: newsItem.created_at,
          updatedAt: newsItem.updated_at,
          processed: newsItem.processed,
          trendingScore: newsItem.trending_score,
          language: newsItem.language,
          category: newsItem.category,
          aiAnalysis: {
            relevanceScore: aiMetadata.relevance_score || 0,
            sentiment: aiMetadata.sentiment || 'neutral',
            keywords: aiMetadata.keywords || [],
            summaryGenerated: aiMetadata.summary_generated || false,
            duplicateCheck: aiMetadata.duplicate_check || {
              is_duplicate: false,
            },
          },
          performance: {
            views: totalViews,
            likes: totalLikes,
            shares: totalShares,
            engagementRate: Math.round(engagementRate * 100) / 100,
            dailyMetrics,
          },
        };
      }) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from('news')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (sourceId) countQuery = countQuery.eq('source_id', sourceId);
    if (categoryId) countQuery = countQuery.eq('category_id', categoryId);
    if (processed !== null && processed !== undefined) {
      countQuery = countQuery.eq('processed', processed === 'true');
    }

    const { count } = (await (countQuery as any)) as { count: number | null };

    // Get source performance statistics
    const { data: sourceStats } = (await supabase
      .from('news')
      .select('source_name, processed, trending_score, created_at')
      .gte('created_at', startDate.toISOString())) as { data: any[] | null };

    const sourcePerformance: Record<string, any> = {};
    sourceStats?.forEach((item: any) => {
      if (!sourcePerformance[item.source_name]) {
        sourcePerformance[item.source_name] = {
          total: 0,
          processed: 0,
          avgTrendingScore: 0,
          scores: [],
        };
      }
      sourcePerformance[item.source_name].total++;
      if (item.processed) sourcePerformance[item.source_name].processed++;
      if (item.trending_score)
        sourcePerformance[item.source_name].scores.push(item.trending_score);
    });

    // Calculate average trending scores
    Object.keys(sourcePerformance).forEach(source => {
      const scores = sourcePerformance[source].scores;
      sourcePerformance[source].avgTrendingScore =
        scores.length > 0
          ? Math.round(
              (scores.reduce((sum: number, score: any) => sum + score, 0) /
                scores.length) *
                100
            ) / 100
          : 0;
      sourcePerformance[source].processingRate =
        sourcePerformance[source].total > 0
          ? Math.round(
              (sourcePerformance[source].processed /
                sourcePerformance[source].total) *
                100
            )
          : 0;
    });

    // Calculate summary statistics
    const summary = {
      totalNews: count || 0,
      processedNews: processedNews.filter(n => n.processed).length,
      pendingNews: processedNews.filter(n => !n.processed).length,
      avgTrendingScore:
        processedNews.length > 0
          ? Math.round(
              (processedNews.reduce((sum, n) => sum + n.trendingScore, 0) /
                processedNews.length) *
                100
            ) / 100
          : 0,
      totalViews: processedNews.reduce(
        (sum, n) => sum + n.performance.views,
        0
      ),
      totalEngagement: processedNews.reduce(
        (sum, n) => sum + n.performance.likes + n.performance.shares,
        0
      ),
      avgEngagementRate:
        processedNews.length > 0
          ? Math.round(
              (processedNews.reduce(
                (sum, n) => sum + n.performance.engagementRate,
                0
              ) /
                processedNews.length) *
                100
            ) / 100
          : 0,
      sourcePerformance: Object.entries(sourcePerformance)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.avgTrendingScore - a.avgTrendingScore),
    };

    const response = {
      news: processedNews,
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
      filters: {
        days,
        sourceId,
        categoryId,
        processed,
        sortBy,
        sortOrder,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('News analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news analytics' },
      { status: 500 }
    );
  }
}
