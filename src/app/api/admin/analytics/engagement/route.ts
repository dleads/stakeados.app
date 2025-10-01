/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

type ArticleRow = {
  id: string;
  title: string;
  views?: number | null;
  likes?: number | null;
  reading_time?: number | null;
  published_at?: string | null;
  created_at?: string | null;
};

type NewsRow = {
  id: string;
  title: string;
  trending_score?: number | null;
  published_at?: string | null;
  created_at?: string | null;
};

type MetricRecord = {
  recorded_at: string;
  metric_type: 'view' | 'like' | 'share' | 'read_time';
  value: number;
};

type DailyMetric = {
  date: string;
  views: number;
  likes: number;
  shares: number;
  readTime: number;
  readTimeCount: number;
  sessions: number;
};

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: admin.error || 'Forbidden' },
        { status: admin.status || 403 }
      );
    }
    const supabase = (admin as any).supabase as any;

    // Verify admin authentication
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Check admin role
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();

    // if (!profile || profile.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const includeCohorts = searchParams.get('include_cohorts') === 'true';

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get content metrics for the period - TODO: Implement when content_metrics table is available
    // let metricsQuery = supabase
    //   .from('content_metrics')
    //   .select('*')
    //   .gte('recorded_at', startDate.toISOString())
    //   .lte('recorded_at', endDate.toISOString());

    // TODO: Implement when content_metrics table is available
    // if (contentType !== 'all') {
    //   metricsQuery = metricsQuery.eq('content_type', contentType);
    // }

    // const { data: metricsData } = await metricsQuery;

    // Get articles and news for content performance analysis
    const { data: articles } = await supabase
      .from('articles')
      .select(
        `
        id,
        title,
        views,
        likes,
        published_at,
        created_at,
        reading_time
      `
      )
      .eq('status', 'published')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('views', { ascending: false });

    const { data: news } = await supabase
      .from('news')
      .select(
        `
        id,
        title,
        published_at,
        created_at,
        trending_score
      `
      )
      .eq('processed', true)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('trending_score', { ascending: false });

    // Process metrics data
    const processMetrics = (metrics: MetricRecord[]) => {
      const dailyMetrics = new Map<string, DailyMetric>();

      metrics.forEach(metric => {
        const date = new Date(metric.recorded_at).toISOString().split('T')[0];
        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, {
            date,
            views: 0,
            likes: 0,
            shares: 0,
            readTime: 0,
            readTimeCount: 0,
            sessions: 0,
          });
        }

        const dayData = dailyMetrics.get(date)!;

        switch (metric.metric_type) {
          case 'view':
            dayData.views += metric.value;
            dayData.sessions++;
            break;
          case 'like':
            dayData.likes += metric.value;
            break;
          case 'share':
            dayData.shares += metric.value;
            break;
          case 'read_time':
            dayData.readTime += metric.value;
            dayData.readTimeCount++;
            break;
        }
      });

      return Array.from(dailyMetrics.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    };

    const dailyMetrics = processMetrics([]);

    // Calculate overview metrics
    const totalViews = dailyMetrics.reduce((sum, day) => sum + day.views, 0);
    const totalLikes = dailyMetrics.reduce((sum, day) => sum + day.likes, 0);
    const totalShares = dailyMetrics.reduce((sum, day) => sum + day.shares, 0);
    const totalSessions = dailyMetrics.reduce(
      (sum, day) => sum + day.sessions,
      0
    );

    const avgEngagementRate =
      totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0;
    const avgSessionDuration =
      dailyMetrics.length > 0
        ? dailyMetrics.reduce(
            (sum, day) =>
              sum +
              (day.readTimeCount > 0 ? day.readTime / day.readTimeCount : 0),
            0
          ) / dailyMetrics.length
        : 0;

    // Mock additional metrics (would come from real analytics)
    const bounceRate = Math.random() * 30 + 40; // 40-70%
    const returnVisitorRate = Math.random() * 20 + 25; // 25-45%

    // Generate trends with change calculations
    const generateTrends = (data: any[], field: string) => {
      return data.map((item, index) => {
        const prevItem = index > 0 ? data[index - 1] : null;
        const change = prevItem
          ? ((item[field] - prevItem[field]) / (prevItem[field] || 1)) * 100
          : 0;

        return {
          date: item.date,
          count: item[field],
          change,
        };
      });
    };

    const trends = {
      views: generateTrends(dailyMetrics, 'views'),
      likes: generateTrends(dailyMetrics, 'likes'),
      shares: generateTrends(dailyMetrics, 'shares'),
      engagementRate: dailyMetrics.map((item, index) => {
        const rate =
          item.views > 0 ? ((item.likes + item.shares) / item.views) * 100 : 0;
        const prevItem = index > 0 ? dailyMetrics[index - 1] : null;
        const prevRate =
          prevItem && prevItem.views > 0
            ? ((prevItem.likes + prevItem.shares) / prevItem.views) * 100
            : 0;
        const change = prevRate > 0 ? ((rate - prevRate) / prevRate) * 100 : 0;

        return {
          date: item.date,
          rate,
          change,
        };
      }),
      sessionDuration: dailyMetrics.map((item, index) => {
        const duration =
          item.readTimeCount > 0 ? item.readTime / item.readTimeCount : 0;
        const prevItem = index > 0 ? dailyMetrics[index - 1] : null;
        const prevDuration =
          prevItem && prevItem.readTimeCount > 0
            ? prevItem.readTime / prevItem.readTimeCount
            : 0;
        const change =
          prevDuration > 0
            ? ((duration - prevDuration) / prevDuration) * 100
            : 0;

        return {
          date: item.date,
          duration,
          change,
        };
      }),
    };

    // Content performance analysis
    const contentPerformance = [
      ...((articles || []) as ArticleRow[]).map((article: ArticleRow) => ({
        id: article.id,
        title: article.title,
        type: 'article' as const,
        views: article.views || 0,
        likes: article.likes || 0,
        shares: Math.floor(Math.random() * 50), // Mock data
        comments: Math.floor(Math.random() * 20), // Mock data
        engagementRate:
          (article.views || 0) > 0
            ? ((article.likes || 0) / (article.views || 1)) * 100
            : 0,
        avgReadingTime: article.reading_time || 0,
        bounceRate: Math.random() * 40 + 20,
        published_at: article.published_at || article.created_at,
      })),
      ...((news || []) as NewsRow[]).slice(0, 10).map((newsItem: NewsRow) => ({
        id: newsItem.id,
        title: newsItem.title,
        type: 'news' as const,
        views: Math.floor((newsItem.trending_score || 0) * 100), // Mock conversion
        likes: Math.floor((newsItem.trending_score || 0) * 10),
        shares: Math.floor((newsItem.trending_score || 0) * 5),
        comments: Math.floor((newsItem.trending_score || 0) * 2),
        engagementRate: (newsItem.trending_score || 0) * 10,
        avgReadingTime: Math.random() * 3 + 1,
        bounceRate: Math.random() * 40 + 20,
        published_at: newsItem.published_at || newsItem.created_at,
      })),
    ].sort((a, b) => b.engagementRate - a.engagementRate);

    // Mock user behavior data (would come from real analytics service)
    const userBehavior = {
      deviceBreakdown: [
        {
          device: 'Mobile',
          sessions: Math.floor(totalSessions * 0.65),
          avgDuration: avgSessionDuration * 0.8,
          bounceRate: bounceRate * 1.2,
        },
        {
          device: 'Desktop',
          sessions: Math.floor(totalSessions * 0.25),
          avgDuration: avgSessionDuration * 1.3,
          bounceRate: bounceRate * 0.7,
        },
        {
          device: 'Tablet',
          sessions: Math.floor(totalSessions * 0.1),
          avgDuration: avgSessionDuration * 1.1,
          bounceRate: bounceRate * 0.9,
        },
      ],
      timeOfDayPatterns: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        sessions: Math.floor(Math.random() * 100 + 20),
        engagement: Math.random() * 30 + 40,
      })),
      dayOfWeekPatterns: Array.from({ length: 7 }, (_, day) => ({
        day,
        sessions: Math.floor(Math.random() * 200 + 100),
        engagement: Math.random() * 20 + 50,
      })),
      geographicDistribution: [
        {
          country: 'United States',
          sessions: Math.floor(totalSessions * 0.35),
          avgEngagement: avgEngagementRate * 1.1,
        },
        {
          country: 'Spain',
          sessions: Math.floor(totalSessions * 0.25),
          avgEngagement: avgEngagementRate * 1.2,
        },
        {
          country: 'Mexico',
          sessions: Math.floor(totalSessions * 0.15),
          avgEngagement: avgEngagementRate * 0.9,
        },
        {
          country: 'Argentina',
          sessions: Math.floor(totalSessions * 0.12),
          avgEngagement: avgEngagementRate * 0.8,
        },
        {
          country: 'Colombia',
          sessions: Math.floor(totalSessions * 0.08),
          avgEngagement: avgEngagementRate * 0.7,
        },
        {
          country: 'Other',
          sessions: Math.floor(totalSessions * 0.05),
          avgEngagement: avgEngagementRate * 0.6,
        },
      ],
    };

    // Mock engagement funnel
    const engagementFunnel = {
      steps: [
        {
          name: 'Page View',
          users: totalSessions,
          conversionRate: 100,
          dropoffRate: 0,
        },
        {
          name: 'Content Engagement',
          users: Math.floor(totalSessions * 0.7),
          conversionRate: 70,
          dropoffRate: 30,
        },
        {
          name: 'Social Interaction',
          users: Math.floor(totalSessions * 0.3),
          conversionRate: 30,
          dropoffRate: 40,
        },
        {
          name: 'Content Sharing',
          users: Math.floor(totalSessions * 0.1),
          conversionRate: 10,
          dropoffRate: 20,
        },
        {
          name: 'Return Visit',
          users: Math.floor(totalSessions * 0.05),
          conversionRate: 5,
          dropoffRate: 5,
        },
      ],
      conversionPaths: [
        {
          path: ['View', 'Like', 'Share'],
          users: Math.floor(totalSessions * 0.08),
          conversionRate: 8,
        },
        {
          path: ['View', 'Read', 'Like'],
          users: Math.floor(totalSessions * 0.15),
          conversionRate: 15,
        },
        {
          path: ['View', 'Read'],
          users: Math.floor(totalSessions * 0.45),
          conversionRate: 45,
        },
        {
          path: ['View', 'Bounce'],
          users: Math.floor(totalSessions * 0.32),
          conversionRate: 0,
        },
      ],
    };

    // Mock cohort analysis (if requested)
    let cohortAnalysis: any[] = [];
    if (includeCohorts) {
      const weeks = Math.min(8, Math.floor(days / 7));
      cohortAnalysis = Array.from({ length: weeks }, (_, i) => {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + i * 7);

        return {
          cohort: `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          week0: 100,
          week1: Math.floor(Math.random() * 30 + 40),
          week2: Math.floor(Math.random() * 20 + 25),
          week3: Math.floor(Math.random() * 15 + 15),
          week4: Math.floor(Math.random() * 10 + 10),
        };
      });
    }

    const response = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      overview: {
        totalViews,
        totalLikes,
        totalShares,
        totalComments: Math.floor(totalLikes * 0.3), // Mock
        avgEngagementRate,
        avgSessionDuration,
        bounceRate,
        returnVisitorRate,
      },
      trends,
      contentPerformance,
      userBehavior,
      engagementFunnel,
      cohortAnalysis,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Engagement analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
