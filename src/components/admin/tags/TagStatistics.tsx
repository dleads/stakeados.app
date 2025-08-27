'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  TagIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { TagStatistics as TagStatsType } from '@/hooks/useTagManager';

interface TagStatisticsProps {
  statistics: TagStatsType;
}

export default function TagStatistics({ statistics }: TagStatisticsProps) {
  const t = useTranslations('admin.tags.statistics');

  const stats = [
    {
      name: t('totalTags'),
      value: statistics.totalTags,
      icon: TagIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: t('totalTagsDescription'),
    },
    {
      name: t('totalUsage'),
      value: statistics.totalUsage,
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: t('totalUsageDescription'),
    },
    {
      name: t('unusedTags'),
      value: statistics.unusedTags,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      description: t('unusedTagsDescription'),
    },
    {
      name: t('averageUsage'),
      value: statistics.averageUsage.toFixed(1),
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: t('averageUsageDescription'),
    },
  ];

  const usageDistribution = [
    {
      label: t('highUsage'),
      count: Math.floor(statistics.totalTags * 0.2), // Simulated
      percentage: 20,
      color: 'bg-green-500',
    },
    {
      label: t('mediumUsage'),
      count: Math.floor(statistics.totalTags * 0.3), // Simulated
      percentage: 30,
      color: 'bg-yellow-500',
    },
    {
      label: t('lowUsage'),
      count: Math.floor(statistics.totalTags * 0.3), // Simulated
      percentage: 30,
      color: 'bg-orange-500',
    },
    {
      label: t('noUsage'),
      count: statistics.unusedTags,
      percentage:
        statistics.totalTags > 0
          ? (statistics.unusedTags / statistics.totalTags) * 100
          : 0,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Usage Distribution */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('usageDistribution')}
        </h3>

        <div className="space-y-4">
          {usageDistribution.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded ${item.color} mr-3`}></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.count} {t('tags')}
                </span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {statistics.unusedTags > 0 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('recommendations.title')}
              </h4>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  {t('recommendations.unusedTags', {
                    count: statistics.unusedTags,
                  })}
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>{t('recommendations.reviewUnused')}</li>
                  <li>{t('recommendations.mergesSimilar')}</li>
                  <li>{t('recommendations.deleteUnused')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t('insights.tagHealth')}
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('insights.activelyUsed')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {statistics.totalTags - statistics.unusedTags}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('insights.needsAttention')}
              </span>
              <span className="font-medium text-yellow-600">
                {statistics.unusedTags}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('insights.healthScore')}
              </span>
              <span className="font-medium text-green-600">
                {statistics.totalTags > 0
                  ? Math.round(
                      ((statistics.totalTags - statistics.unusedTags) /
                        statistics.totalTags) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t('insights.contentCoverage')}
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('insights.totalContent')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {statistics.totalUsage}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('insights.avgPerTag')}
              </span>
              <span className="font-medium text-blue-600">
                {statistics.averageUsage.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('insights.coverage')}
              </span>
              <span className="font-medium text-green-600">
                {statistics.totalTags > 0 && statistics.totalUsage > 0
                  ? 'Good'
                  : 'Needs Improvement'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
