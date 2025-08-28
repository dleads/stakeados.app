// Content Management Service - Database operations for articles and news

import { createClient } from '@/lib/supabase/client';
import type {
  Article,
  ArticleWithMetrics,
  ArticleProposal,
  ArticleProposalWithProposer,
  NewsArticle,
  ContentCategory,
  ContentTag,
  ContentInteraction,
  UserSubscription,
  ArticleFilters,
  NewsFilters,
  SearchParams,
  PaginatedResponse,
  SearchResult,
  CreateArticleProposal,
  CreateArticle,
  UpdateArticle,
  ContentEngagement,
  PersonalizedFeedItem,
  SearchArticleResult,
  RelatedArticleResult,
  TrendingNewsResult,
} from '@/types/content';

export class ContentService {
  // Article Proposal Methods
  static async createArticleProposal(
    proposal: CreateArticleProposal
  ): Promise<ArticleProposal> {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('article_proposals')
      .insert({
        ...proposal,
        proposer_id: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getArticleProposals(
    filters: { status?: string; proposer_id?: string } = {},
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<ArticleProposalWithProposer>> {
    const supabase = createClient();
    let query = supabase
      .from('article_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.proposer_id) {
      query = query.eq('proposer_id', filters.proposer_id);
    }

    const { data, error, count } = await query.range(
      page * limit,
      (page + 1) * limit - 1
    );

    if (error) throw error;

    const proposals =
      data?.map(item => ({
        ...item,
        proposer_name: 'Unknown',
        proposer_avatar: null,
      })) || [];

    return {
      data: proposals,
      count: count || 0,
      page,
      limit,
      hasMore: (count || 0) > (page + 1) * limit,
    };
  }

  static async updateProposalStatus(
    proposalId: string,
    status: 'approved' | 'rejected' | 'changes_requested',
    feedback?: string
  ): Promise<void> {
    const response = await fetch(`/api/articles/proposals/${proposalId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, feedback }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update proposal status');
    }
  }

  // Article Methods
  static async createArticle(article: CreateArticle): Promise<Article> {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: JSON.stringify(article.title),
        content: JSON.stringify(article.content),
        meta_description: JSON.stringify(article.meta_description),
        category: article.category,
        tags: article.tags,
        difficulty_level: article.difficulty_level,
        featured_image_url: article.featured_image_url,
        related_courses: article.related_courses,
        status: article.status || 'draft',
        author_id: user.user.id,
        slug: article.title.en
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      })
      .select()
      .single();

    if (error) throw error;

    // Transform the database response to match Article type
    return {
      ...data,
      title: JSON.parse(data.title || '{}'),
      content: JSON.parse(data.content || '{}'),
      meta_description: JSON.parse(data.seo_description || '{}'),
      category: data.category_id || '',
      tags: [],
      view_count: data.views || 0,
      like_count: data.likes || 0,
      author_id: data.author_id || '',
      status: (data.status || 'draft') as 'published' | 'draft' | 'review',
      reading_time: data.reading_time || undefined,
      published_at: data.published_at || undefined,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    };
  }

  static async updateArticle(article: UpdateArticle): Promise<Article> {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('articles')
      .update({
        title: article.title ? JSON.stringify(article.title) : undefined,
        content: article.content ? JSON.stringify(article.content) : undefined,
        meta_description: article.meta_description
          ? JSON.stringify(article.meta_description)
          : undefined,
        category: article.category,
        tags: article.tags,
        difficulty_level: article.difficulty_level,
        featured_image_url: article.featured_image_url,
        related_courses: article.related_courses,
        status: article.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id)
      .eq('author_id', user.user.id) // Ensure user can only update their own articles
      .select()
      .single();

    if (error) throw error;

    // Transform the database response to match Article type
    return {
      ...data,
      title: JSON.parse(data.title || '{}'),
      content: JSON.parse(data.content || '{}'),
      meta_description: JSON.parse(data.seo_description || '{}'),
      category: data.category_id || '',
      tags: [],
      view_count: data.views || 0,
      like_count: data.likes || 0,
      author_id: data.author_id || '',
      status: (data.status || 'draft') as 'published' | 'draft' | 'review',
      reading_time: data.reading_time || undefined,
      published_at: data.published_at || undefined,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    };
  }

  static async getArticles(
    filters: ArticleFilters = {},
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<ArticleWithMetrics>> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    // Transform the database response to match ArticleWithMetrics type
    const transformedData = (data || []).map(article => ({
      ...article,
      title: JSON.parse(article.title || '{}'),
      content: JSON.parse(article.content || '{}'),
      meta_description: JSON.parse(article.seo_description || '{}'),
      category: article.category_id || '',
      tags: [],
      view_count: article.views || 0,
      like_count: article.likes || 0,
      author_id: article.author_id || '',
      status: (article.status || 'draft') as 'published' | 'draft' | 'review',
      reading_time: article.reading_time || undefined,
      published_at: article.published_at || undefined,
      created_at: article.created_at || new Date().toISOString(),
      updated_at: article.updated_at || new Date().toISOString(),
      difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
      // ArticleWithAuthor properties
      author_name: 'Unknown Author',
      author_avatar: undefined,
      // ArticleWithMetrics properties
      category_name: { en: 'General', es: 'General' },
      category_color: '#6B7280',
      category_icon: '📄',
      total_interactions_views: article.views || 0,
      total_interactions_likes: article.likes || 0,
      total_interactions_shares: 0,
      total_interactions_bookmarks: 0,
      engagement_rate: 0,
    }));

    // Apply client-side filtering (could be moved to database functions)
    let filteredData = transformedData;

    if (filters.category) {
      filteredData = filteredData.filter(
        article => article.category === filters.category
      );
    }

    if (filters.difficulty) {
      filteredData = filteredData.filter(
        article => article.difficulty_level === filters.difficulty
      );
    }

    if (filters.author) {
      filteredData = filteredData.filter(
        article => article.author_id === filters.author
      );
    }

    // TODO: Implement tags filtering when tags are properly stored in database
    // if (filters.tags && filters.tags.length > 0) {
    //   filteredData = filteredData.filter(article =>
    //     filters.tags!.some(tag => article.tags && article.tags.includes(tag))
    //   )
    // }

    return {
      data: filteredData,
      count: filteredData.length,
      page,
      limit,
      hasMore: filteredData.length === limit,
    };
  }

  static async getArticleById(id: string): Promise<ArticleWithMetrics | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Transform the database response to match ArticleWithMetrics type
    return {
      ...data,
      title: JSON.parse(data.title || '{}'),
      content: JSON.parse(data.content || '{}'),
      meta_description: JSON.parse(data.seo_description || '{}'),
      category: data.category_id || '',
      tags: [],
      view_count: data.views || 0,
      like_count: data.likes || 0,
      author_id: data.author_id || '',
      status: (data.status || 'draft') as 'published' | 'draft' | 'review',
      reading_time: data.reading_time || undefined,
      published_at: data.published_at || undefined,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
      // ArticleWithAuthor properties
      author_name: 'Unknown Author',
      author_avatar: undefined,
      // ArticleWithMetrics properties
      category_name: { en: 'General', es: 'General' },
      category_color: '#6B7280',
      category_icon: '📄',
      total_interactions_views: data.views || 0,
      total_interactions_likes: data.likes || 0,
      total_interactions_shares: 0,
      total_interactions_bookmarks: 0,
      engagement_rate: 0,
    };
  }

  static async searchArticles(
    params: SearchParams
  ): Promise<SearchResult<SearchArticleResult>> {
    // Simple search implementation since search_articles function doesn't exist
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .ilike('title', `%${params.query || ''}%`)
      .order('created_at', { ascending: false })
      .range(
        params.offset || 0,
        (params.offset || 0) + (params.limit || 20) - 1
      );

    if (error) throw error;

    // Transform the data to match SearchArticleResult type
    const transformedData = (data || []).map((article, index) => ({
      // Article properties
      id: article.id,
      title: JSON.parse(article.title || '{}'),
      content: JSON.parse(article.content || '{}'),
      author_id: article.author_id || '',
      status: (article.status || 'draft') as 'published' | 'draft' | 'review',
      category: article.category_id || '',
      tags: [], // Defaulted to empty array as tags are not directly stored
      difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
      featured_image_url: article.featured_image || undefined,
      meta_description: JSON.parse(article.seo_description || '{}'),
      related_courses: undefined,
      ai_summary: undefined,
      reading_time: article.reading_time || undefined,
      view_count: article.views || 0,
      like_count: article.likes || 0,
      published_at: article.published_at || undefined,
      created_at: article.created_at || new Date().toISOString(),
      updated_at: article.updated_at || new Date().toISOString(),
      // SearchArticleResult additional properties
      author_name: 'Unknown Author',
      rank: index + 1,
    }));

    return {
      data: transformedData,
      total: transformedData.length,
      query: params.query || '',
      filters: {
        locale: params.locale,
        category: params.category,
        difficulty: params.difficulty,
      },
    };
  }

  static async getRelatedArticles(
    articleId: string,
    limit = 5
  ): Promise<RelatedArticleResult[]> {
    // Get the current article to find related articles by category
    const supabase = createClient();
    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('category_id')
      .eq('id', articleId)
      .single();

    if (currentError || !currentArticle || !currentArticle.category_id) {
      console.error(
        'Error fetching current article or missing category_id:',
        currentError
      );
      return [];
    }

    // Get related articles from the same category
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category_id', currentArticle.category_id)
      .neq('id', articleId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related articles:', error);
      return [];
    }

    // Transform the data to match RelatedArticleResult type
    const transformedData = (data || []).map(article => ({
      id: article.id,
      title: JSON.parse(article.title || '{}'),
      author_id: article.author_id || '',
      author_name: 'Unknown Author',
      category: article.category_id || '',
      tags: [], // Defaulted to empty array as tags are not directly stored
      featured_image_url: article.featured_image || undefined,
      reading_time: article.reading_time || undefined,
      published_at:
        article.published_at || article.created_at || new Date().toISOString(),
      similarity_score: 1.0,
    }));

    return transformedData;
  }

  static async publishArticle(
    articleId: string,
    publishAt?: Date
  ): Promise<void> {
    const updateData: any = {
      status: 'published',
      updated_at: new Date().toISOString(),
    };

    if (publishAt) {
      updateData.published_at = publishAt.toISOString();
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', articleId);

    if (error) throw error;

    // Award points for article publication (handled by database trigger)
    // The trigger will automatically award points and check citizenship eligibility
  }

  // News Methods - Temporarily disabled due to database type issues
  static async getNews(
    _filters: NewsFilters = {},
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<NewsArticle>> {
    // TODO: Re-enable when database types are updated
    console.warn('getNews method temporarily disabled');
    return {
      data: [],
      count: 0,
      page,
      limit,
      hasMore: false,
    };
  }

  static async getTrendingNews(
    _hoursBack = 24,
    _limit = 10
  ): Promise<TrendingNewsResult[]> {
    // TODO: Re-enable when database types are updated
    console.warn('getTrendingNews method temporarily disabled');
    return [];
  }

  static async getNewsById(_id: string): Promise<NewsArticle | null> {
    // TODO: Re-enable when database types are updated
    console.warn('getNewsById method temporarily disabled');
    return null;
  }

  // Category and Tag Methods - Temporarily disabled due to database type issues
  static async getCategories(): Promise<ContentCategory[]> {
    // TODO: Re-enable when database types are updated
    console.warn('getCategories method temporarily disabled');
    return [];
  }

  static async getTags(_limit = 100): Promise<ContentTag[]> {
    // TODO: Re-enable when database types are updated
    console.warn('getTags method temporarily disabled');
    return [];
  }

  static async createTag(name: string): Promise<ContentTag> {
    // TODO: Re-enable when database types are updated
    console.warn('createTag method temporarily disabled');
    return {
      id: '',
      name: name,
      slug: name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
  }

  // Interaction Methods - Temporarily disabled due to database type issues
  static async recordInteraction(
    _contentId: string,
    _contentType: 'article' | 'news',
    _interactionType: 'view' | 'like' | 'share' | 'bookmark',
    _metadata: Record<string, any> = {}
  ): Promise<void> {
    // TODO: Re-enable when database types are updated
    console.warn('recordInteraction method temporarily disabled');
  }

  static async getUserInteractions(
    _userId: string,
    _contentType?: 'article' | 'news',
    _interactionType?: 'view' | 'like' | 'share' | 'bookmark'
  ): Promise<ContentInteraction[]> {
    // TODO: Re-enable when database types are updated
    console.warn('getUserInteractions method temporarily disabled');
    return [];
  }

  static async getContentEngagement(
    _contentId: string,
    _contentType: 'article' | 'news'
  ): Promise<ContentEngagement> {
    // TODO: Re-enable when database types are updated
    console.warn('getContentEngagement method temporarily disabled');
    return {
      total_views: 0,
      total_likes: 0,
      total_shares: 0,
      total_bookmarks: 0,
      engagement_rate: 0,
    };
  }

  // Subscription Methods - Temporarily disabled due to database type issues
  static async createSubscription(
    subscriptionType: 'category' | 'tag' | 'author',
    target: string
  ): Promise<UserSubscription> {
    // TODO: Re-enable when database types are updated
    console.warn('createSubscription method temporarily disabled');
    return {
      id: '',
      user_id: '',
      subscription_type: subscriptionType,
      subscription_target: target,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }

  static async removeSubscription(
    _subscriptionType: 'category' | 'tag' | 'author',
    _target: string
  ): Promise<void> {
    // TODO: Re-enable when database types are updated
    console.warn('removeSubscription method temporarily disabled');
  }

  static async getUserSubscriptions(
    _userId: string
  ): Promise<UserSubscription[]> {
    // TODO: Re-enable when database types are updated
    console.warn('getUserSubscriptions method temporarily disabled');
    return [];
  }

  // Personalized Feed - Temporarily disabled due to database type issues
  static async getPersonalizedFeed(
    _userId: string,
    _contentType: 'articles' | 'news' | 'both' = 'both',
    _limit = 20
  ): Promise<PersonalizedFeedItem[]> {
    // TODO: Re-enable when database types are updated
    console.warn('getPersonalizedFeed method temporarily disabled');
    return [];
  }

  // Utility Methods
  static async incrementViewCount(_articleId: string): Promise<void> {
    // TODO: Re-enable when database types are updated
    console.warn('incrementViewCount method temporarily disabled');
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  static estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}
