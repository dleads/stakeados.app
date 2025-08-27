'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  author: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  status: 'draft' | 'review' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  reading_time: number;
  views?: number;
  likes?: number;
  language: 'es' | 'en';
  slug: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onStatusChange: (
    articleId: string,
    status: Article['status']
  ) => Promise<void>;
  onDelete: (articleId: string) => Promise<void>;
}

interface StatusBadgeProps {
  status: Article['status'];
  size?: 'sm' | 'md';
}

function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const t = useTranslations('admin.articles.status');

  const statusConfig = {
    draft: {
      color:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      icon: ClockIcon,
      label: t('draft'),
    },
    review: {
      color:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      icon: ExclamationTriangleIcon,
      label: t('review'),
    },
    published: {
      color:
        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      icon: CheckCircleIcon,
      label: t('published'),
    },
    archived: {
      color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
      icon: ArchiveBoxIcon,
      label: t('archived'),
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClasses =
    size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full font-medium ${config.color}`}
    >
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
      {config.label}
    </span>
  );
}

export function ArticleList({
  articles,
  loading,
  pagination,
  onPageChange,
  onSortChange,
  onStatusChange,
  onDelete,
}: ArticleListProps) {
  const t = useTranslations('admin.articles.list');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSort = (field: string) => {
    const newSortOrder =
      sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    onSortChange(field, newSortOrder);
  };

  const handleStatusChange = async (
    articleId: string,
    newStatus: Article['status']
  ) => {
    try {
      setActionLoading(articleId);
      await onStatusChange(articleId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      setActionLoading(articleId);
      await onDelete(articleId);
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedArticles(checked ? articles.map(a => a.id) : []);
  };

  const handleSelectArticle = (articleId: string, checked: boolean) => {
    setSelectedArticles(prev =>
      checked ? [...prev, articleId] : prev.filter(id => id !== articleId)
    );
  };

  const formatDate = (dateString: string, locale: 'es' | 'en' = 'es') => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: locale === 'es' ? es : enUS,
    });
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="group inline-flex items-center text-left font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
    >
      {children}
      <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-500">
        {sortBy === field ? (
          sortOrder === 'desc' ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronUpIcon className="h-4 w-4" />
          )
        ) : (
          <ChevronUpIcon className="h-4 w-4 opacity-0 group-hover:opacity-50" />
        )}
      </span>
    </button>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 py-4 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('noArticles')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('noArticlesDescription')}
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {t('selectedCount', { count: selectedArticles.length })}
            </span>
            <div className="flex items-center gap-2">
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                {t('bulkActions.publish')}
              </button>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                {t('bulkActions.archive')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === articles.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortButton field="title">{t('columns.title')}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('columns.author')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('columns.category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('columns.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortButton field="created_at">
                  {t('columns.created')}
                </SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('columns.metrics')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {articles.map(article => (
              <tr
                key={article.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedArticles.includes(article.id)}
                    onChange={e =>
                      handleSelectArticle(article.id, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {article.title}
                    </div>
                    {article.summary && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                        {article.summary}
                      </div>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {article.reading_time} {t('readingTime')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {article.author.avatar_url && (
                      <img
                        className="h-8 w-8 rounded-full mr-3"
                        src={article.author.avatar_url}
                        alt={article.author.display_name}
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {article.author.display_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{article.author.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {article.category ? (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: article.category.color
                          ? `${article.category.color}20`
                          : undefined,
                        color: article.category.color || undefined,
                      }}
                    >
                      {article.category.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('noCategory')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={article.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div>{formatDate(article.created_at)}</div>
                  {article.published_at && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {t('published')} {formatDate(article.published_at)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    {article.views !== undefined && (
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {article.views}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() =>
                        window.open(`/articles/${article.slug}`, '_blank')
                      }
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title={t('actions.view')}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() =>
                        (window.location.href = `/admin/articles/${article.id}/edit`)
                      }
                      className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      title={t('actions.edit')}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>

                    {/* Status Change Dropdown */}
                    <select
                      value={article.status}
                      onChange={e =>
                        handleStatusChange(
                          article.id,
                          e.target.value as Article['status']
                        )
                      }
                      disabled={actionLoading === article.id}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="draft">{t('status.draft')}</option>
                      <option value="review">{t('status.review')}</option>
                      <option value="published">{t('status.published')}</option>
                      <option value="archived">{t('status.archived')}</option>
                    </select>

                    <button
                      onClick={() => handleDelete(article.id)}
                      disabled={actionLoading === article.id}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50"
                      title={t('actions.delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {t('pagination.previous')}
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {t('pagination.next')}
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('pagination.showing')}{' '}
                {pagination.page * pagination.limit + 1} {t('pagination.to')}{' '}
                {Math.min(
                  (pagination.page + 1) * pagination.limit,
                  pagination.total
                )}{' '}
                {t('pagination.of')} {pagination.total}{' '}
                {t('pagination.results')}
              </p>
            </div>

            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const pageNum = i;
                  const isActive = pageNum === pagination.page;

                  return (
                    <button
                      key={i}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        isActive
                          ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
