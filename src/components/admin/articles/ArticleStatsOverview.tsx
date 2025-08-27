'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  DocumentTextIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

interface ArticleStats {
  total: number;
  draft: number;
  review: number;
  published: number;
  archived: number;
  totalViews?: number;
  avgReadingTime?: number;
  publishedThisWeek?: number;
}

interface ArticleStatsOverviewProps {
  stats: ArticleStats;
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
  loading: boolean;
  subtitle?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
  subtitle,
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green:
      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow:
      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
    purple:
      'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div
            className={`inline-flex items-center justify-center p-2 rounded-md ${colorClasses[color]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              {subtitle && (
                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function ArticleStatsOverview({
  stats,
  loading,
}: ArticleStatsOverviewProps) {
  const t = useTranslations('admin.articles.stats');

  const statCards = [
    {
      title: t('total'),
      value: stats.total,
      icon: DocumentTextIcon,
      color: 'blue' as const,
      subtitle: t('articles'),
    },
    {
      title: t('published'),
      value: stats.published,
      icon: CheckCircleIcon,
      color: 'green' as const,
      subtitle: t('live'),
    },
    {
      title: t('draft'),
      value: stats.draft,
      icon: ClockIcon,
      color: 'yellow' as const,
      subtitle: t('inProgress'),
    },
    {
      title: t('review'),
      value: stats.review,
      icon: ExclamationTriangleIcon,
      color: 'purple' as const,
      subtitle: t('pending'),
    },
    {
      title: t('archived'),
      value: stats.archived,
      icon: ArchiveBoxIcon,
      color: 'gray' as const,
      subtitle: t('inactive'),
    },
  ];

  // Add optional stats if available
  if (stats.totalViews !== undefined) {
    statCards.push({
      title: t('totalViews'),
      value: stats.totalViews,
      icon: EyeIcon,
      color: 'blue' as const,
      subtitle: t('allTime'),
    });
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {t('overview')}
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            loading={loading}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* Additional metrics row */}
      {(stats.avgReadingTime !== undefined ||
        stats.publishedThisWeek !== undefined) && (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {stats.avgReadingTime !== undefined && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('avgReadingTime')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.avgReadingTime} {t('minutes')}
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )}

          {stats.publishedThisWeek !== undefined && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('publishedThisWeek')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.publishedThisWeek}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
