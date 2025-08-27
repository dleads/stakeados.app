'use client';

import { useTranslations } from 'next-intl';
import { Hash, TrendingUp, BarChart3, Sparkles } from 'lucide-react';
import type { TagWithUsage } from '@/lib/services/tagService';

interface TagStatsProps {
  popularTags: TagWithUsage[];
  trendingTags: TagWithUsage[];
}

export function TagStats({ popularTags, trendingTags }: TagStatsProps) {
  const t = useTranslations('admin.tags.stats');

  const totalTags = popularTags.length;
  const totalUsage = popularTags.reduce((sum, tag) => sum + tag.usage_count, 0);
  const averageUsage = totalTags > 0 ? Math.round(totalUsage / totalTags) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('totalTags')}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalTags}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Hash className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('totalUsage')}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalUsage}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('averageUsage')}
              </p>
              <p className="text-2xl font-bold text-gray-900">{averageUsage}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('trendingTags')}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {trendingTags.length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Popular and Trending Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Tags */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t('mostPopular')}
              </h3>
            </div>
          </div>
          <div className="p-6">
            {popularTags.length > 0 ? (
              <div className="space-y-3">
                {popularTags.slice(0, 8).map((tag, index) => {
                  const maxUsage = Math.max(
                    ...popularTags.map(t => t.usage_count)
                  );
                  const percentage =
                    maxUsage > 0 ? (tag.usage_count / maxUsage) * 100 : 0;

                  return (
                    <div key={tag.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 text-center">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            #{tag.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {tag.usage_count} {t('uses')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('noPopularTags')}
              </div>
            )}
          </div>
        </div>

        {/* Trending Tags */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t('trending')}
              </h3>
            </div>
          </div>
          <div className="p-6">
            {trendingTags.length > 0 ? (
              <div className="space-y-3">
                {trendingTags.slice(0, 8).map((tag, index) => {
                  const maxScore = Math.max(
                    ...trendingTags.map(t => t.trending_score)
                  );
                  const percentage =
                    maxScore > 0 ? (tag.trending_score / maxScore) * 100 : 0;

                  return (
                    <div key={tag.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 text-center">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            #{tag.name}
                          </span>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {tag.recent_usage} {t('recentUses')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {tag.trending_score.toFixed(2)} {t('trendScore')}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('noTrendingTags')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
