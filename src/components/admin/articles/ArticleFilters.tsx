'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface ArticleFilters {
  status?: 'draft' | 'review' | 'published' | 'archived';
  author_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

interface Author {
  id: string;
  display_name: string;
  username: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface ArticleFiltersProps {
  filters: ArticleFilters;
  onFiltersChange: (filters: Partial<ArticleFilters>) => void;
  onReset: () => void;
}

export function ArticleFilters({
  filters,
  onFiltersChange,
  onReset,
}: ArticleFiltersProps) {
  const t = useTranslations('admin.articles.filters');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Load authors and categories
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoading(true);

        // Load authors
        const authorsResponse = await fetch(
          '/api/admin/users?role=author,editor,admin'
        );
        if (authorsResponse.ok) {
          const authorsData = await authorsResponse.json();
          setAuthors(authorsData.data || []);
        }

        // Load categories
        const categoriesResponse = await fetch('/api/admin/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.data || []);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterData();
  }, []);

  const handleFilterChange = (
    key: keyof ArticleFilters,
    value: string | undefined
  ) => {
    onFiltersChange({ [key]: value || undefined });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const hasActiveFilters = Object.values(filters).some(
    value =>
      value !== undefined &&
      value !== '' &&
      value !== 'created_at' &&
      value !== 'desc'
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {t('title')}
        </h3>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            {t('reset')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('status.label')}
          </label>
          <select
            value={filters.status || ''}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('status.all')}</option>
            <option value="draft">{t('status.draft')}</option>
            <option value="review">{t('status.review')}</option>
            <option value="published">{t('status.published')}</option>
            <option value="archived">{t('status.archived')}</option>
          </select>
        </div>

        {/* Author Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('author.label')}
          </label>
          <select
            value={filters.author_id || ''}
            onChange={e => handleFilterChange('author_id', e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">{loading ? t('loading') : t('author.all')}</option>
            {authors.map(author => (
              <option key={author.id} value={author.id}>
                {author.display_name || author.username}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('category.label')}
          </label>
          <select
            value={filters.category_id || ''}
            onChange={e => handleFilterChange('category_id', e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">
              {loading ? t('loading') : t('category.all')}
            </option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('sortBy.label')}
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sort_by || 'created_at'}
              onChange={e => handleFilterChange('sort_by', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">{t('sortBy.created')}</option>
              <option value="updated_at">{t('sortBy.updated')}</option>
              <option value="published_at">{t('sortBy.published')}</option>
              <option value="title">{t('sortBy.title')}</option>
            </select>

            <select
              value={filters.sort_order || 'desc'}
              onChange={e => handleFilterChange('sort_order', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">{t('sortOrder.desc')}</option>
              <option value="asc">{t('sortOrder.asc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('dateRange.from')}
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.date_from ? formatDate(filters.date_from) : ''}
              onChange={e =>
                handleFilterChange(
                  'date_from',
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined
                )
              }
              className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('dateRange.to')}
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.date_to ? formatDate(filters.date_to) : ''}
              onChange={e =>
                handleFilterChange(
                  'date_to',
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined
                )
              }
              className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {t('status.label')}: {t(`status.${filters.status}`)}
                <button
                  onClick={() => handleFilterChange('status', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-500"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.author_id && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                {t('author.label')}:{' '}
                {authors.find(a => a.id === filters.author_id)?.display_name ||
                  'Unknown'}
                <button
                  onClick={() => handleFilterChange('author_id', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 dark:hover:bg-green-800 hover:text-green-500"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.category_id && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                {t('category.label')}:{' '}
                {categories.find(c => c.id === filters.category_id)?.name ||
                  'Unknown'}
                <button
                  onClick={() => handleFilterChange('category_id', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 hover:text-purple-500"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
