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

    // Get date range from query params (default to last 30 days)
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch dashboard metrics
    const [
      articlesStats,
      newsStats,
      categoriesStats,
      recentActivity,
      topPerformingContent,
    ] = await Promise.all([
      // Articles statistics
      supabase
        .from('articles')
        .select('status, created_at, views, likes')
        .gte('created_at', startDate.toISOString()),

      // News statistics
      supabase
        .from('news')
        .select('processed, created_at, trending_score')
        .gte('created_at', startDate.toISOString()),

      // Categories with content count
      supabase.from('categories').select(`
          id,
          name,
          articles:articles(count),
          news:news(count)
        `),

      // Recent activity (last 10 items)
      supabase
        .from('article_history')
        .select(
          `
          id,
          change_type,
          created_at,
          article:articles(title),
          changed_by:profiles(full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(10),

      // Top performing content
      supabase
        .from('articles')
        .select('id, title, views, likes, created_at')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(5),
    ]);

    if (articlesStats.error || newsStats.error || categoriesStats.error) {
      throw new Error('Failed to fetch analytics data');
    }

    // Process articles statistics
    const articles = articlesStats.data || [];
    const articleMetrics = {
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      draft: articles.filter(a => a.status === 'draft').length,
      review: articles.filter(a => a.status === 'review').length,
      totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
      totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0),
      avgViewsPerArticle:
        articles.length > 0
          ? Math.round(
              articles.reduce((sum, a) => sum + (a.views || 0), 0) /
                articles.length
            )
          : 0,
    };

    // Process news statistics
    const news = newsStats.data || [];
    const newsMetrics = {
      total: news.length,
      processed: news.filter(n => n.processed).length,
      pending: news.filter(n => !n.processed).length,
      avgTrendingScore:
        news.length > 0
          ? Math.round(
              (news.reduce((sum, n) => sum + (n.trending_score || 0), 0) /
                news.length) *
                100
            ) / 100
          : 0,
    };

    // Process categories statistics
    const categories = categoriesStats.data || [];
    const categoryMetrics = {
      total: categories.length,
      withContent: categories.filter(
        c => (c.articles?.[0]?.count || 0) > 0 || (c.news?.[0]?.count || 0) > 0
      ).length,
      topCategories: categories
        .map(c => ({
          id: c.id,
          name: c.name,
          articleCount: c.articles?.[0]?.count || 0,
          newsCount: c.news?.[0]?.count || 0,
          totalContent:
            (c.articles?.[0]?.count || 0) + (c.news?.[0]?.count || 0),
        }))
        .sort((a, b) => b.totalContent - a.totalContent)
        .slice(0, 5),
    };

    // Calculate growth metrics (compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const [previousArticles, previousNews] = await Promise.all([
      supabase
        .from('articles')
        .select('id, created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString()),

      supabase
        .from('news')
        .select('id, created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString()),
    ]);

    const growthMetrics = {
      articlesGrowth: previousArticles.data
        ? Math.round(
            ((articles.length - previousArticles.data.length) /
              Math.max(previousArticles.data.length, 1)) *
              100
          )
        : 0,
      newsGrowth: previousNews.data
        ? Math.round(
            ((news.length - previousNews.data.length) /
              Math.max(previousNews.data.length, 1)) *
              100
          )
        : 0,
    };

    const dashboardData = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      articles: articleMetrics,
      news: newsMetrics,
      categories: categoryMetrics,
      growth: growthMetrics,
      recentActivity: recentActivity.data || [],
      topPerformingContent: topPerformingContent.data || [],
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}
