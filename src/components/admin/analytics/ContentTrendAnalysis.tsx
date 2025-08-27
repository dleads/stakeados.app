'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TagIcon,
  DocumentTextIcon,
  NewspaperIcon,
  EyeIcon,
  HeartIcon,
  ArrowPathIcon,
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

interface TrendData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
    granularity: string;
  };
  contentTrends: {
    articles: {
      created: Array<{ date: string; count: number }>;
      published: Array<{ date: string; count: number }>;
      views: Array<{ date: string; count: number }>;
      engagement: Array<{ date: string; rate: number }>;
    };
    news: {
      created: Array<{ date: string; count: number }>;
      processed: Array<{ date: string; count: number }>;
      trending: Array<{ date: string; score: number }>;
    };
  };
  categoryTrends: Array<{
    id: string;
    name: string;
    color?: string;
    articlesCount: number;
    newsCount: number;
    totalViews: number;
    growthRate: number;
    trendDirection: 'up' | 'down' | 'stable';
  }>;
  topicTrends: Array<{
    keyword: string;
    mentions: number;
    growth: number;
    categories: string[];
    relevanceScore: number;
  }>;
  seasonalPatterns: {
    hourlyDistribution: Array<{
      hour: number;
      articles: number;
      news: number;
      engagement: number;
    }>;
    weeklyDistribution: Array<{
      day: number;
      articles: number;
      news: number;
      engagement: number;
    }>;
    monthlyDistribution: Array<{
      month: number;
      articles: number;
      news: number;
      engagement: number;
    }>;
  };
  predictiveInsights: {
    nextWeekPrediction: {
      expectedArticles: number;
      expectedNews: number;
      expectedViews: number;
      confidence: number;
    };
    trendingTopics: Array<{
      topic: string;
      predictedGrowth: number;
      currentMentions: number;
    }>;
    contentGaps: Array<{
      category: string;
      suggestedTopics: string[];
      potentialViews: number;
    }>;
  };
}

interface ContentTrendAnalysisProps {
  className?: string;
}

