'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import NewsCard from './NewsCard';
import NewsFilters from './NewsFilters';
import NewsPreferences from './NewsPreferences';
import {
  Loader2,
  AlertCircle,
  Newspaper,
  TrendingUp,
  Settings,
} from 'lucide-react';
import type {
  NewsQueryParams,
  NewsFilters as NewsFiltersType,
} from '@/app/api/news/route';
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
  image_url?: string | null;
  // Additional fields that might be used
  ai_processed?: boolean | null;
  ai_sentiment?: string | null;
  cluster_id?: string | null;
  description?: string | null;
  fetched_at?: string | null;
  importance_score?: number | null;
  tags?: string[] | null;
  url?: string | null;
};

interface NewsGridProps {
  initialFilters?: NewsFiltersType;
  showFilters?: boolean;
  showTrending?: boolean;
  personalizedFeed?: boolean;
  className?: string;
  maxItems?: number;
  disableRealTime?: boolean;
  emptyStateComponent?: React.ReactNode;
}

interface NewsResponse {
  articles: NewsArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  filters: NewsFiltersType;
}

// Fetch news articles from API
const fetchNews = async ({
  pageParam = 0,
  filters = {},
  sortBy = 'published_at',
  sortOrder = 'desc',
  personalized = false,
}: {
  pageParam?: number;
  filters?: NewsFiltersType;
  sortBy?: NewsQueryParams['sortBy'];
  sortOrder?: NewsQueryParams['sortOrder'];
  personalized?: boolean;
}): Promise<NewsResponse> => {
  const endpoint = personalized ? '/api/news/personalized' : '/api/news';

  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: '20',
    ...(personalized ? {} : { sortBy, sortOrder }),
    ...Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      ])
    ),
  });

  const response = await fetch(`${endpoint}?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch news articles');
  }

  return response.json();
};

export default function NewsGrid({
  initialFilters = {},
  showFilters = true,
  showTrending = true,
  personalizedFeed = false,
  className = '',
  maxItems,
  disableRealTime = false,
  emptyStateComponent,
}: NewsGridProps) {
  const t = useTranslations();
  const [filters, setFilters] = useState<NewsFiltersType>({
    ...initialFilters,
    personalized: personalizedFeed,
  });
  const [sortBy, setSortBy] =
    useState<NewsQueryParams['sortBy']>('published_at');
  const [sortOrder, setSortOrder] =
    useState<NewsQueryParams['sortOrder']>('desc');
  const [realTimeEnabled, setRealTimeEnabled] = useState(!disableRealTime);
  const [showPreferences, setShowPreferences] = useState(false);

  // Infinite query for news articles
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['news', filters, sortBy, sortOrder, personalizedFeed],
    queryFn: ({ pageParam = 0 }) =>
      fetchNews({
        pageParam,
        filters,
        sortBy,
        sortOrder,
        personalized: personalizedFeed,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.pagination.nextPage,
    staleTime: personalizedFeed ? 5 * 60 * 1000 : 3 * 60 * 1000, // 5 minutes for personalized, 3 for regular
    refetchInterval: realTimeEnabled ? 5 * 60 * 1000 : false, // 5 minutes for real-time updates
  });

  // Flatten all articles from all pages
  const allArticles = useMemo(() => {
    const articles = data?.pages.flatMap(page => page.articles) || [];
    return maxItems ? articles.slice(0, maxItems) : articles;
  }, [data, maxItems]);

  // Intersection observer for infinite scroll
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Trigger next page fetch when intersection is detected
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: NewsFiltersType) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback(
    (
      newSortBy: NewsQueryParams['sortBy'],
      newSortOrder: NewsQueryParams['sortOrder']
    ) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    []
  );

  // Real-time updates toggle
  const toggleRealTime = useCallback(() => {
    setRealTimeEnabled(prev => !prev);
  }, []);

  // Get total count
  const totalCount = data?.pages[0]?.pagination.total || 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-stakeados-orange mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          {t('news.error.title')}
        </h3>
        <p className="text-stakeados-gray-300 mb-4">
          {error instanceof Error ? error.message : t('news.error.generic')}
        </p>
        <button onClick={() => refetch()} className="btn-primary">
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className={`news-grid ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-stakeados-primary" />
          <h2 className="text-2xl font-bold text-white">
            {personalizedFeed
              ? t('news.personalizedFeed')
              : t('news.latestNews')}
          </h2>
          {totalCount > 0 && (
            <span className="px-3 py-1 bg-stakeados-primary/20 text-stakeados-primary rounded-full text-sm font-semibold">
              {totalCount.toLocaleString()} {t('news.articles')}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {personalizedFeed && (
            <button
              onClick={() => setShowPreferences(true)}
              className="flex items-center gap-2 px-3 py-2 bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600 rounded-gaming transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t('news.preferences.title')}
            </button>
          )}

          {showTrending && (
            <button
              onClick={() =>
                handleFilterChange({ trending: !filters.trending })
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-gaming transition-colors ${
                filters.trending
                  ? 'bg-stakeados-primary text-black'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {t('news.trending')}
            </button>
          )}

          {!disableRealTime && (
            <button
              onClick={toggleRealTime}
              className={`px-3 py-2 rounded-gaming text-sm transition-colors ${
                realTimeEnabled
                  ? 'bg-stakeados-blue/20 text-stakeados-blue'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-400'
              }`}
            >
              {realTimeEnabled ? t('news.realTimeOn') : t('news.realTimeOff')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <NewsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          className="mb-6"
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <NewsCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading &&
        allArticles.length === 0 &&
        (emptyStateComponent || (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Newspaper className="w-16 h-16 text-stakeados-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {t('news.empty.title')}
            </h3>
            <p className="text-stakeados-gray-300 max-w-md">
              {t('news.empty.description')}
            </p>
          </div>
        ))}

      {/* Articles Grid */}
      {allArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allArticles.map((article, index) => (
            <NewsCard
              key={`${article.id}-${index}`}
              article={article}
              showSource={true}
              showRelevanceScore={personalizedFeed}
              showCategories={true}
              showKeywords={false}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={targetRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-stakeados-gray-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('news.loadingMore')}
            </div>
          ) : (
            <div className="text-stakeados-gray-500 text-sm">
              {t('news.scrollForMore')}
            </div>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && allArticles.length > 0 && (
        <div className="text-center py-8">
          <p className="text-stakeados-gray-400">{t('news.endOfResults')}</p>
        </div>
      )}

      {/* Preferences Modal */}
      <NewsPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  );
}

// Skeleton component for loading state
function NewsCardSkeleton() {
  return (
    <div className="card-primary animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stakeados-gray-700 rounded w-1/4"></div>
            <div className="h-6 bg-stakeados-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-stakeados-gray-700 rounded"></div>
              <div className="h-4 bg-stakeados-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2">
          <div className="h-6 bg-stakeados-gray-700 rounded w-16"></div>
          <div className="h-6 bg-stakeados-gray-700 rounded w-20"></div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4">
          <div className="h-4 bg-stakeados-gray-700 rounded w-20"></div>
          <div className="h-4 bg-stakeados-gray-700 rounded w-24"></div>
        </div>

        {/* Source */}
        <div className="flex items-center gap-3 pb-4 border-b border-stakeados-gray-700">
          <div className="w-5 h-5 bg-stakeados-gray-700 rounded"></div>
          <div className="space-y-1">
            <div className="h-4 bg-stakeados-gray-700 rounded w-24"></div>
            <div className="h-3 bg-stakeados-gray-700 rounded w-16"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <div className="h-10 bg-stakeados-gray-700 rounded flex-1"></div>
          <div className="h-10 w-10 bg-stakeados-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}
