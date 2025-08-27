'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ListBulletIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';
import { ArticleStatsOverview } from './ArticleStatsOverview';
import { ArticleFilters } from './ArticleFilters';
import { ArticleList } from './ArticleList';
import { ArticleCalendarView } from './ArticleCalendarView';
import { useArticleManagement } from '@/hooks/useArticleManagement';

interface ArticleManagementDashboardProps {
  className?: string;
}

type ViewMode = 'list' | 'calendar';

export function ArticleManagementDashboard({
  className = '',
}: ArticleManagementDashboardProps) {
  const t = useTranslations('admin.articles');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    articles,
    stats,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    refreshData,
    deleteArticle,
    updateArticleStatus,
  } = useArticleManagement();

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({ search: searchQuery });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, updateFilters]);

  const handleCreateArticle = () => {
    window.location.href = '/admin/articles/create';
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleRefresh = () => {
    refreshData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-medium">
              {t('error.title')}
            </h3>
            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {t('actions.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <ArrowUpIcon className="h-4 w-4 mr-2" />
                {t('actions.refresh')}
              </button>

              <button
                onClick={handleCreateArticle}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="mb-8">
          <ArticleStatsOverview stats={stats} loading={loading} />
        </div>

        {/* Controls */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  showFilters
                    ? 'border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {t('filters.toggle')}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 mr-2" />
                {t('views.list')}
              </button>

              <button
                onClick={() => handleViewModeChange('calendar')}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t('views.calendar')}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4">
              <ArticleFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={() => updateFilters({})}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {viewMode === 'list' ? (
            <ArticleList
              articles={articles}
              loading={loading}
              pagination={pagination}
              onPageChange={page => updateFilters({ page })}
              onSortChange={(sortBy, sortOrder) =>
                updateFilters({ sort_by: sortBy as any, sort_order: sortOrder })
              }
              onStatusChange={updateArticleStatus}
              onDelete={deleteArticle}
            />
          ) : (
            <ArticleCalendarView
              articles={articles}
              loading={loading}
              onStatusChange={updateArticleStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
