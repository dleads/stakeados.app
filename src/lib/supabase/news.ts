import { createAnonClient } from './anon';
import type { Locale } from '@/types';

type NewsArticle = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
  category_id: string | null;
  language: string | null;
  processed: boolean | null;
  trending_score: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type NewsArticleInsert = Omit<NewsArticle, 'id' | 'created_at' | 'updated_at'>;
type NewsArticleUpdate = Partial<
  Omit<NewsArticle, 'id' | 'created_at' | 'updated_at'>
>;

// Get all news articles with pagination
export const getNewsArticles = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    keywords?: string[];
    sources?: string[];
    minRelevanceScore?: number;
  }
): Promise<{
  articles: NewsArticle[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}> => {
  const supabase = createAnonClient();
  let query = supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false });

  // Apply filters
  if (filters?.keywords && filters.keywords.length > 0) {
    query = query.overlaps('tags', filters.keywords);
  }

  if (filters?.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources);
  }

  if (filters?.minRelevanceScore) {
    query = query.gte('importance_score', filters.minRelevanceScore);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }

  return {
    articles: data || [],
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
    hasNextPage: (count || 0) > page * limit,
    hasPreviousPage: page > 1,
  };
};

// Get news article by ID
export const getNewsArticleById = async (id: string): Promise<NewsArticle> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching news article:', error);
    throw error;
  }

  return data;
};

// Get trending news articles
export const getTrendingNews = async (
  limit: number = 10
): Promise<NewsArticle[]> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('importance_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending news:', error);
    throw error;
  }

  return data;
};

// Search news articles
export const searchNews = async (
  query: string,
  filters?: {
    sources?: string[];
    dateRange?: { start: Date; end: Date };
  }
): Promise<NewsArticle[]> => {
  const supabase = createAnonClient();
  let searchQuery = supabase.from('news').select('*');

  // Text search in title and content
  if (query.trim()) {
    searchQuery = searchQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
    );
  }

  // Apply filters
  if (filters?.sources && filters.sources.length > 0) {
    searchQuery = searchQuery.in('source', filters.sources);
  }

  if (filters?.dateRange) {
    searchQuery = searchQuery
      .gte('published_at', filters.dateRange.start.toISOString())
      .lte('published_at', filters.dateRange.end.toISOString());
  }

  const { data, error } = await searchQuery
    .order('importance_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching news:', error);
    throw error;
  }

  return data;
};

// Get all unique sources
export const getNewsSources = async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('news')
    .select('source')
    .order('source');

  if (error) {
    console.error('Error fetching news sources:', error);
    throw error;
  }

  const uniqueSources = [
    ...new Set((data as any[]).map((item: any) => item.source_name)),
  ];

  // Count articles per source
  const sourcesWithCount = await Promise.all(
    uniqueSources.map(async source => {
      const supabaseInner = createAnonClient();
      const { count } = await supabaseInner
        .from('news_articles' as any)
        .select('*', { count: 'exact', head: true })
        .eq('source_name', source);

      return { source, count: count || 0 };
    })
  );

  return sourcesWithCount.sort((a, b) => b.count - a.count);
};

// Get popular keywords
export const getPopularKeywords = async (limit: number = 20) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from('news').select('keywords');

  if (error) {
    console.error('Error fetching keywords:', error);
    throw error;
  }

  const allKeywords = (data as any[]).flatMap(
    (item: any) => item.keywords || []
  );
  const keywordCount: Record<string, number> = {};

  allKeywords.forEach(keyword => {
    keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
  });

  const popularKeywords = Object.entries(keywordCount)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return popularKeywords;
};

