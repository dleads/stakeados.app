'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
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
import { useRouter } from 'next/navigation';

interface ArticlePerformanceData {
  article: {
    id: string;
    title: string;
    slug: string;
    content: string;
    summary?: string;
    author: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    category?: {
      id: string;
      name: string;
      color?: string;
    };
    tags: string[];
    status: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    reading_time: number;
    language: string;
  };
  metrics: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    avgReadingTime: number;
    bounceRate: number;
    engagementRate: number;
    viewsGrowth: number;
    likesGrowth: number;
  };
  timeSeriesData: Array<{
    date: string;
    views: number;
    likes: number;
    shares: number;
    readingTime: number;
  }>;
  demographics: {
    topCountries: Array<{ country: string; views: number; percentage: number }>;
    deviceTypes: Array<{ device: string; views: number; percentage: number }>;
    referralSources: Array<{
      source: string;
      views: number;
      percentage: number;
    }>;
  };
  relatedArticles: Array<{
    id: string;
    title: string;
    views: number;
    similarity: number;
  }>;
}

interface ArticlePerformanceViewProps {
  articleId: string;
  className?: string;
}

export function ArticlePerformanceView({
  articleId,
  className,
}: ArticlePerformanceViewProps) {
  const t = useTranslations('admin.analytics');
  const router = useRouter();
  const [data, setData] = useState<ArticlePerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchArticlePerformance();
  }, [articleId, selectedPeriod]);

  const fetchArticlePerformance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/articles/${articleId}?days=${selectedPeriod}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch article performance data');
      }

      const performanceData = await response.json();
      setData(performanceData);
    } catch (err) {
      console.error('Article performance fetch error:', err);
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
              <Button onClick={fetchArticlePerformance} className="mt-2">
                {t('actions.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1"
            >
              ←
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('articlePerformance.title')}
            </h1>
          </div>
          <h2 className="text-lg text-gray-600 dark:text-gray-400 line-clamp-2">
            {data.article.title}
          </h2>
        </div>

        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Article Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('article.author')}
                </p>
                <p className="font-medium">{data.article.author.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('article.published')}
                </p>
                <p className="font-medium">
                  {data.article.published_at
                    ? new Date(data.article.published_at).toLocaleDateString()
                    : t('article.notPublished')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('article.readingTime')}
                </p>
                <p className="font-medium">
                  {data.article.reading_time} {t('article.minutes')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TagIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('article.category')}
                </p>
                <div className="flex items-center gap-2">
                  {data.article.category ? (
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: data.article.category.color + '20',
                      }}
                    >
                      {data.article.category.name}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">
                      {t('article.noCategory')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('metrics.totalViews')}
          value={data.metrics.totalViews}
          change={data.metrics.viewsGrowth}
          icon={EyeIcon}
        />

        <MetricCard
          title={t('metrics.totalLikes')}
          value={data.metrics.totalLikes}
          change={data.metrics.likesGrowth}
          icon={HeartIcon}
        />

        <MetricCard
          title={t('metrics.totalShares')}
          value={data.metrics.totalShares}
          change={0}
          icon={ShareIcon}
        />

        <MetricCard
          title={t('metrics.engagementRate')}
          value={data.metrics.engagementRate}
          change={0}
          icon={ChartBarIcon}
          isPercentage
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">{t('tabs.performance')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('tabs.engagement')}</TabsTrigger>
          <TabsTrigger value="demographics">
            {t('tabs.demographics')}
          </TabsTrigger>
          <TabsTrigger value="related">{t('tabs.related')}</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.performanceOverTime')}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                type="line"
                data={data.timeSeriesData.map(item => ({
                  name: new Date(item.date).toLocaleDateString(),
                  value: item.views,
                }))}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.engagementMetrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('metrics.avgReadingTime')}
                    </span>
                    <span className="font-medium">
                      {data.metrics.avgReadingTime.toFixed(1)}{' '}
                      {t('article.minutes')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('metrics.bounceRate')}
                    </span>
                    <span className="font-medium">
                      {data.metrics.bounceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('metrics.engagementRate')}
                    </span>
                    <span className="font-medium">
                      {data.metrics.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.readingTimeDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="bar"
                  data={data.timeSeriesData.map(item => ({
                    name: new Date(item.date).toLocaleDateString(),
                    value: item.readingTime,
                  }))}
                  isLoading={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.topCountries')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.topCountries.map((country, index) => (
                    <div
                      key={country.country}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {country.views}
                        </div>
                        <div className="text-xs text-gray-500">
                          {country.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.deviceTypes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="doughnut"
                  data={data.demographics.deviceTypes.map(device => ({
                    name: device.device,
                    value: device.views,
                  }))}
                  isLoading={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.referralSources')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.referralSources.map((source, index) => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {source.views}
                        </div>
                        <div className="text-xs text-gray-500">
                          {source.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="related" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.relatedArticles')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.relatedArticles.map((article, index) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {article.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('article.similarity')}:{' '}
                          {(article.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <EyeIcon className="h-4 w-4" />
                      {article.views}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  isPercentage?: boolean;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  isPercentage = false,
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <Icon className="h-8 w-8 text-gray-400" />
            {change !== 0 && (
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
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
