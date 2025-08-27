import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getUser } from '../../../../lib/supabase/auth';

interface PersonalizationFactors {
  userInterests: string[];
  readingHistory: string[];
  preferredCategories: string[];
  excludeKeywords: string[];
  minRelevanceScore: number;
  preferredLanguage: 'en' | 'es';
}

// Calculate personalization score for an article
function calculatePersonalizationScore(
  article: any,
  factors: PersonalizationFactors
): number {
  let score = 0;

  // Base relevance score (40% weight)
  score += (article.relevance_score || 0) * 0.4;

  // Category match (25% weight)
  const categoryMatches =
    article.categories?.filter((cat: string) =>
      factors.preferredCategories.includes(cat)
    ).length || 0;
  score += Math.min(categoryMatches * 2.5, 2.5);

  // Keyword match (20% weight)
  const keywordMatches =
    article.keywords?.filter((keyword: string) =>
      factors.userInterests.includes(keyword.toLowerCase())
    ).length || 0;
  score += Math.min(keywordMatches * 2, 2);

  // Trending boost (10% weight)
  score += (article.trending_score || 0) * 0.1;

  // Engagement boost (5% weight)
  score += (article.engagement_score || 0) * 0.05;

  // Penalty for excluded keywords
  const excludeMatches =
    article.keywords?.filter((keyword: string) =>
      factors.excludeKeywords.includes(keyword.toLowerCase())
    ).length || 0;
  score -= excludeMatches * 1;

  // Recency boost (articles from last 24 hours get small boost)
  const publishedAt = new Date(article.published_at);
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) {
    score += 0.5;
  }

  return Math.max(0, Math.min(10, score));
}

// Get user interests from their activity
async function getUserInterests(
  userId: string,
  supabase: any
): Promise<string[]> {
  const interests: string[] = [];

  // Get interests from completed courses
  const { data: courseProgress } = await supabase
    .from('user_progress')
    .select(
      `
      courses (
        title,
        difficulty,
        category
      )
    `
    )
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  if (courseProgress) {
    courseProgress.forEach((progress: any) => {
      if (progress.courses) {
        const { difficulty, category } = progress.courses;

        // Add category-based interests
        if (category) interests.push(category.toLowerCase());

        // Add difficulty-based interests
        if (difficulty === 'basic') {
          interests.push('education', 'blockchain', 'basics');
        } else if (difficulty === 'intermediate') {
          interests.push('defi', 'web3', 'development', 'trading');
        } else if (difficulty === 'advanced') {
          interests.push(
            'technology',
            'infrastructure',
            'security',
            'protocols'
          );
        }
      }
    });
  }

  // Get interests from article interactions
  const { data: interactions } = await supabase
    .from('content_interactions')
    .select(
      `
      content_id,
      interaction_type
    `
    )
    .eq('user_id', userId)
    .eq('content_type', 'news')
    .in('interaction_type', ['view', 'like', 'share']);

  if (interactions && interactions.length > 0) {
    // Get articles that user interacted with
    const articleIds = interactions.map((i: any) => i.content_id);
    const { data: articles } = await supabase
      .from('news')
      .select('keywords, categories')
      .in('id', articleIds);

    if (articles) {
      articles.forEach((article: any) => {
        if (article.keywords) {
          interests.push(
            ...article.keywords.map((k: string) => k.toLowerCase())
          );
        }
        if (article.categories) {
          interests.push(
            ...article.categories.map((c: string) => c.toLowerCase())
          );
        }
      });
    }
  }

  // Remove duplicates and return top interests
  const uniqueInterests = [...new Set(interests)];
  return uniqueInterests.slice(0, 20); // Limit to top 20 interests
}

// Get user's reading history
async function getReadingHistory(
  userId: string,
  supabase: any
): Promise<string[]> {
  const { data: interactions } = await supabase
    .from('content_interactions')
    .select('content_id')
    .eq('user_id', userId)
    .eq('content_type', 'news')
    .eq('interaction_type', 'view')
    .order('created_at', { ascending: false })
    .limit(50);

  return interactions?.map((i: any) => i.content_id) || [];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const supabase = createClient();

    // Get user preferences
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('subscription_type, subscription_target')
      .eq('user_id', user.id);

    // Note: preferences column doesn't exist in profiles table
    // This query is commented out to fix build issues
    /*
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();
    */

    // Parse user preferences
    const preferredCategories =
      subscriptions
        ?.filter(sub => sub.subscription_type === 'category')
        .map(sub => sub.subscription_target) || [];

    const preferredKeywords =
      subscriptions
        ?.filter(sub => sub.subscription_type === 'tag')
        .map(sub => sub.subscription_target) || [];

    // Get user interests and reading history
    const userInterests = await getUserInterests(user.id, supabase);
    const readingHistory = await getReadingHistory(user.id, supabase);

    // Combine all interests
    const allInterests = [
      ...userInterests,
      ...preferredKeywords.map(k => k.toLowerCase()),
      ...preferredCategories.map(c => c.toLowerCase()),
    ];

    const personalizationFactors: PersonalizationFactors = {
      userInterests: [...new Set(allInterests)],
      readingHistory,
      preferredCategories,
      excludeKeywords: [],
      minRelevanceScore: 6,
      preferredLanguage: 'en',
    };

    // Get news articles (larger pool for better personalization)
    let query = supabase
      .from('news')
      .select(
        `
        id,
        title,
        summary,
        content,
        source_url,
        source_name,
        author_name,
        image_url,
        categories,
        keywords,
        relevance_score,
        trending_score,
        engagement_score,
        read_time,
        related_articles,
        user_interactions,
        ai_processed_at,
        published_at,
        created_at,
        updated_at
      `
      )
      .gte('relevance_score', personalizationFactors.minRelevanceScore)
      .order('published_at', { ascending: false })
      .limit(200); // Get larger pool for personalization

    // Exclude articles user has already read
    if (readingHistory.length > 0) {
      query = query.not('id', 'in', `(${readingHistory.join(',')})`);
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error('Error fetching articles for personalization:', error);
      return NextResponse.json(
        { error: 'Failed to fetch personalized news' },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        articles: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        },
        personalization: {
          userInterests: personalizationFactors.userInterests.slice(0, 10),
          preferredCategories: personalizationFactors.preferredCategories,
          articlesPersonalized: 0,
        },
      });
    }

    // Calculate personalization scores and sort
    const personalizedArticles = articles
      .map(article => ({
        ...(article && typeof article === 'object' ? article : {}),
        personalization_score: calculatePersonalizationScore(
          article,
          personalizationFactors
        ),
      }))
      .sort((a, b) => b.personalization_score - a.personalization_score);

    // Apply pagination to personalized results
    const from = page * limit;
    const to = from + limit;
    const paginatedArticles = personalizedArticles.slice(from, to);

    // Calculate pagination info
    const total = personalizedArticles.length;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPrevPage = page > 0;

    return NextResponse.json({
      articles: paginatedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      personalization: {
        userInterests: personalizationFactors.userInterests.slice(0, 10),
        preferredCategories: personalizationFactors.preferredCategories,
        articlesPersonalized: personalizedArticles.length,
        averagePersonalizationScore:
          personalizedArticles.length > 0
            ? personalizedArticles.reduce(
                (sum, a) => sum + a.personalization_score,
                0
              ) / personalizedArticles.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Unexpected error in personalized news API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
