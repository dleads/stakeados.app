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
// TODO: Use Button when implementing content analytics dashboard
// import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import {
  Eye,
  Heart,
  Clock,
  TrendingUp,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  analyticsService,
  type ContentPerformanceMetrics,
  type ContentAnalytics,
  type TrendingContent,
} from '@/lib/services/analyticsService';

interface ContentAnalyticsDashboardProps {
  userId: string;
  isAuthor?: boolean;
  contentId?: string;
  contentType?: 'article' | 'news';
}

interface DashboardStats {
  totalViews: number;
  totalEngagement: number;
  trendingContent: TrendingContent[];
  topPerforming: Array<ContentAnalytics & { title: string }>;
  recentAnalytics: ContentAnalytics[];
}

const COLORS = [
  '#00FF88',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFD93D',
  '#FF8C42',
];

export default function ContentAnalyticsDashboard({
  userId,
  isAuthor = false,
  contentId,
  contentType,
}: ContentAnalyticsDashboardProps) {
  const t = useTranslations('analytics');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [performanceMetrics, setPerformanceMetrics] =
    useState<ContentPerformanceMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [userId, isAuthor, selectedPeriod]);

  useEffect(() => {
    if (contentId && contentType) {
      loadContentMetrics();
    }
  }, [contentId, contentType, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardData(userId, isAuthor);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentMetrics = async () => {
    if (!contentId || !contentType) return;

    try {
      const metrics = await analyticsService.getContentPerformanceMetrics(
        contentId,
        contentType,
        selectedPeriod
      );
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to load content metrics:', error);
    }
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

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
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

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noDataTitle')}
        </h3>
        <p className="text-gray-500">{t('noDataDescription')}</p>
      </div>
    );
  }

  const engagementData = dashboardData.recentAnalytics.map(analytics => ({
    date: new Date(analytics.date).toLocaleDateString(),
    views: analytics.views,
    likes: analytics.likes,
    shares: analytics.shares,
    bookmarks: analytics.bookmarks,
    engagement:
      analytics.likes +
      analytics.shares +
      analytics.bookmarks +
      analytics.comments,
  }));

  const deviceData = dashboardData.recentAnalytics.reduce(
    (acc, analytics) => {
      Object.entries(analytics.deviceData).forEach(([device, count]) => {
        acc[device] = (acc[device] || 0) + (count as number);
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const deviceChartData = Object.entries(deviceData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {contentId ? t('contentAnalytics') : t('dashboard')}
          </h1>
          <p className="text-gray-500">
            {isAuthor
              ? t('authorDashboardDescription')
              : t('dashboardDescription')}
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
              {formatNumber(
                performanceMetrics?.totalViews || dashboardData.totalViews
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics?.uniqueViews && (
                <>
                  {formatNumber(performanceMetrics.uniqueViews)}{' '}
                  {t('uniqueViews')}
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('engagement')}
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.totalEngagement)}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics?.engagementRate && (
                <>
                  {performanceMetrics.engagementRate.toFixed(1)}%{' '}
                  {t('engagementRate')}
                </>
              )}
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
              {performanceMetrics?.averageReadingTime
                ? formatTime(Math.round(performanceMetrics.averageReadingTime))
                : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics?.completionRate && (
                <>
                  {performanceMetrics.completionRate.toFixed(1)}%{' '}
                  {t('completionRate')}
                </>
              )}
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
              {performanceMetrics?.trendingScore?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics?.performanceRank && (
                <>
                  #{performanceMetrics.performanceRank} {t('inCategory')}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="performance">{t('performance')}</TabsTrigger>
          <TabsTrigger value="audience">{t('audience')}</TabsTrigger>
          <TabsTrigger value="trending">{t('trending')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('performanceOverTime')}</CardTitle>
              <CardDescription>{t('viewsAndEngagementTrend')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={performanceMetrics?.timeSeriesData || engagementData}
                  >
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
                      name={t('views')}
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stackId="2"
                      stroke="#FF6B6B"
                      fill="#FF6B6B"
                      fillOpacity={0.6}
                      name={t('engagement')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>{t('topPerformingContent')}</CardTitle>
              <CardDescription>
                {t('bestPerformingContentDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.topPerforming.map((content, index) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(content.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{formatNumber(content.views)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{formatNumber(content.likes)}</span>
                      </div>
                      <Badge variant="secondary">
                        {content.engagementScore.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Engagement Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('engagementBreakdown')}</CardTitle>
                <CardDescription>
                  {t('engagementTypesDistribution')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="likes" fill="#FF6B6B" name={t('likes')} />
                      <Bar dataKey="shares" fill="#4ECDC4" name={t('shares')} />
                      <Bar
                        dataKey="bookmarks"
                        fill="#FFD93D"
                        name={t('bookmarks')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('performanceMetrics')}</CardTitle>
                <CardDescription>
                  {t('keyPerformanceIndicators')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('shareRate')}
                    </span>
                    <span className="text-sm">
                      {performanceMetrics?.shareRate?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('bookmarkRate')}
                    </span>
                    <span className="text-sm">
                      {performanceMetrics?.bookmarkRate?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('completionRate')}
                    </span>
                    <span className="text-sm">
                      {performanceMetrics?.completionRate?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('engagementRate')}
                    </span>
                    <span className="text-sm">
                      {performanceMetrics?.engagementRate?.toFixed(2) || '0.00'}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          {/* Device Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('deviceDistribution')}</CardTitle>
                <CardDescription>
                  {t('audienceDevicePreferences')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('readingBehavior')}</CardTitle>
                <CardDescription>
                  {t('audienceEngagementPatterns')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('averageReadingTime')}
                    </span>
                    <span className="text-sm">
                      {performanceMetrics?.averageReadingTime
                        ? formatTime(
                            Math.round(performanceMetrics.averageReadingTime)
                          )
                        : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('completionRate')}
                    </span>
                    <span className="text-sm">
                      {performanceMetrics?.completionRate?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('returnVisitors')}
                    </span>
                    <span className="text-sm">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t('socialShares')}
                    </span>
                    <span className="text-sm">
                      {dashboardData.recentAnalytics.reduce(
                        (sum, a) => sum + a.shares,
                        0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          {/* Trending Content */}
          <Card>
            <CardHeader>
              <CardTitle>{t('trendingContent')}</CardTitle>
              <CardDescription>{t('currentlyTrendingContent')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.trendingContent.map(content => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            #{content.rankPosition}
                          </Badge>
                          {content.category && (
                            <Badge variant="secondary">
                              {content.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('trendingFor')} {content.trendingDuration}{' '}
                          {t('days')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {content.trendingScore.toFixed(1)}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          {getTrendIcon(content.rankChange)}
                          <span>{Math.abs(content.rankChange)}</span>
                        </div>
                      </div>
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