export function ContentTrendAnalysis({ className }: ContentTrendAnalysisProps) {
  const t = useTranslations('admin.analytics');
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedGranularity, setSelectedGranularity] = useState('daily');
  const [selectedContentType, setSelectedContentType] = useState('all');

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod, selectedGranularity, selectedContentType]);

  const fetchTrendData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/trends?days=${selectedPeriod}&granularity=${selectedGranularity}&content_type=${selectedContentType}&include_predictions=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trend data');
      }

      const trendData = await response.json();
      setData(trendData);
    } catch (err) {
      console.error('Trend data fetch error:', err);
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
              <Button onClick={fetchTrendData} className="mt-2">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
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
            {t('trendAnalysis.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('trendAnalysis.subtitle')}
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
              <SelectItem value="365">{t('periods.year')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedGranularity}
            onValueChange={setSelectedGranularity}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">{t('granularity.hourly')}</SelectItem>
              <SelectItem value="daily">{t('granularity.daily')}</SelectItem>
              <SelectItem value="weekly">{t('granularity.weekly')}</SelectItem>
              <SelectItem value="monthly">
                {t('granularity.monthly')}
              </SelectItem>
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

      {/* Predictive Insights */}
      {data?.predictiveInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5" />
              {t('trendAnalysis.predictiveInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('predictions.nextWeekArticles')}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.predictiveInsights.nextWeekPrediction.expectedArticles}
                </p>
                <p className="text-xs text-gray-500">
                  {data.predictiveInsights.nextWeekPrediction.confidence}%{' '}
                  {t('predictions.confidence')}
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('predictions.nextWeekNews')}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.predictiveInsights.nextWeekPrediction.expectedNews}
                </p>
                <p className="text-xs text-gray-500">
                  {data.predictiveInsights.nextWeekPrediction.confidence}%{' '}
                  {t('predictions.confidence')}
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('predictions.nextWeekViews')}
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data.predictiveInsights.nextWeekPrediction.expectedViews.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {data.predictiveInsights.nextWeekPrediction.confidence}%{' '}
                  {t('predictions.confidence')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Trend Analysis */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">{t('tabs.contentTrends')}</TabsTrigger>
          <TabsTrigger value="categories">
            {t('tabs.categoryTrends')}
          </TabsTrigger>
          <TabsTrigger value="topics">{t('tabs.topicTrends')}</TabsTrigger>
          <TabsTrigger value="patterns">
            {t('tabs.seasonalPatterns')}
          </TabsTrigger>
          <TabsTrigger value="gaps">{t('tabs.contentGaps')}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    {t('charts.articleCreationTrend')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart
                    type="line"
                    data={
                      data?.contentTrends.articles.created.map(item => ({
                        name: new Date(item.date).toLocaleDateString(),
                        value: item.count,
                      })) || []
                    }
                    isLoading={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NewspaperIcon className="h-5 w-5" />
                    {t('charts.newsProcessingTrend')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart
                    type="line"
                    data={
                      data?.contentTrends.news.processed.map(item => ({
                        name: new Date(item.date).toLocaleDateString(),
                        value: item.count,
                      })) || []
                    }
                    isLoading={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    {t('charts.viewsTrend')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart
                    type="line"
                    data={
                      data?.contentTrends.articles.views.map(item => ({
                        name: new Date(item.date).toLocaleDateString(),
                        value: item.count,
                      })) || []
                    }
                    isLoading={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartIcon className="h-5 w-5" />
                    {t('charts.engagementTrend')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart
                    type="line"
                    data={
                      data?.contentTrends.articles.engagement.map(item => ({
                        name: new Date(item.date).toLocaleDateString(),
                        value: item.rate,
                      })) || []
                    }
                    isLoading={false}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.categoryPerformance')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.categoryTrends.map(category => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          {category.name}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {category.trendDirection === 'up' ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                          ) : category.trendDirection === 'down' ? (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
                          )}
                          <span
                            className={`text-sm ${
                              category.trendDirection === 'up'
                                ? 'text-green-600'
                                : category.trendDirection === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {category.growthRate > 0 ? '+' : ''}
                            {category.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="text-center">
                          <p className="font-medium">
                            {category.articlesCount}
                          </p>
                          <p className="text-xs">{t('content.articles')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{category.newsCount}</p>
                          <p className="text-xs">{t('content.news')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">
                            {category.totalViews.toLocaleString()}
                          </p>
                          <p className="text-xs">{t('metrics.views')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="h-5 w-5" />
                {t('sections.trendingTopics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.topicTrends.slice(0, 12).map((topic, index) => (
                    <div
                      key={topic.keyword}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            topic.growth > 0
                              ? 'text-green-600'
                              : topic.growth < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {topic.growth > 0 ? (
                            <ArrowTrendingUpIcon className="h-3 w-3" />
                          ) : topic.growth < 0 ? (
                            <ArrowTrendingDownIcon className="h-3 w-3" />
                          ) : null}
                          {topic.growth > 0 ? '+' : ''}
                          {topic.growth.toFixed(1)}%
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {topic.keyword}
                      </h4>

                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {topic.mentions} {t('topics.mentions')}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {topic.categories.slice(0, 3).map(category => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                        {topic.categories.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{topic.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.hourlyPatterns')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={
                    data?.seasonalPatterns.hourlyDistribution.map(item => ({
                      name: `${item.hour}:00`,
                      value: item.articles,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.weeklyPatterns')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  data={
                    data?.seasonalPatterns.weeklyDistribution.map(item => ({
                      name: t(`days.${item.day}`),
                      value: item.articles,
                    })) || []
                  }
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.contentGaps')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.predictiveInsights.contentGaps.map(gap => (
                    <div
                      key={gap.category}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {gap.category}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {gap.potentialViews.toLocaleString()}{' '}
                          {t('predictions.potentialViews')}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {gap.suggestedTopics.map(topic => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
