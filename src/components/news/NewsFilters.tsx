'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Filter,
  Search,
  Calendar,
  Tag,
  Globe,
  Star,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
} from 'lucide-react';
import type {
  NewsFilters as NewsFiltersType,
  NewsQueryParams,
} from '@/app/api/news/route';

interface NewsFiltersProps {
  filters: NewsFiltersType;
  onFilterChange: (filters: NewsFiltersType) => void;
  sortBy: NewsQueryParams['sortBy'];
  sortOrder: NewsQueryParams['sortOrder'];
  onSortChange: (
    sortBy: NewsQueryParams['sortBy'],
    sortOrder: NewsQueryParams['sortOrder']
  ) => void;
  className?: string;
}

// Predefined categories for news
const NEWS_CATEGORIES = [
  'DeFi',
  'NFTs',
  'Base',
  'Trading',
  'Regulation',
  'Technology',
  'Market Analysis',
  'Bitcoin',
  'Ethereum',
  'Altcoins',
];

// Sort options
const SORT_OPTIONS: Array<{
  value: NewsQueryParams['sortBy'];
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'published_at',
    label: 'Date',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    value: 'relevance_score',
    label: 'Relevance',
    icon: <Star className="w-4 h-4" />,
  },
  {
    value: 'trending_score',
    label: 'Trending',
    icon: <SortAsc className="w-4 h-4" />,
  },
  {
    value: 'engagement_score',
    label: 'Engagement',
    icon: <Globe className="w-4 h-4" />,
  },
];

export default function NewsFilters({
  filters,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  className = '',
}: NewsFiltersProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Handle category toggle
  const handleCategoryToggle = useCallback(
    (category: string) => {
      const currentCategories = filters.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];

      onFilterChange({ ...filters, categories: newCategories });
    },
    [filters, onFilterChange]
  );

  // Handle keyword search
  const handleKeywordSearch = useCallback(
    (keyword: string) => {
      if (!keyword.trim()) return;

      const currentKeywords = filters.keywords || [];
      if (!currentKeywords.includes(keyword.trim())) {
        onFilterChange({
          ...filters,
          keywords: [...currentKeywords, keyword.trim()],
        });
      }
      setSearchKeyword('');
    },
    [filters, onFilterChange]
  );

  // Remove keyword
  const handleRemoveKeyword = useCallback(
    (keyword: string) => {
      const newKeywords = (filters.keywords || []).filter(k => k !== keyword);
      onFilterChange({ ...filters, keywords: newKeywords });
    },
    [filters, onFilterChange]
  );

  // Handle relevance score filter
  const handleRelevanceScoreChange = useCallback(
    (score: number) => {
      onFilterChange({
        ...filters,
        minRelevanceScore:
          score === filters.minRelevanceScore ? undefined : score,
      });
    },
    [filters, onFilterChange]
  );

  // Handle date range
  const handleDateRangeChange = useCallback(
    (type: 'from' | 'to', date: string) => {
      if (type === 'from') {
        onFilterChange({ ...filters, dateFrom: date || undefined });
      } else {
        onFilterChange({ ...filters, dateTo: date || undefined });
      }
    },
    [filters, onFilterChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFilterChange({
      personalized: filters.personalized, // Keep personalized setting
    });
  }, [filters.personalized, onFilterChange]);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortBy, sortOrder, onSortChange]);

  // Count active filters
  const activeFiltersCount = [
    filters.categories?.length || 0,
    filters.keywords?.length || 0,
    filters.source ? 1 : 0,
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
    filters.minRelevanceScore ? 1 : 0,
    filters.trending ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className={`news-filters ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t('news.filters.title')}
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-stakeados-primary text-black rounded-full text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-stakeados-orange hover:bg-stakeados-orange/10 rounded-gaming transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              {t('news.filters.clearAll')}
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e =>
              onSortChange(
                e.target.value as NewsQueryParams['sortBy'],
                sortOrder
              )
            }
            className="px-3 py-2 bg-stakeados-gray-800 text-white rounded-gaming border border-stakeados-gray-600 focus:border-stakeados-primary focus:outline-none"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {t(`news.sort.${option.value}`)}
              </option>
            ))}
          </select>

          <button
            onClick={toggleSortOrder}
            className="p-2 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            title={
              sortOrder === 'asc'
                ? t('news.sort.ascending')
                : t('news.sort.descending')
            }
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 p-4 bg-stakeados-gray-900/50 rounded-gaming border border-stakeados-gray-700">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
              {t('news.filters.keywords')}
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stakeados-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleKeywordSearch(searchKeyword);
                    }
                  }}
                  placeholder={t('news.filters.keywordsPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 bg-stakeados-gray-800 text-white rounded-gaming border border-stakeados-gray-600 focus:border-stakeados-primary focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleKeywordSearch(searchKeyword)}
                disabled={!searchKeyword.trim()}
                className="px-4 py-2 bg-stakeados-primary text-black rounded-gaming hover:bg-stakeados-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.add')}
              </button>
            </div>

            {/* Active Keywords */}
            {filters.keywords && filters.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.keywords.map(keyword => (
                  <span
                    key={keyword}
                    className="flex items-center gap-1 px-3 py-1 bg-stakeados-blue/20 text-stakeados-blue rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-stakeados-orange transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
              {t('news.filters.categories')}
            </label>
            <div className="flex flex-wrap gap-2">
              {NEWS_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-2 rounded-gaming text-sm transition-colors ${
                    filters.categories?.includes(category)
                      ? 'bg-stakeados-primary text-black'
                      : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                {t('news.filters.dateFrom')}
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={e => handleDateRangeChange('from', e.target.value)}
                className="w-full px-3 py-2 bg-stakeados-gray-800 text-white rounded-gaming border border-stakeados-gray-600 focus:border-stakeados-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                {t('news.filters.dateTo')}
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={e => handleDateRangeChange('to', e.target.value)}
                className="w-full px-3 py-2 bg-stakeados-gray-800 text-white rounded-gaming border border-stakeados-gray-600 focus:border-stakeados-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Relevance Score */}
          <div>
            <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
              {t('news.filters.minRelevanceScore')}
            </label>
            <div className="flex gap-2">
              {[6, 7, 8, 9].map(score => (
                <button
                  key={score}
                  onClick={() => handleRelevanceScoreChange(score)}
                  className={`px-3 py-2 rounded-gaming text-sm transition-colors ${
                    filters.minRelevanceScore === score
                      ? 'bg-stakeados-primary text-black'
                      : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                  }`}
                >
                  {score}+
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