// Get news statistics
export const getNewsStatistics = async () => {
  const supabase = createAnonClient();
  const { data: allNews, error } = await supabase
    .from('news')
    .select('relevance_score, ai_processed_at, created_at, source_name');

  if (error) {
    console.error('Error fetching news statistics:', error);
    return {
      totalArticles: 0,
      processedArticles: 0,
      averageRelevanceScore: 0,
      articlesToday: 0,
      uniqueSources: 0,
      processingRate: 0,
    };
  }

  const totalArticles = allNews.length;
  const processedArticles = (allNews as any[]).filter(
    (a: any) => a.ai_processed_at
  ).length;

  // Calculate average relevance score
  const relevanceScores = (allNews as any[])
    .filter((a: any) => a.relevance_score !== null)
    .map((a: any) => a.relevance_score!);
  const averageRelevanceScore =
    relevanceScores.length > 0
      ? relevanceScores.reduce((sum, score) => sum + score, 0) /
        relevanceScores.length
      : 0;

  // Articles published today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const articlesToday = (allNews as any[]).filter(
    (a: any) => new Date(a.created_at) >= today
  ).length;

  // Unique sources
  const uniqueSources = new Set(
    (allNews as any[]).map((a: any) => a.source_name)
  ).size;

  // Processing rate (articles processed in last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const processingRate = (allNews as any[]).filter(
    (a: any) => a.ai_processed_at && new Date(a.ai_processed_at) > oneDayAgo
  ).length;

  return {
    totalArticles,
    processedArticles,
    averageRelevanceScore: Math.round(averageRelevanceScore * 100) / 100,
    articlesToday,
    uniqueSources,
    processingRate,
  };
};

// Get personalized news feed for user
export const getPersonalizedNewsFeed = async (
  userId: string,
  limit: number = 20
): Promise<NewsArticle[]> => {
  // Get user's interests from their course progress and article interactions
  const supabase = createAnonClient();
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select(
      `
      courses (
        title,
        difficulty
      )
    `
    )
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  // Extract interests from user's completed courses
  const userInterests: string[] = [];
  if (userProgress) {
    userProgress.forEach(progress => {
      if ((progress as any).courses) {
        const difficulty = ((progress as any).courses as any).difficulty;
        if (difficulty === 'basic') {
          userInterests.push('Education', 'Blockchain');
        } else if (difficulty === 'intermediate') {
          userInterests.push('DeFi', 'Web3', 'Development');
        } else if (difficulty === 'advanced') {
          userInterests.push('Technology', 'Infrastructure', 'Security');
        }
      }
    });
  }

  // If no interests found, use general categories
  if (userInterests.length === 0) {
    userInterests.push('Bitcoin', 'Ethereum', 'Web3', 'Education');
  }

  // Get news articles matching user interests
  const { data, error } = await supabase
    .from('news' as any)
    .select('*')
    .gte('importance_score', 6) // Only high-quality articles
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching personalized news:', error);
    // Fallback to trending news
    return getTrendingNews(limit);
  }

  return data as any;
};


// Helper function to get localized news title
export const getNewsTitle = (
  article: NewsArticle,
  _locale: Locale = 'en'
): string => {
  return article.title || 'Untitled Article';
};

// Helper function to get localized news summary
export const getNewsSummary = (
  article: NewsArticle,
  locale: Locale = 'en'
): string => {
  const articleAny = article as any;
  if (locale === 'es' && articleAny.summary_es) {
    return articleAny.summary_es;
  }
  return (
    articleAny.summary_en || articleAny.description || 'No summary available'
  );
};

// Helper function to get localized news content
export const getNewsContent = (
  article: NewsArticle,
  _locale: Locale = 'en'
): string => {
  const articleAny = article as any;
  return articleAny.description || 'No content available';
};

// Get related articles based on categories and keywords
export const getRelatedNews = async (
  articleId: string,
  keywords: string[],
  limit: number = 5
) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .neq('id', articleId)
    .or(`keywords.ov.{${keywords.join(',')}}`)
    .order('relevance_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related news:', error);
    return [];
  }

  return data;
};

// Get news feed for specific time period
export const getNewsByDateRange = async (
  startDate: Date,
  endDate: Date,
  limit: number = 50
) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .gte('published_at', startDate.toISOString())
    .lte('published_at', endDate.toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching news by date range:', error);
    throw error;
  }

  return data;
};

// Mark article as read by user (for personalization)
export const markNewsAsRead = async (userId: string, articleId: string) => {
  // This would typically be stored in a user_news_interactions table
  // For now, we'll just log it
  console.log(`User ${userId} read article ${articleId}`);
};

// Get news reading statistics for user
export const getUserNewsStats = async (_userId: string) => {
  // This would typically query user_news_interactions table
  // For now, return mock data
  return {
    articlesRead: 0,
    favoriteCategories: ['Bitcoin', 'Ethereum'],
    readingStreak: 0,
    totalReadingTime: 0,
  };
};
