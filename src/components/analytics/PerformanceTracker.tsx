'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Select } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Clock,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  analyticsService,
  type ContentPerformanceMetrics,
  type PerformanceSnapshot,
} from '@/lib/services/analyticsService';

interface PerformanceTrackerProps {
  contentId: string;
  contentType: 'article' | 'news';
  title: string;
  publishedAt: string;
  authorId?: string;
}

interface ComparisonData {
  period: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export default function PerformanceTracker({
  contentId,
  contentType,
  title,
  publishedAt,
}: PerformanceTrackerProps) {
  const t = useTranslations('analytics');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ContentPerformanceMetrics | null>(
    null
  );

  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);

  useEffect(() => {
    loadPerformanceData();
  }, [contentId, contentType, selectedPeriod]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      const [metricsData, snapshotsData] = await Promise.all([
        analyticsService.getContentPerformanceMetrics(
          contentId,
          contentType,
          selectedPeriod
        ),
        analyticsService.getPerformanceSnapshots(
          contentId,
          contentType,
          'daily',
          30
        ),
      ]);

      setMetrics(metricsData);

      // Generate comparison data
      generateComparisonData(snapshotsData);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComparisonData = (snapshotsData: PerformanceSnapshot[]) => {
    if (snapshotsData.length < 14) return; // Need at least 2 weeks of data

    const midpoint = Math.floor(snapshotsData.length / 2);
    const currentPeriod = snapshotsData.slice(0, midpoint);
    const previousPeriod = snapshotsData.slice(midpoint);

    const currentViews = currentPeriod.reduce(
      (sum, s) => sum + s.totalViews,
      0
    );
    const previousViews = previousPeriod.reduce(
      (sum, s) => sum + s.totalViews,
      0
    );
    const viewsChange = currentViews - previousViews;
    const viewsChangePercent =
      previousViews > 0 ? (viewsChange / previousViews) * 100 : 0;

    const currentEngagement = currentPeriod.reduce(
      (sum, s) => sum + s.totalEngagement,
      0
    );
    const previousEngagement = previousPeriod.reduce(
      (sum, s) => sum + s.totalEngagement,
      0
    );
    const engagementChange = currentEngagement - previousEngagement;
    const engagementChangePercent =
      previousEngagement > 0
        ? (engagementChange / previousEngagement) * 100
        : 0;

    setComparisonData([
      {
        period: t('views'),
        current: currentViews,
        previous: previousViews,
        change: viewsChange,
        changePercent: viewsChangePercent,
      },
      {
        period: t('engagement'),
        current: currentEngagement,
        previous: previousEngagement,
        change: engagementChange,
        changePercent: engagementChangePercent,
      },
    ]);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noPerformanceData')}
        </h3>
        <p className="text-gray-500">{t('noPerformanceDataDescription')}</p>
      </div>
    );
  }

  const chartData = metrics.timeSeriesData.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    views: item.views,
    engagement: item.engagement,
    cumulativeViews: metrics.timeSeriesData
      .slice(0, metrics.timeSeriesData.indexOf(item) + 1)
      .reduce((sum, d) => sum + d.views, 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            {t('publishedOn')} {new Date(publishedAt).toLocaleDateString()} •{' '}
            {contentType === 'article' ? t('article') : t('news')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPeriod}
            onChange={e =>
              setSelectedPeriod(
                e.target.value as 'month' | 'week' | 'quarter' | 'year'
              )
            }
            className="w-32"
          >
            <option value="week">{t('week')}</option>
            <option value="month">{t('month')}</option>
            <option value="quarter">{t('quarter')}</option>
            <option value="year">{t('year')}</option>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalViews')}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.totalViews)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.uniqueViews)} {t('unique')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('engagementRate')}
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.engagementRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t('averageEngagement')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('readingTime')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(Math.round(metrics.averageReadingTime))}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completionRate.toFixed(1)}% {t('completion')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('trendingScore')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.trendingScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.performanceRank &&
                `#${metrics.performanceRank} ${t('inCategory')}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('performanceOverTime')}</CardTitle>
          <CardDescription>{t('viewsAndEngagementTrend')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="views"
                  stackId="1"
                  stroke="#00FF88"
                  fill="#00FF88"
                  fillOpacity={0.6}
                  name={t('dailyViews')}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stackId="2"
                  stroke="#FF6B6B"
                  fill="#FF6B6B"
                  fillOpacity={0.6}
                  name={t('dailyEngagement')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('engagementBreakdown')}</CardTitle>
            <CardDescription>{t('detailedEngagementMetrics')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{t('shareRate')}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {metrics.shareRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((metrics.shareRate / 100) * metrics.totalViews)}{' '}
                    {t('shares')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {t('bookmarkRate')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {metrics.bookmarkRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(
                      (metrics.bookmarkRate / 100) * metrics.totalViews
                    )}{' '}
                    {t('bookmarks')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">
                    {t('completionRate')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {metrics.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('averageScrollDepth')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>{t('performanceComparison')}</CardTitle>
            <CardDescription>{t('comparedToPreviousPeriod')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.period}</span>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatNumber(item.current)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('vs')} {formatNumber(item.previous)}
                      </div>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${getChangeColor(item.change)}`}
                    >
                      {getChangeIcon(item.change)}
                      <span className="text-sm font-medium">
                        {item.changePercent > 0 ? '+' : ''}
                        {item.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{t('performanceInsights')}</CardTitle>
          <CardDescription>{t('aiGeneratedInsights')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.engagementRate > 5 && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {t('highEngagement')}
                  </p>
                  <p className="text-xs text-green-600">
                    {t('highEngagementDescription')}
                  </p>
                </div>
              </div>
            )}

            {metrics.completionRate > 70 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {t('highCompletion')}
                  </p>
                  <p className="text-xs text-blue-600">
                    {t('highCompletionDescription')}
                  </p>
                </div>
              </div>
            )}

            {metrics.shareRate > 2 && (
              <div className="flex items-start space-x-2 p-3 bg-purple-50 rounded-lg">
                <Share2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    {t('viralPotential')}
                  </p>
                  <p className="text-xs text-purple-600">
                    {t('viralPotentialDescription')}
                  </p>
                </div>
              </div>
            )}

            {metrics.engagementRate < 1 && metrics.totalViews > 100 && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {t('improvementOpportunity')}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {t('improvementOpportunityDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
