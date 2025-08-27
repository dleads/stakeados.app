'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  HeartIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnalyticsChart } from './AnalyticsChart';

interface EngagementData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    avgEngagementRate: number;
    avgSessionDuration: number;
    bounceRate: number;
    returnVisitorRate: number;
  };
  trends: {
    views: Array<{ date: string; count: number; change: number }>;
    likes: Array<{ date: string; count: number; change: number }>;
    shares: Array<{ date: string; count: number; change: number }>;
    engagementRate: Array<{ date: string; rate: number; change: number }>;
    sessionDuration: Array<{ date: string; duration: number; change: number }>;
  };
  contentPerformance: Array<{
    id: string;
    title: string;
    type: 'article' | 'news';
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
    avgReadingTime: number;
    bounceRate: number;
    published_at: string;
  }>;
  userBehavior: {
    deviceBreakdown: Array<{
      device: string;
      sessions: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    timeOfDayPatterns: Array<{
      hour: number;
      sessions: number;
      engagement: number;
    }>;
    dayOfWeekPatterns: Array<{
      day: number;
      sessions: number;
      engagement: number;
    }>;
    geographicDistribution: Array<{
      country: string;
      sessions: number;
      avgEngagement: number;
    }>;
  };
  engagementFunnel: {
    steps: Array<{
      name: string;
      users: number;
      conversionRate: number;
      dropoffRate: number;
    }>;
    conversionPaths: Array<{
      path: string[];
      users: number;
      conversionRate: number;
    }>;
  };
  cohortAnalysis: Array<{
    cohort: string;
    week0: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  }>;
}

interface EngagementMetricsVisualizationProps {
  className?: string;
}

