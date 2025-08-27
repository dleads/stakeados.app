export interface ContentAnalytics {
  id: string;
  contentId: string;
  contentType: 'article' | 'news';
  date: string;
  views: number;
  uniqueViews: number;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  averageReadingTime: number;
  completionRate: number;
  bounceRate: number;
  engagementScore: number;
  trendingScore: number;
  referrerData: Record<string, any>;
  deviceData: Record<string, any>;
  locationData: Record<string, any>;
}

export interface ReadingSession {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'article' | 'news';
  sessionStart: string;
  sessionEnd?: string;
  readingTime: number;
  scrollDepth: number;
  interactions: Record<string, any>;
  deviceInfo: Record<string, any>;
  referrer?: string;
  exitPoint?: string;
  completed: boolean;
}

export interface PerformanceSnapshot {
  id: string;
  contentId: string;
  contentType: 'article' | 'news';
  snapshotDate: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  totalViews: number;
  uniqueViews: number;
  totalEngagement: number;
  averageRating: number;
  performanceRank?: number;
  categoryRank?: number;
  authorRank?: number;
  metrics: Record<string, any>;
}

export interface TrendingContent {
  id: string;
  contentId: string;
  contentType: 'article' | 'news';
  trendingDate: string;
  trendingScore: number;
  velocityScore: number;
  category?: string;
  tags?: string[];
  rankPosition?: number;
  previousRank?: number;
  rankChange: number;
  trendingDuration: number;
  peakScore?: number;
}

export interface AuthorAnalytics {
  id: string;
  authorId: string;
  periodStart: string;
  periodEnd: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  articlesPublished: number;
  totalViews: number;
  totalEngagement: number;
  averageRating: number;
  trendingArticles: number;
  topPerformingArticle?: string;
  engagementRate: number;
  followerGrowth: number;
  pointsEarned: number;
  rankPosition?: number;
  performanceMetrics: Record<string, any>;
}

export interface ContentPerformanceMetrics {
  totalViews: number;
  uniqueViews: number;
  engagementRate: number;
  averageReadingTime: number;
  completionRate: number;
  shareRate: number;
  bookmarkRate: number;
  trendingScore: number;
  performanceRank?: number;
  categoryRank?: number;
  timeSeriesData: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  contentType?: 'article' | 'news';
  category?: string;
  author?: string;
  tags?: string[];
}

class AnalyticsService {
  constructor() {}

  // Content Performance Tracking
  async getContentAnalytics(
    _contentId: string,
    _contentType: 'article' | 'news',
    _filters?: AnalyticsFilters
  ): Promise<ContentAnalytics[]> {
    // TODO: Implement when content_analytics table is available
    console.warn('Content analytics table not available yet');
    return [];
  }

  async getContentPerformanceMetrics(
    _contentId: string,
    _contentType: 'article' | 'news',
    _period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ContentPerformanceMetrics> {
    // TODO: Implement when content_analytics table is available
    console.warn('Content analytics table not available yet');

    // TODO: Implement when content_analytics table is available
    console.warn('Content analytics table not available yet');
    return {
      totalViews: 0,
      uniqueViews: 0,
      engagementRate: 0,
      averageReadingTime: 0,
      completionRate: 0,
      shareRate: 0,
      bookmarkRate: 0,
      trendingScore: 0,
      timeSeriesData: [],
    };
  }

  async getTopPerformingContent(
    _contentType: 'article' | 'news',
    _period: 'day' | 'week' | 'month' = 'week',
    _limit: number = 10
  ): Promise<Array<ContentAnalytics & { title: string; author?: string }>> {
    // TODO: Implement when content_analytics table is available
    console.warn('Content analytics table not available yet');
    return [];
  }

  // Reading Session Tracking
  async startReadingSession(
    _userId: string,
    _contentId: string,
    _contentType: 'article' | 'news',
    _deviceInfo?: Record<string, any>,
    _referrer?: string
  ): Promise<string> {
    // TODO: Implement when user_reading_sessions table is available
    console.warn('User reading sessions table not available yet');
    return 'temp-session-id';
  }

  async updateReadingSession(
    _sessionId: string,
    _updates: {
      readingTime?: number;
      scrollDepth?: number;
      interactions?: Record<string, any>;
      exitPoint?: string;
      completed?: boolean;
    }
  ): Promise<void> {
    // TODO: Implement when user_reading_sessions table is available
    console.warn('User reading sessions table not available yet');
  }

  async endReadingSession(_sessionId: string): Promise<void> {
    // TODO: Implement when user_reading_sessions table is available
    console.warn('User reading sessions table not available yet');
  }

  // Trending Analysis
  async getTrendingContent(
    _contentType?: 'article' | 'news',
    _category?: string,
    _limit: number = 20
  ): Promise<TrendingContent[]> {
    // TODO: Implement when trending_content table is available
    console.warn('Trending content table not available yet');
    return [];
  }

  // Author Analytics
  async getAuthorAnalytics(
    _authorId: string,
    _periodType: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    _limit: number = 12
  ): Promise<AuthorAnalytics[]> {
    // TODO: Implement when author_analytics table is available
    console.warn('Author analytics table not available yet');
    return [];
  }

  async getAuthorPerformanceComparison(
    _authorIds: string[],
    _period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Array<AuthorAnalytics & { authorName: string }>> {
    // TODO: Implement when author_analytics table is available
    console.warn('Author analytics table not available yet');
    return [];
  }

  // Performance Snapshots
  async getPerformanceSnapshots(
    _contentId: string,
    _contentType: 'article' | 'news',
    _periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
    _limit: number = 30
  ): Promise<PerformanceSnapshot[]> {
    // TODO: Implement when content_performance_snapshots table is available
    console.warn('Content performance snapshots table not available yet');
    return [];
  }

  // Analytics Dashboard Data
  async getDashboardData(
    _userId: string,
    _isAuthor: boolean = false
  ): Promise<{
    totalViews: number;
    totalEngagement: number;
    trendingContent: TrendingContent[];
    topPerforming: Array<ContentAnalytics & { title: string }>;
    recentAnalytics: ContentAnalytics[];
  }> {
    // TODO: Implement when analytics tables are available
    console.warn('Analytics tables not available yet');
    return {
      totalViews: 0,
      totalEngagement: 0,
      trendingContent: [],
      topPerforming: [],
      recentAnalytics: [],
    };
  }

  // Utility functions for data mapping
  // (mapping helpers removed while analytics persistence is not implemented)
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
