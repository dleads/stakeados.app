import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

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

    // Check if user has editor or admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.role ||
      !['admin', 'editor'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get('editorId') || user.id;
    const timeRange = searchParams.get('timeRange') || 'month';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Get editorial analytics data
    // TODO: Create editorial_analytics table in database
    // const { error: analyticsError } = await supabase
    //   .from('editorial_analytics')
    //   .select('*')
    //   .eq('editor_id', editorId)
    //   .gte('period_start', startDate.toISOString().split('T')[0])
    //   .lte('period_end', endDate.toISOString().split('T')[0])
    //   .order('period_start', { ascending: false })

    // if (analyticsError) {
    //   throw analyticsError
    // }

    // Get article proposals and reviews for detailed analysis
    const { data: proposals, error: proposalsError } = await supabase
      .from('article_proposals')
      .select(
        `
        *,
        profiles(name)
      `
      )
      .eq('reviewer_id', editorId)
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (proposalsError) {
      throw proposalsError;
    }

    // Get articles for review analysis
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select(
        `
        *,
        profiles(name),
        article_categories(
          content_categories(name, slug)
        )
      `
      )
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (articlesError) {
      throw articlesError;
    }

    // Calculate editorial metrics
    const totalProposals = proposals?.length || 0;

    const totalArticles = articles?.length || 0;
    const publishedArticles =
      articles?.filter(a => a.status === 'published').length || 0;

    // Calculate average review time (mock calculation)
    const averageReviewTime = 2.4; // hours - would be calculated from actual review timestamps

    // Calculate quality score based on article metrics
    const qualityScore =
      articles?.length > 0
        ? articles.reduce((sum, article) => {
            // Mock quality calculation based on various factors
            let score = 8.0;
            if (article.seo_description) score += 0.5;
            if (article.featured_image) score += 0.3;
            if (article.reading_time && article.reading_time > 300)
              score += 0.2;
            return sum + Math.min(score, 10);
          }, 0) / articles.length
        : 0;

    // Generate category breakdown
    const categoryBreakdown =
      articles?.reduce(
        (acc, article) => {
          // Mock category data since the relation might not be properly loaded
          const categoryName = 'General'; // Default category
          if (!acc[categoryName]) {
            acc[categoryName] = { total: 0, published: 0 };
          }
          acc[categoryName].total += 1;
          if (article.status === 'published') {
            acc[categoryName].published += 1;
          }
          return acc;
        },
        {} as Record<string, { total: number; published: number }>
      ) || {};

    const categoryBreakdownArray = Object.entries(categoryBreakdown).map(
      ([category, data]) => ({
        category,
        count: data.total,
        approvalRate: data.total > 0 ? (data.published / data.total) * 100 : 0,
      })
    );

    // Generate author performance data
    const authorPerformance =
      articles?.reduce(
        (acc, article) => {
          const authorId = article.author_id;
          if (!authorId) return acc; // Skip if no author_id

          const authorName = 'Author ' + authorId.slice(0, 8); // Mock author name

          if (!acc[authorId]) {
            acc[authorId] = {
              authorId,
              authorName,
              articlesSubmitted: 0,
              articlesPublished: 0,
              totalQuality: 0,
            };
          }

          acc[authorId].articlesSubmitted += 1;
          if (article.status === 'published') {
            acc[authorId].articlesPublished += 1;
          }
          acc[authorId].totalQuality += qualityScore; // Mock quality per article

          return acc;
        },
        {} as Record<string, any>
      ) || {};

    const authorPerformanceArray = Object.values(authorPerformance).map(
      (author: any) => ({
        authorId: author.authorId,
        authorName: author.authorName,
        articlesSubmitted: author.articlesSubmitted,
        approvalRate:
          author.articlesSubmitted > 0
            ? (author.articlesPublished / author.articlesSubmitted) * 100
            : 0,
        averageQuality:
          author.articlesSubmitted > 0
            ? author.totalQuality / author.articlesSubmitted
            : 0,
      })
    );

    // Generate productivity trend (mock data for time series)
    const productivityTrend = [];
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Mock daily productivity data
      productivityTrend.push({
        date: date.toLocaleDateString(),
        reviewed: Math.floor(Math.random() * 8) + 1,
        approved: Math.floor(Math.random() * 6) + 1,
        rejected: Math.floor(Math.random() * 2),
      });
    }

    // Content gap analysis (mock AI-generated suggestions)
    const contentGapAnalysis = {
      suggestedTopics: [
        {
          topic: 'Base Layer 2 Scaling Solutions',
          demand: 85,
          competition: 32,
          opportunity: 78,
          keywords: ['base network', 'layer 2', 'scaling', 'ethereum'],
        },
        {
          topic: 'DeFi Yield Farming Strategies',
          demand: 92,
          competition: 67,
          opportunity: 65,
          keywords: ['yield farming', 'defi', 'liquidity', 'rewards'],
        },
      ],
      trendingTopics: [
        { topic: 'AI in Crypto', growth: 156.7, articles: 8, engagement: 4.2 },
        {
          topic: 'Base Ecosystem',
          growth: 234.5,
          articles: 15,
          engagement: 5.1,
        },
      ],
    };

    // Author insights (mock AI-generated insights)
    const authorInsights = {
      topAuthors: authorPerformanceArray
        .sort((a, b) => b.averageQuality - a.averageQuality)
        .slice(0, 5)
        .map(author => ({
          ...author,
          articlesPublished: Math.floor(Math.random() * 20) + 5,
          totalViews: Math.floor(Math.random() * 50000) + 10000,
          averageEngagement: Math.random() * 5 + 5,
          qualityScore: author.averageQuality,
          specialties: ['DeFi', 'NFTs', 'Base Network'].slice(
            0,
            Math.floor(Math.random() * 3) + 1
          ),
        })),
      recognitionSuggestions: [
        {
          authorId: authorPerformanceArray[0]?.authorId || '1',
          authorName: authorPerformanceArray[0]?.authorName || 'Top Author',
          achievement: 'Top Contributor Badge',
          reason: 'Consistently high-quality content with excellent engagement',
          impact: 9.2,
        },
      ],
    };

    return NextResponse.json({
      editorialMetrics: {
        articlesReviewed: totalArticles,
        articlesApproved: publishedArticles,
        articlesRejected: totalArticles - publishedArticles,
        averageReviewTime,
        qualityScore,
        feedbackQualityRating: 4.3, // Mock rating
        proposalsProcessed: totalProposals,
        contentModerated: Math.floor(totalArticles * 0.3), // Mock moderation count
        productivityTrend,
        categoryBreakdown: categoryBreakdownArray,
        authorPerformance: authorPerformanceArray,
        reviewTimeDistribution: [
          { timeRange: '< 1 hour', count: Math.floor(totalArticles * 0.15) },
          { timeRange: '1-2 hours', count: Math.floor(totalArticles * 0.25) },
          { timeRange: '2-4 hours', count: Math.floor(totalArticles * 0.35) },
          { timeRange: '4-8 hours', count: Math.floor(totalArticles * 0.2) },
          { timeRange: '> 8 hours', count: Math.floor(totalArticles * 0.05) },
        ],
        qualityMetrics: {
          grammar: 8.9,
          structure: 8.4,
          accuracy: 9.1,
          guidelines: 8.7,
          seo: 7.8,
          readability: 8.2,
        },
      },
      contentGapAnalysis,
      authorInsights,
      timeRange,
      editorId,
    });
  } catch (error) {
    console.error('Editorial analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editorial analytics' },
      { status: 500 }
    );
  }
}
