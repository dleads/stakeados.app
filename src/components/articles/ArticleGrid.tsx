'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  BookOpen,
  Loader2,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { ContentService } from '@/lib/services/contentService';
import ArticleCard from './ArticleCard';
import type {
  ArticleWithMetrics,
  ArticleFilters,
  ContentCategory,
  Locale,
  PaginatedResponse,
} from '@/types/content';

interface ArticleGridProps {
  locale: Locale;
  showFilters?: boolean;
  showSearch?: boolean;
  maxArticles?: number;
  categoryFilter?: string;
  className?: string;
  emptyStateComponent?: React.ReactNode;
}

export default function ArticleGrid({
  locale,
  showFilters = true,
  showSearch = true,
  maxArticles,
  categoryFilter,
  className = '',
  emptyStateComponent,
}: ArticleGridProps) {
  const t = useTranslations();

  // State
  const [articles, setArticles] = useState<ArticleWithMetrics[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [filters, setFilters] = useState<ArticleFilters>({
    category: categoryFilter,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load articles when filters change
  useEffect(() => {
    loadArticles(true);
  }, [filters, searchQuery]);

  const loadInitialData = async () => {
    try {
      const [categoriesData] = await Promise.all([
        ContentService.getCategories(),
      ]);

      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadArticles = async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const page = reset ? 0 : currentPage;
      const limit = maxArticles || 20;

      let result: PaginatedResponse<ArticleWithMetrics>;

      if (searchQuery.trim()) {
        // Use search functionality
        const searchResult = await ContentService.searchArticles({
          query: searchQuery,
          locale,
          category: filters.category,
          difficulty: filters.difficulty,
          limit,
          offset: page * limit,
        });

        result = {
          data: searchResult.data as unknown as ArticleWithMetrics[],
          count: searchResult.total,
          page,
          limit,
          hasMore: searchResult.data.length === limit,
        };
      } else {
        // Use regular filtering
        result = await ContentService.getArticles(filters, page, limit);
      }

      if (reset) {
        setArticles(result.data);
        setCurrentPage(0);
      } else {
        setArticles(prev => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles(true);
  };

  const handleFilterChange = (newFilters: Partial<ArticleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
      loadArticles(false);
    }
  };

  const displayArticles = useMemo(() => {
    let result = articles;

    if (maxArticles) {
      result = result.slice(0, maxArticles);
    }

    return result;
  }, [articles, maxArticles]);

  if (error) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading articles: {error}</p>
          <button onClick={() => loadArticles(true)} className="btn-ghost mt-3">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon mb-2">
            {t('community.articles')}
          </h2>
          <p className="text-stakeados-gray-300">
            Discover educational content from our community
          </p>
        </div>

        {displayArticles.length > 0 && (
          <div className="text-sm text-stakeados-gray-400">
            {displayArticles.length} article
            {displayArticles.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="card-gaming">
          <div className="space-y-4">
            {/* Search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stakeados-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('common.search') + ' articles...'}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700 text-white rounded-lg focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('common.search')
                  )}
                </button>
              </form>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-stakeados-gray-400" />
                    <span className="text-sm text-stakeados-gray-300">
                      Category:
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        handleFilterChange({ category: undefined })
                      }
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        !filters.category
                          ? 'bg-stakeados-primary text-stakeados-dark'
                          : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() =>
                          handleFilterChange({ category: category.id })
                        }
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          filters.category === category.id
                            ? 'bg-stakeados-primary text-stakeados-dark'
                            : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                        }`}
                        style={{
                          backgroundColor:
                            filters.category === category.id
                              ? category.color
                              : undefined,
                        }}
                      >
                        {category.name[locale]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-stakeados-gray-400" />
                    <span className="text-sm text-stakeados-gray-300">
                      Difficulty:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {['all', 'beginner', 'intermediate', 'advanced'].map(
                      difficulty => (
                        <button
                          key={difficulty}
                          onClick={() =>
                            handleFilterChange({
                              difficulty:
                                difficulty === 'all'
                                  ? undefined
                                  : (difficulty as any),
                            })
                          }
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            (difficulty === 'all' && !filters.difficulty) ||
                            filters.difficulty === difficulty
                              ? 'bg-stakeados-primary text-stakeados-dark'
                              : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                          }`}
                        >
                          {difficulty === 'all'
                            ? 'All'
                            : difficulty.charAt(0).toUpperCase() +
                              difficulty.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stakeados-gray-400" />
                    <span className="text-sm text-stakeados-gray-300">
                      Sort by:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      { key: 'date', label: 'Date' },
                      { key: 'popularity', label: 'Popularity' },
                      { key: 'reading_time', label: 'Reading Time' },
                    ].map(sort => (
                      <button
                        key={sort.key}
                        onClick={() =>
                          handleFilterChange({ sortBy: sort.key as any })
                        }
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          filters.sortBy === sort.key
                            ? 'bg-stakeados-primary text-stakeados-dark'
                            : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                        }`}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      handleFilterChange({
                        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                      })
                    }
                    className="px-3 py-1 rounded text-sm font-medium bg-gray-900/50 text-gray-300 hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && articles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">Loading articles...</p>
        </div>
      )}

      {/* Articles Grid */}
      {displayArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayArticles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              locale={locale}
              showInteractions={true}
              compact={false}
              priority={index < 6} // Prioritize first 6 images for performance
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !maxArticles && displayArticles.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="btn-secondary px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More Articles'
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading &&
        displayArticles.length === 0 &&
        (emptyStateComponent || (
          <div className="card-gaming text-center py-12">
            <BookOpen className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
              No Articles Found
            </h3>
            <p className="text-stakeados-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Check back soon for new articles from our community'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ sortBy: 'date', sortOrder: 'desc' });
                }}
                className="btn-primary"
              >
                Clear Search
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
