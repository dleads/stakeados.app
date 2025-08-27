'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  NewspaperIcon,
  EyeIcon,
  HeartIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsChart } from './AnalyticsChart';
import { TrendAnalysisChart } from './TrendAnalysisChart';
import { ExportDialog } from './ExportDialog';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';

interface ContentAnalyticsDashboardProps {
  className?: string;
}

export function ContentAnalyticsDashboard({
  className,
}: ContentAnalyticsDashboardProps) {
  const t = useTranslations('admin.analytics');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedGranularity, setSelectedGranularity] = useState('daily');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const {
    dashboardData,
    trendsData,
    isLoading,
    error,
    refreshData,
    exportData,
  } = useAnalyticsDashboard({
    period: parseInt(selectedPeriod),
    granularity: selectedGranularity,
  });

  const handleExport = async (exportConfig: any) => {
    try {
      await exportData(exportConfig);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{t('error.loadFailed')}</p>
              <Button onClick={refreshData} className="mt-2">
                {t('actions.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('periods.week')}</SelectItem>
              <SelectItem value="30">{t('periods.month')}</SelectItem>
              <SelectItem value="90">{t('periods.quarter')}</SelectItem>
              <SelectItem value="365">{t('periods.year')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('actions.export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('metrics.totalArticles')}
          value={dashboardData?.articles?.total || 0}
          change={dashboardData?.growth?.articlesGrowth || 0}
          icon={DocumentTextIcon}
          isLoading={isLoading}
        />

        <MetricCard
          title={t('metrics.totalNews')}
          value={dashboardData?.news?.total || 0}
          change={dashboardData?.growth?.newsGrowth || 0}
          icon={NewspaperIcon}
          isLoading={isLoading}
        />

        <MetricCard
          title={t('metrics.totalViews')}
          value={dashboardData?.articles?.totalViews || 0}
          change={0} // Views growth would need additional calculation
          icon={EyeIcon}
          isLoading={isLoading}
        />

        <MetricCard
          title={t('metrics.totalLikes')}
          value={dashboardData?.articles?.totalLikes || 0}
          change={0} // Likes growth would need additional calculation
          icon={HeartIcon}
          isLoading={isLoading}
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="content">{t('tabs.content')}</TabsTrigger>
          <TabsTrigger value="trends">{t('tabs.trends')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('tabs.engagement')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  {t('charts.contentDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="pie"
                  data={[
                    {
                      name: t('content.published'),
                      value: dashboardData?.articles?.published || 0,
                    },
                    {
                      name: t('content.draft'),
                      value: dashboardData?.articles?.draft || 0,
                    },
                    {
                      name: t('content.review'),
                      value: dashboardData?.articles?.review || 0,
                    },
                  ]}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sections.recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    dashboardData?.recentActivity
                      ?.slice(0, 5)
                      .map((activity: any) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.article?.title ||
                                t('activity.unknownArticle')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.change_type} •{' '}
                              {activity.changed_by?.full_name}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.topPerforming')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  dashboardData?.topPerformingContent?.map(
                    (content: any, index: number) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {content.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                content.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <EyeIcon className="h-4 w-4" />
                            {content.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <HeartIcon className="h-4 w-4" />
                            {content.likes || 0}
                          </span>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Articles vs News Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.contentComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={[
                    {
                      name: t('content.articles'),
                      value: dashboardData?.articles?.total || 0,
                    },
                    {
                      name: t('content.news'),
                      value: dashboardData?.news?.total || 0,
                    },
                  ]}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.categoryDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="doughnut"
                  data={
                    dashboardData?.categories?.topCategories?.map(
                      (cat: any) => ({
                        name: cat.name,
                        value: cat.totalContent,
                      })
                    ) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('charts.contentTrends')}</CardTitle>
                <Select
                  value={selectedGranularity}
                  onValueChange={setSelectedGranularity}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      {t('granularity.daily')}
                    </SelectItem>
                    <SelectItem value="weekly">
                      {t('granularity.weekly')}
                    </SelectItem>
                    <SelectItem value="monthly">
                      {t('granularity.monthly')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <TrendAnalysisChart
                data={trendsData?.timeSeries || []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.trendingTopics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {isLoading
                  ? [...Array(10)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                      </div>
                    ))
                  : trendsData?.trendingTopics
                      ?.slice(0, 20)
                      .map((topic: any) => (
                        <Badge
                          key={topic.keyword}
                          variant="secondary"
                          className="text-xs"
                        >
                          {topic.keyword} ({topic.mentions})
                        </Badge>
                      ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.engagementPatterns')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  data={
                    trendsData?.engagementPatterns?.hourlyDistribution?.map(
                      (count: number, hour: number) => ({
                        name: `${hour}:00`,
                        value: count,
                      })
                    ) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Weekly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.weeklyDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={
                    trendsData?.engagementPatterns?.weeklyDistribution?.map(
                      (count: number, day: number) => ({
                        name: t(`days.${day}`),
                        value: count,
                      })
                    ) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  isLoading,
}: MetricCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-2"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {value.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <Icon className="h-8 w-8 text-gray-400" />
            {!isLoading && change !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  isPositive
                    ? 'text-green-600'
                    : isNegative
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                {isPositive ? (
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                ) : isNegative ? (
                  <ArrowTrendingDownIcon className="h-3 w-3" />
                ) : null}
                {Math.abs(change)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
