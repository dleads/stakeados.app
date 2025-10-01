import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

interface TrendingMetrics {
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  recencyScore: number;
  velocityScore: number;
}

// Calculate trending score based on multiple factors
function calculateTrendingScore(
  article: any,
  metrics: TrendingMetrics,
  timeWindow: number = 24 // hours
): number {
  const { viewCount, likeCount, shareCount, commentCount, velocityScore } =
    metrics;

  // Engagement score (40% weight)
  const engagementScore =
    (viewCount * 0.1 + likeCount * 2 + shareCount * 3 + commentCount * 1.5) /
    10;

  // Recency boost (30% weight) - newer articles get higher scores
  const publishedAt = new Date(article.published_at);
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  const recencyBoost = Math.max(0, (timeWindow - hoursAgo) / timeWindow) * 3;

  // Velocity score (20% weight) - how fast it's gaining engagement
  const velocityBoost = velocityScore * 2;

  // Quality score (10% weight) - base relevance (default to 5 if not available)
  const qualityScore = 5 * 0.1;

  const totalScore =
    engagementScore * 0.4 +
    recencyBoost * 0.3 +
    velocityBoost * 0.2 +
    qualityScore * 0.1;

  return Math.min(10, Math.max(0, totalScore));
}

// Get interaction metrics for articles
async function getInteractionMetrics(
  articleIds: string[],
  supabase: any,
  timeWindow: number = 24
): Promise<Map<string, TrendingMetrics>> {
  const metricsMap = new Map<string, TrendingMetrics>();

  if (articleIds.length === 0) return metricsMap;

  // Get recent interactions (within time window)
  const timeWindowStart = new Date();
  timeWindowStart.setHours(timeWindowStart.getHours() - timeWindow);

  const { data: interactions } = await supabase
    .from('content_interactions')
    .select('content_id, interaction_type, created_at')
    .in('content_id', articleIds)
    .eq('content_type', 'news')
    .gte('created_at', timeWindowStart.toISOString());

  // Initialize metrics for all articles
  articleIds.forEach(id => {
    metricsMap.set(id, {
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      commentCount: 0,
      recencyScore: 0,
      velocityScore: 0,
    });
  });

  if (!interactions) return metricsMap;

  // Count interactions by type
  interactions.forEach((interaction: any) => {
    const metrics = metricsMap.get(interaction.content_id);
    if (!metrics) return;

    switch (interaction.interaction_type) {
      case 'view':
        metrics.viewCount++;
        break;
      case 'like':
        metrics.likeCount++;
        break;
      case 'share':
        metrics.shareCount++;
        break;
      case 'comment':
        metrics.commentCount++;
        break;
    }
  });

  // Calculate velocity scores (interactions per hour)
  interactions.forEach((interaction: any) => {
    const metrics = metricsMap.get(interaction.content_id);
    if (!metrics) return;

    const interactionTime = new Date(interaction.created_at);
    const hoursAgo =
      (Date.now() - interactionTime.getTime()) / (1000 * 60 * 60);

    // More recent interactions contribute more to velocity
    const velocityContribution = Math.max(
      0,
      (timeWindow - hoursAgo) / timeWindow
    );
    metrics.velocityScore += velocityContribution;
  });

  return metricsMap;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '24'); // hours
    const category = searchParams.get('category');
    const minScore = parseFloat(searchParams.get('minScore') || '5.0');

    const supabase = await createClient();

    // Get recent articles (within extended time window for trending detection)
    const extendedTimeWindow = timeWindow * 2; // Look back further for trending detection
    const timeWindowStart = new Date();
    timeWindowStart.setHours(timeWindowStart.getHours() - extendedTimeWindow);

    const query = supabase
      .from('news')
      .select(
        `
        id,
        title,
        summary,
        content,
        source_url,
        source_name,
        published_at,
        created_at,
        updated_at
      `
      )
      .gte('published_at', timeWindowStart.toISOString())
      .order('published_at', { ascending: false })
      .limit(200); // Get larger pool for trending analysis

    // Filter by category if specified (skip for now due to schema issues)
    // if (category) {
    //   query = query.contains('categories', [category]);
    // }

    const { data: articles, error } = await query;

    if (error) {
      console.error('Error fetching articles for trending analysis:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending news' },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        articles: [],
        metadata: {
          timeWindow,
          category,
          minScore,
          articlesAnalyzed: 0,
          averageTrendingScore: 0,
        },
      });
    }

    // Get interaction metrics for all articles
    const articleIds = articles.map(a => a.id);
    const metricsMap = await getInteractionMetrics(
      articleIds,
      supabase,
      timeWindow
    );

    // Calculate trending scores
    const trendingArticles = articles
      .map(article => {
        const metrics = metricsMap.get(article.id) || {
          viewCount: 0,
          likeCount: 0,
          shareCount: 0,
          commentCount: 0,
          recencyScore: 0,
          velocityScore: 0,
        };

        const trendingScore = calculateTrendingScore(
          article,
          metrics,
          timeWindow
        );

        return {
          ...article,
          trending_score: trendingScore,
          trending_metrics: {
            views: metrics.viewCount,
            likes: metrics.likeCount,
            shares: metrics.shareCount,
            comments: metrics.commentCount,
            velocity: metrics.velocityScore,
          },
        };
      })
      .filter(article => article.trending_score >= minScore)
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

    // Update trending scores in database (async, don't wait)
    const updatePromises = trendingArticles.map(article =>
      supabase
        .from('news')
        .update({
          trending_score: article.trending_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)
    );

    // Don't await these updates to avoid slowing down the response
    Promise.all(updatePromises).catch(error =>
      console.error('Error updating trending scores:', error)
    );

    // Calculate metadata
    const averageTrendingScore =
      trendingArticles.length > 0
        ? trendingArticles.reduce((sum, a) => sum + a.trending_score, 0) /
          trendingArticles.length
        : 0;

    return NextResponse.json({
      articles: trendingArticles,
      metadata: {
        timeWindow,
        category,
        minScore,
        articlesAnalyzed: articles.length,
        trendingArticlesFound: trendingArticles.length,
        averageTrendingScore: Math.round(averageTrendingScore * 100) / 100,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Unexpected error in trending news API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger trending score recalculation
export async function POST(request: NextRequest) {
  try {
    const { articleIds, timeWindow = 24 } = await request.json();

    if (!articleIds || !Array.isArray(articleIds)) {
      return NextResponse.json(
        { error: 'articleIds array is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get articles
    const { data: articles, error } = await supabase
      .from('news')
      .select('*')
      .in('id', articleIds);

    if (error) {
      console.error('Error fetching articles for trending update:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        updated: 0,
        message: 'No articles found',
      });
    }

    // Get interaction metrics
    const metricsMap = await getInteractionMetrics(
      articleIds,
      supabase,
      timeWindow
    );

    // Calculate and update trending scores
    const updatePromises = articles.map(async article => {
      const metrics = metricsMap.get(article.id) || {
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        commentCount: 0,
        recencyScore: 0,
        velocityScore: 0,
      };

      const trendingScore = calculateTrendingScore(
        article,
        metrics,
        timeWindow
      );

      return supabase
        .from('news')
        .update({
          trending_score: trendingScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(result => !result.error).length;

    return NextResponse.json({
      updated: successCount,
      total: articles.length,
      message: `Updated trending scores for ${successCount} articles`,
    });
  } catch (error) {
    console.error('Unexpected error updating trending scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
