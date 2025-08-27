// Content Management System Types

export type Locale = 'en' | 'es';

export interface LocalizedContent {
  en: string;
  es: string;
}

// Article Types
export interface Article {
  id: string;
  title: LocalizedContent;
  content: LocalizedContent;
  author_id: string;
  status: 'draft' | 'review' | 'published';
  category: string;
  tags: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  featured_image_url?: string;
  meta_description: LocalizedContent;
  related_courses?: string[];
  ai_summary?: LocalizedContent;
  reading_time?: number;
  view_count: number;
  like_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleWithAuthor extends Article {
  author_name: string;
  author_avatar?: string;
}

export interface ArticleWithMetrics extends ArticleWithAuthor {
  category_name: LocalizedContent;
  category_color: string;
  category_icon: string;
  total_interactions_views: number;
  total_interactions_likes: number;
  total_interactions_shares: number;
  total_interactions_bookmarks: number;
  engagement_rate: number;
}

// Article Proposal Types
export interface ArticleProposal {
  id: string;
  title: string;
  summary: string;
  outline: string;
  author_experience: string;
  previous_work: string[] | null;
  suggested_level: string | null;
  suggested_category: string | null;
  estimated_read_time: number | null;
  status: string | null;
  feedback: string | null;
  proposer_id: string;
  reviewer_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ArticleProposalWithProposer extends ArticleProposal {
  proposer_name: string;
  proposer_avatar: string | null;
}

// News Types
export interface NewsArticle {
  id: string;
  title: LocalizedContent;
  summary: LocalizedContent;
  content: LocalizedContent;
  source_url: string;
  source_name: string;
  author_name?: string;
  image_url?: string;
  categories: string[];
  keywords: string[];
  relevance_score?: number;
  trending_score: number;
  engagement_score: number;
  related_articles?: string[];
  user_interactions: Record<string, any>;
  read_time?: number;
  ai_processed_at?: string;
  published_at: string;
  created_at: string;
}

// Category and Tag Types
export interface ContentCategory {
  id: string;
  name: LocalizedContent;
  slug: string;
  description?: LocalizedContent;
  color: string;
  icon?: string;
  order_index?: number;
  is_active?: boolean;
  created_at: string;
}

export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

// Interaction Types
export type InteractionType = 'view' | 'like' | 'share' | 'bookmark';
export type ContentType = 'article' | 'news';

export interface ContentInteraction {
  id: string;
  user_id: string;
  content_id: string;
  content_type: ContentType;
  interaction_type: InteractionType;
  metadata: Record<string, any>;
  created_at: string;
}

// Subscription Types
export type SubscriptionType = 'category' | 'tag' | 'author';

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type: SubscriptionType;
  subscription_target: string;
  is_active: boolean;
  created_at: string;
}

// Filter and Search Types
export interface ArticleFilters {
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: 'date' | 'popularity' | 'reading_time';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsFilters {
  categories?: string[];
  sources?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: 'date' | 'trending' | 'engagement';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  locale?: Locale;
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
}

// Content Creation Types
export interface CreateArticleProposal {
  title: string;
  summary: string;
  outline: string;
  author_experience: string;
  previous_work: string[];
  suggested_level: 'beginner' | 'intermediate' | 'advanced';
  suggested_category?: string;
  estimated_read_time?: number;
}

export interface CreateArticle {
  title: LocalizedContent;
  content: LocalizedContent;
  meta_description: LocalizedContent;
  category: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  featured_image_url?: string;
  related_courses?: string[];
  status?: 'draft' | 'review';
}

export interface UpdateArticle extends Partial<CreateArticle> {
  id: string;
}

// Content Analytics Types
export interface ContentEngagement {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_bookmarks: number;
  engagement_rate: number;
}

export interface ContentMetrics {
  id: string;
  content_type: ContentType;
  title: string;
  author: string;
  published_at: string;
  engagement: ContentEngagement;
  trending_score?: number;
  popularity_score: number;
}

// Personalization Types
export interface PersonalizedFeedItem {
  id: string;
  title: LocalizedContent;
  content_type: ContentType;
  author_name: string;
  category: string;
  featured_image?: string;
  published_at: string;
  relevance_score: number;
}

export interface UserInterests {
  categories: string[];
  tags: string[];
  authors: string[];
  reading_history: string[];
}

// AI Processing Types
export interface AIProcessingResult {
  summary: LocalizedContent;
  keywords: string[];
  categories: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  relevance_score: number;
  processing_time: number;
  model_used: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api';
  api_key?: string;
  categories: string[];
  is_active: boolean;
  last_fetched?: string;
}

// Error Types
export interface ContentError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// Form Types
export interface ArticleFormData {
  title: {
    en: string;
    es: string;
  };
  content: {
    en: string;
    es: string;
  };
  meta_description: {
    en: string;
    es: string;
  };
  category: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  featured_image?: File | string;
  related_courses: string[];
}

export interface ProposalFormData {
  title: string;
  summary: string;
  outline: string;
  author_experience: string;
  previous_work: string[];
  suggested_level: 'beginner' | 'intermediate' | 'advanced';
  suggested_category: string;
  estimated_read_time: number;
}

// Component Props Types
export interface ArticleCardProps {
  article: ArticleWithAuthor;
  locale: Locale;
  showInteractions?: boolean;
  compact?: boolean;
}

export interface NewsCardProps {
  article: NewsArticle;
  locale: Locale;
  showInteractions?: boolean;
  compact?: boolean;
}

export interface ContentGridProps<T> {
  items: T[];
  loading?: boolean;
  error?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface FilterProps<T> {
  filters: T;
  onFilterChange: (filters: T) => void;
  categories: ContentCategory[];
  tags: ContentTag[];
}

// Utility Types
export type ContentStatus = Article['status'];
export type ProposalStatus = ArticleProposal['status'];
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Database Function Return Types
export interface SearchArticleResult extends Article {
  author_name: string;
  rank: number;
}

export interface RelatedArticleResult {
  id: string;
  title: LocalizedContent;
  author_id: string;
  author_name: string;
  category: string;
  tags: string[];
  featured_image_url?: string;
  reading_time?: number;
  published_at: string;
  similarity_score: number;
}

export interface TrendingNewsResult {
  id: string;
  title: LocalizedContent;
  summary: LocalizedContent;
  source_name: string;
  image_url?: string;
  categories: string[];
  trending_score: number;
  engagement_score: number;
  published_at: string;
}
