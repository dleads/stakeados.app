// Homepage-specific types and interfaces

import type { Locale, ArticleWithMetrics, NewsArticle } from './content';

// Homepage component props
export interface HomepageProps {
  locale: Locale;
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Homepage data structure
export interface HomepageData {
  news: NewsArticle[];
  articles: ArticleWithMetrics[];
  courses: Course[];
  stats: HomepageStats;
}

// Homepage statistics
export interface HomepageStats {
  totalArticles: number;
  totalNews: number;
  totalCourses: number;
  activeUsers: number;
}

// Course interface (basic structure for homepage)
export interface Course {
  id: string;
  title: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  lessons: number;
  enrolled: number;
  rating: number;
  featured_image?: string;
  instructor: {
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Section component props
export interface HeroSectionProps {
  locale: Locale;
  className?: string;
}

export interface FeaturedNewsSectionProps {
  locale: Locale;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

export interface FeaturedArticlesSectionProps {
  locale: Locale;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

export interface QuickNavigationSectionProps {
  locale: Locale;
  className?: string;
}

export interface CoursesPreviewSectionProps {
  locale: Locale;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

// Navigation card interface
export interface NavigationCard {
  title: string;
  description: string;
  href: string;
  icon: string; // Lucide icon name
  color: string;
  stats?: string;
}

// Error boundary props
export interface SectionErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  sectionName: string;
  locale: Locale;
}

// Skeleton component props
export interface SectionSkeletonProps {
  type: 'news' | 'articles' | 'navigation' | 'courses' | 'hero';
}

// API response types for homepage data
export interface HomepageApiResponse {
  success: boolean;
  data: HomepageData;
  error?: string;
}

// Homepage SEO metadata
export interface HomepageSEOData {
  title: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  keywords: string[];
  openGraph: {
    title: {
      en: string;
      es: string;
    };
    description: {
      en: string;
      es: string;
    };
    image?: string;
  };
  twitter: {
    title: {
      en: string;
      es: string;
    };
    description: {
      en: string;
      es: string;
    };
    image?: string;
  };
}

// Loading states
export type HomepageLoadingState = 'idle' | 'loading' | 'success' | 'error';

// Error types
export interface HomepageError {
  section: string;
  message: string;
  code?: string;
  details?: any;
}

// Performance metrics
export interface HomepagePerformanceMetrics {
  loadTime: number;
  sectionsLoaded: number;
  sectionsErrored: number;
  cacheHits: number;
  cacheMisses: number;
}

// Cache configuration
export interface HomepageCacheConfig {
  news: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  articles: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  courses: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  stats: {
    ttl: number;
    staleWhileRevalidate: number;
  };
}

// Default cache configuration
export const DEFAULT_HOMEPAGE_CACHE_CONFIG: HomepageCacheConfig = {
  news: { ttl: 300, staleWhileRevalidate: 600 }, // 5 minutes
  articles: { ttl: 600, staleWhileRevalidate: 1200 }, // 10 minutes
  courses: { ttl: 1800, staleWhileRevalidate: 3600 }, // 30 minutes
  stats: { ttl: 900, staleWhileRevalidate: 1800 }, // 15 minutes
};

// Homepage analytics events
export type HomepageAnalyticsEvent =
  | 'homepage_view'
  | 'hero_cta_click'
  | 'section_view'
  | 'section_error'
  | 'navigation_card_click'
  | 'view_all_click';

export interface HomepageAnalyticsData {
  event: HomepageAnalyticsEvent;
  section?: string;
  locale: Locale;
  timestamp: number;
  metadata?: Record<string, any>;
}
