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
    const days = parseInt(url.searchParams.get('days') || '90');
    const contentType = url.searchParams.get('content_type') || 'all'; // 'articles', 'news', 'all'
    const granularity = url.searchParams.get('granularity') || 'daily'; // 'daily', 'weekly', 'monthly'

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch articles and news data
    const [articlesData, newsData, categoriesData] = (await Promise.all([
      // Articles data
      supabase
        .from('articles')
        .select(
          `
          id,
          title,
          status,
          views,
          likes,
          created_at,
          published_at,
          category_id,
          category:categories(name),
          content_metrics:content_metrics(
            metric_type,
            value,
            recorded_at
          )
        `
        )
        .gte('created_at', startDate.toISOString()),

      // News data
      supabase
        .from('news')
        .select(
          `
          id,
          title,
          trending_score,
          created_at,
          published_at,
          category_id,
          category:categories(name),
          ai_metadata,
          content_metrics:content_metrics(
            metric_type,
            value,
            recorded_at
          )
        `
        )
        .gte('created_at', startDate.toISOString()),

      // Categories data
      supabase.from('categories').select('id, name, parent_id'),
    ])) as any[];

    if (articlesData.error || newsData.error || categoriesData.error) {
      throw new Error('Failed to fetch trend data');
    }

    const articles = articlesData.data || [];
    const news = newsData.data || [];
    const categories = categoriesData.data || [];

    // Helper function to get date key based on granularity
    const getDateKey = (date: Date) => {
      switch (granularity) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().split('T')[0];
        case 'monthly':
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        default: // daily
          return date.toISOString().split('T')[0];
      }
    };

    // Generate time series data
    const timeSeriesData: Record<string, any> = {};
    const currentDate = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      const dateKey = getDateKey(date);

      if (!timeSeriesData[dateKey]) {
        timeSeriesData[dateKey] = {
          date: dateKey,
          articles: { created: 0, published: 0, views: 0, likes: 0 },
          news: { created: 0, processed: 0, trending: 0 },
          engagement: { totalViews: 0, totalLikes: 0, totalShares: 0 },
        };
      }
    }

    // Process articles data
    articles.forEach((article: any) => {
      const createdKey = getDateKey(new Date(article.created_at));
      const publishedKey = article.published_at
        ? getDateKey(new Date(article.published_at))
        : null;

      if (timeSeriesData[createdKey]) {
        timeSeriesData[createdKey].articles.created++;
        timeSeriesData[createdKey].articles.views += article.views || 0;
        timeSeriesData[createdKey].articles.likes += article.likes || 0;
      }

      if (
        publishedKey &&
        timeSeriesData[publishedKey] &&
        article.status === 'published'
      ) {
        timeSeriesData[publishedKey].articles.published++;
      }

      // Process metrics for engagement trends
      const metrics = article.content_metrics || [];
      metrics.forEach((metric: any) => {
        if (metric.recorded_at) {
          const metricKey = getDateKey(new Date(metric.recorded_at));
          if (timeSeriesData[metricKey]) {
            switch (metric.metric_type) {
              case 'view':
                timeSeriesData[metricKey].engagement.totalViews++;
                break;
              case 'like':
                timeSeriesData[metricKey].engagement.totalLikes++;
                break;
              case 'share':
                timeSeriesData[metricKey].engagement.totalShares++;
                break;
            }
          }
        }
      });
    });

    // Process news data
    news.forEach((newsItem: any) => {
      const createdKey = getDateKey(new Date(newsItem.created_at));

      if (timeSeriesData[createdKey]) {
        timeSeriesData[createdKey].news.created++;
        if (newsItem.processed) {
          timeSeriesData[createdKey].news.processed++;
        }
        timeSeriesData[createdKey].news.trending +=
          newsItem.trending_score || 0;
      }

      // Process news metrics
      const metrics = newsItem.content_metrics || [];
      metrics.forEach((metric: any) => {
        if (metric.recorded_at) {
          const metricKey = getDateKey(new Date(metric.recorded_at));
          if (timeSeriesData[metricKey]) {
            switch (metric.metric_type) {
              case 'view':
                timeSeriesData[metricKey].engagement.totalViews++;
                break;
              case 'like':
                timeSeriesData[metricKey].engagement.totalLikes++;
                break;
              case 'share':
                timeSeriesData[metricKey].engagement.totalShares++;
                break;
            }
          }
        }
      });
    });

    // Convert to array and sort by date
    const timeSeries = Object.values(timeSeriesData).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate category trends
    const categoryTrends: Record<string, any> = {};
    categories.forEach((category: any) => {
      categoryTrends[category.id] = {
        id: category.id,
        name: category.name,
        articles: articles.filter((a: any) => a.category_id === category.id)
          .length,
        news: news.filter((n: any) => n.category_id === category.id).length,
        totalViews: articles
          .filter((a: any) => a.category_id === category.id)
          .reduce((sum: number, a: any) => sum + (a.views || 0), 0),
        avgTrendingScore: 0,
      };

      const categoryNews = news.filter(n => n.category_id === category.id);
      if (categoryNews.length > 0) {
        categoryTrends[category.id].avgTrendingScore =
          categoryNews.reduce((sum, n) => sum + (n.trending_score || 0), 0) /
          categoryNews.length;
      }
    });

    // Calculate growth rates
    const midPoint = Math.floor(timeSeries.length / 2);
    const firstHalf = timeSeries.slice(0, midPoint);
    const secondHalf = timeSeries.slice(midPoint);

    const calculateGrowth = (first: any[], second: any[], field: string) => {
      const firstSum = first.reduce((sum, item) => sum + (item[field] || 0), 0);
      const secondSum = second.reduce(
        (sum, item) => sum + (item[field] || 0),
        0
      );
      return firstSum > 0
        ? Math.round(((secondSum - firstSum) / firstSum) * 100)
        : 0;
    };

    const growthRates = {
      articlesCreated: calculateGrowth(
        firstHalf,
        secondHalf,
        'articles.created'
      ),
      articlesPublished: calculateGrowth(
        firstHalf,
        secondHalf,
        'articles.published'
      ),
      newsCreated: calculateGrowth(firstHalf, secondHalf, 'news.created'),
      totalViews: calculateGrowth(
        firstHalf,
        secondHalf,
        'engagement.totalViews'
      ),
      totalLikes: calculateGrowth(
        firstHalf,
        secondHalf,
        'engagement.totalLikes'
      ),
    };

    // Identify trending topics from AI metadata
    const trendingTopics: Record<string, any> = {};
    news.forEach(newsItem => {
      const aiMetadata = newsItem.ai_metadata || {};
      const keywords = aiMetadata.keywords || [];

      keywords.forEach((keyword: any) => {
        if (!trendingTopics[keyword]) {
          trendingTopics[keyword] = {
            keyword,
            mentions: 0,
            avgRelevance: 0,
            relevanceScores: [],
          };
        }
        trendingTopics[keyword].mentions++;
        if (aiMetadata.relevance_score) {
          trendingTopics[keyword].relevanceScores.push(
            aiMetadata.relevance_score
          );
        }
      });
    });

    // Calculate average relevance for trending topics
    Object.values(trendingTopics).forEach((topic: any) => {
      if (topic.relevanceScores.length > 0) {
        topic.avgRelevance =
          topic.relevanceScores.reduce(
            (sum: number, score: any) => sum + score,
            0
          ) / topic.relevanceScores.length;
      }
    });

    // Sort trending topics by mentions and relevance
    const sortedTrendingTopics = Object.values(trendingTopics)
      .sort(
        (a: any, b: any) =>
          b.mentions * b.avgRelevance - a.mentions * a.avgRelevance
      )
      .slice(0, 20);

    // Calculate engagement patterns
    const engagementPatterns: Record<string, any> = {
      hourlyDistribution: Array(24).fill(0),
      weeklyDistribution: Array(7).fill(0),
      peakEngagementHours: [],
      engagementRate: 0,
    };

    // Process engagement metrics to find patterns
    const allMetrics = [...articles, ...news].flatMap(
      item => item.content_metrics || []
    );
    allMetrics.forEach(metric => {
      if (metric.recorded_at) {
        const date = new Date(metric.recorded_at);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();

        engagementPatterns.hourlyDistribution[hour]++;
        engagementPatterns.weeklyDistribution[dayOfWeek]++;
      }
    });

    // Find peak engagement hours
    const maxHourlyEngagement = Math.max(
      ...engagementPatterns.hourlyDistribution
    );
    engagementPatterns.peakEngagementHours =
      engagementPatterns.hourlyDistribution
        .map((count: any, hour: number) => ({ hour, count }))
        .filter((item: any) => item.count > maxHourlyEngagement * 0.8)
        .map((item: any) => item.hour);

    const response = {
      timeSeries,
      categoryTrends: Object.values(categoryTrends).sort(
        (a: any, b: any) => b.articles + b.news - (a.articles + a.news)
      ),
      growthRates,
      trendingTopics: sortedTrendingTopics,
      engagementPatterns,
      summary: {
        totalArticles: articles.length,
        totalNews: news.length,
        totalViews: articles.reduce(
          (sum: number, a: any) => sum + (a.views || 0),
          0
        ),
        totalEngagement: allMetrics.length,
        periodDays: days,
        granularity,
        contentType,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trends analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends analytics' },
      { status: 500 }
    );
  }
}