export function EngagementMetricsVisualization({
  className,
}: EngagementMetricsVisualizationProps) {
  const t = useTranslations('admin.analytics');
  const [data, setData] = useState<EngagementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedContentType, setSelectedContentType] = useState('all');

  useEffect(() => {
    fetchEngagementData();
  }, [selectedPeriod, selectedContentType]);

  const fetchEngagementData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/engagement?days=${selectedPeriod}&content_type=${selectedContentType}&include_cohorts=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch engagement data');
      }

      const engagementData = await response.json();
      setData(engagementData);
    } catch (err) {
      console.error('Engagement data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={fetchEngagementData} className="mt-2">
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
            {t('engagement.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('engagement.subtitle')}
          </p>
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
            </SelectContent>
          </Select>

          <Select
            value={selectedContentType}
            onValueChange={setSelectedContentType}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('contentType.all')}</SelectItem>
              <SelectItem value="articles">
                {t('contentType.articles')}
              </SelectItem>
              <SelectItem value="news">{t('contentType.news')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EngagementMetricCard
          title={t('engagement.metrics.totalViews')}
          value={data?.overview.totalViews || 0}
          icon={EyeIcon}
          isLoading={isLoading}
        />

        <EngagementMetricCard
          title={t('engagement.metrics.totalLikes')}
          value={data?.overview.totalLikes || 0}
          icon={HeartIcon}
          isLoading={isLoading}
        />

        <EngagementMetricCard
          title={t('engagement.metrics.engagementRate')}
          value={data?.overview.avgEngagementRate || 0}
          icon={ChartBarIcon}
          isLoading={isLoading}
          isPercentage
        />

        <EngagementMetricCard
          title={t('engagement.metrics.avgSessionDuration')}
          value={data?.overview.avgSessionDuration || 0}
          icon={ClockIcon}
          isLoading={isLoading}
          isDuration
        />
      </div>

      {/* Engagement Analysis Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">{t('tabs.trends')}</TabsTrigger>
          <TabsTrigger value="content">
            {t('tabs.contentPerformance')}
          </TabsTrigger>
          <TabsTrigger value="behavior">{t('tabs.userBehavior')}</TabsTrigger>
          <TabsTrigger value="funnel">{t('tabs.engagementFunnel')}</TabsTrigger>
          <TabsTrigger value="cohorts">{t('tabs.cohortAnalysis')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeIcon className="h-5 w-5" />
                  {t('engagement.charts.viewsTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  data={
                    data?.trends.views.map(item => ({
                      name: new Date(item.date).toLocaleDateString(),
                      value: item.count,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartIcon className="h-5 w-5" />
                  {t('engagement.charts.likesTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  data={
                    data?.trends.likes.map(item => ({
                      name: new Date(item.date).toLocaleDateString(),
                      value: item.count,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  {t('engagement.charts.engagementRateTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  data={
                    data?.trends.engagementRate.map(item => ({
                      name: new Date(item.date).toLocaleDateString(),
                      value: item.rate,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  {t('engagement.charts.sessionDurationTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={
                    data?.trends.sessionDuration.map(item => ({
                      name: new Date(item.date).toLocaleDateString(),
                      value: item.duration,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('engagement.sections.topPerformingContent')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.contentPerformance
                    .slice(0, 20)
                    .map((content, index) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {content.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Badge variant="secondary" className="text-xs">
                                {content.type}
                              </Badge>
                              <span>
                                {new Date(
                                  content.published_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">
                              {content.views.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('metrics.views')}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{content.likes}</p>
                            <p className="text-xs text-gray-500">
                              {t('metrics.likes')}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">
                              {content.engagementRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('metrics.engagement')}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">
                              {content.avgReadingTime.toFixed(1)}m
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('metrics.readTime')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('engagement.charts.deviceBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="doughnut"
                  data={
                    data?.userBehavior.deviceBreakdown.map(device => ({
                      name: device.device,
                      value: device.sessions,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('engagement.charts.timeOfDayPatterns')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  data={
                    data?.userBehavior.timeOfDayPatterns.map(pattern => ({
                      name: `${pattern.hour}:00`,
                      value: pattern.sessions,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('engagement.charts.dayOfWeekPatterns')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={
                    data?.userBehavior.dayOfWeekPatterns.map(pattern => ({
                      name: t(`days.${pattern.day}`),
                      value: pattern.sessions,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('engagement.charts.geographicDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data?.userBehavior.geographicDistribution
                    .slice(0, 10)
                    .map((geo, index) => (
                      <div
                        key={geo.country}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="text-sm">{geo.country}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {geo.sessions.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {geo.avgEngagement.toFixed(1)}%{' '}
                            {t('metrics.engagement')}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5" />
                  {t('engagement.charts.engagementFunnel')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.engagementFunnel.steps.map((step, index) => (
                    <div key={step.name} className="relative">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {step.users.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {step.conversionRate.toFixed(1)}%{' '}
                            {t('metrics.conversion')}
                          </div>
                        </div>
                      </div>
                      {index < data.engagementFunnel.steps.length - 1 && (
                        <div className="flex justify-center mt-2">
                          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            {step.dropoffRate.toFixed(1)}%{' '}
                            {t('metrics.dropoff')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('engagement.sections.conversionPaths')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.engagementFunnel.conversionPaths
                    .slice(0, 10)
                    .map((path, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {path.users} {t('metrics.users')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {path.conversionRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {path.path.map((step, stepIndex) => (
                            <React.Fragment key={stepIndex}>
                              <Badge variant="secondary" className="text-xs">
                                {step}
                              </Badge>
                              {stepIndex < path.path.length - 1 && (
                                <span className="text-gray-400">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('engagement.charts.cohortAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b">
                          {t('engagement.cohort.period')}
                        </th>
                        <th className="text-center p-2 border-b">
                          {t('engagement.cohort.week0')}
                        </th>
                        <th className="text-center p-2 border-b">
                          {t('engagement.cohort.week1')}
                        </th>
                        <th className="text-center p-2 border-b">
                          {t('engagement.cohort.week2')}
                        </th>
                        <th className="text-center p-2 border-b">
                          {t('engagement.cohort.week3')}
                        </th>
                        <th className="text-center p-2 border-b">
                          {t('engagement.cohort.week4')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.cohortAnalysis.map(cohort => (
                        <tr key={cohort.cohort}>
                          <td className="p-2 font-medium">{cohort.cohort}</td>
                          <td className="text-center p-2">
                            <div className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">
                              {cohort.week0}%
                            </div>
                          </td>
                          <td className="text-center p-2">
                            <div
                              className={`inline-block px-2 py-1 rounded text-sm ${
                                cohort.week1 >= 50
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : cohort.week1 >= 25
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : 'bg-red-100 dark:bg-red-900/30'
                              }`}
                            >
                              {cohort.week1}%
                            </div>
                          </td>
                          <td className="text-center p-2">
                            <div
                              className={`inline-block px-2 py-1 rounded text-sm ${
                                cohort.week2 >= 40
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : cohort.week2 >= 20
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : 'bg-red-100 dark:bg-red-900/30'
                              }`}
                            >
                              {cohort.week2}%
                            </div>
                          </td>
                          <td className="text-center p-2">
                            <div
                              className={`inline-block px-2 py-1 rounded text-sm ${
                                cohort.week3 >= 30
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : cohort.week3 >= 15
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : 'bg-red-100 dark:bg-red-900/30'
                              }`}
                            >
                              {cohort.week3}%
                            </div>
                          </td>
                          <td className="text-center p-2">
                            <div
                              className={`inline-block px-2 py-1 rounded text-sm ${
                                cohort.week4 >= 25
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : cohort.week4 >= 10
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                    : 'bg-red-100 dark:bg-red-900/30'
                              }`}
                            >
                              {cohort.week4}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EngagementMetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
  isPercentage?: boolean;
  isDuration?: boolean;
}

function EngagementMetricCard({
  title,
  value,
  icon: Icon,
  isLoading,
  isPercentage = false,
  isDuration = false,
}: EngagementMetricCardProps) {
  const formatValue = (val: number) => {
    if (isDuration) {
      const minutes = Math.floor(val / 60);
      const seconds = val % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    if (isPercentage) {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

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
                {formatValue(value)}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}
