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

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import {
  Users,
  MousePointer,
  Clock,
  TrendingUp,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
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

interface UserEngagementAnalyticsProps {
  contentId?: string;
  contentType?: 'article' | 'news';
  userId?: string;
  timeRange?: 'day' | 'week' | 'month' | 'quarter';
}

interface EngagementMetrics {
  totalInteractions: number;
  uniqueUsers: number;
  averageSessionTime: number;
  bounceRate: number;
  conversionRate: number;
  returnVisitorRate: number;
  engagementByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    users: number;
    sessions: number;
    avgSessionTime: number;
  }>;
  userJourney: Array<{
    step: string;
    users: number;
    dropoffRate: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    interactions: number;
    uniqueUsers: number;
    sessions: number;
  }>;
}

interface ReadingBehavior {
  averageReadingTime: number;
  completionRate: number;
  scrollDepthDistribution: Array<{
    range: string;
    percentage: number;
  }>;
  exitPoints: Array<{
    section: string;
    percentage: number;
  }>;
  interactionHeatmap: Array<{
    section: string;
    clicks: number;
    highlights: number;
    shares: number;
  }>;
}

const COLORS = [
  '#00FF88',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFD93D',
  '#FF8C42',
];

export default function UserEngagementAnalytics({
  contentId,
  contentType,
  userId,
  timeRange = 'month',
}: UserEngagementAnalyticsProps) {
  const t = useTranslations('analytics');
  const [loading, setLoading] = useState(true);
  const [engagementMetrics, setEngagementMetrics] =
    useState<EngagementMetrics | null>(null);
  const [readingBehavior, setReadingBehavior] =
    useState<ReadingBehavior | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadEngagementData();
  }, [contentId, contentType, userId, selectedTimeRange]);

  const loadEngagementData = async () => {
    try {
      setLoading(true);

      // Simulate API calls - in real implementation, these would call the analytics service
      const mockEngagementMetrics: EngagementMetrics = {
        totalInteractions: 1247,
        uniqueUsers: 892,
        averageSessionTime: 245, // seconds
        bounceRate: 32.5,
        conversionRate: 8.7,
        returnVisitorRate: 24.3,
        engagementByType: [
          { type: 'views', count: 1247, percentage: 45.2 },
          { type: 'likes', count: 324, percentage: 11.7 },
          { type: 'shares', count: 156, percentage: 5.7 },
          { type: 'bookmarks', count: 89, percentage: 3.2 },
          { type: 'comments', count: 67, percentage: 2.4 },
        ],
        deviceBreakdown: [
          { device: 'Desktop', users: 456, sessions: 678, avgSessionTime: 312 },
          { device: 'Mobile', users: 324, sessions: 445, avgSessionTime: 198 },
          { device: 'Tablet', users: 112, sessions: 134, avgSessionTime: 267 },
        ],
        userJourney: [
          { step: 'Landing', users: 1000, dropoffRate: 0 },
          { step: 'Reading Start', users: 850, dropoffRate: 15 },
          { step: 'Mid Content', users: 650, dropoffRate: 23.5 },
          { step: 'Content End', users: 420, dropoffRate: 35.4 },
          { step: 'Engagement', users: 180, dropoffRate: 57.1 },
        ],
        timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(
            Date.now() - (29 - i) * 24 * 60 * 60 * 1000
          ).toLocaleDateString(),
          interactions: Math.floor(Math.random() * 100) + 20,
          uniqueUsers: Math.floor(Math.random() * 50) + 10,
          sessions: Math.floor(Math.random() * 80) + 15,
        })),
      };

      const mockReadingBehavior: ReadingBehavior = {
        averageReadingTime: 245,
        completionRate: 68.4,
        scrollDepthDistribution: [
          { range: '0-25%', percentage: 15.2 },
          { range: '25-50%', percentage: 22.8 },
          { range: '50-75%', percentage: 28.6 },
          { range: '75-100%', percentage: 33.4 },
        ],
        exitPoints: [
          { section: 'Introduction', percentage: 12.3 },
          { section: 'Main Content', percentage: 45.7 },
          { section: 'Conclusion', percentage: 28.9 },
          { section: 'Comments', percentage: 13.1 },
        ],
        interactionHeatmap: [
          { section: 'Title', clicks: 45, highlights: 12, shares: 8 },
          { section: 'Introduction', clicks: 78, highlights: 23, shares: 15 },
          { section: 'Main Content', clicks: 156, highlights: 67, shares: 34 },
          { section: 'Conclusion', clicks: 34, highlights: 18, shares: 12 },
        ],
      };

      setEngagementMetrics(mockEngagementMetrics);
      setReadingBehavior(mockReadingBehavior);
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  if (!engagementMetrics || !readingBehavior) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noDataTitle')}
        </h3>
        <p className="text-gray-500">{t('noDataDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            User Engagement Analytics
          </h1>
          <p className="text-gray-500">
            Detailed analysis of user interactions and behavior patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedTimeRange}
            onChange={e =>
              setSelectedTimeRange(
                e.target.value as 'month' | 'week' | 'quarter' | 'day'
              )
            }
            className="w-32"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interactions
            </CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(engagementMetrics.totalInteractions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(engagementMetrics.uniqueUsers)} unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Session Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(engagementMetrics.averageSessionTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {readingBehavior.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementMetrics.bounceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {engagementMetrics.returnVisitorRate.toFixed(1)}% return visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementMetrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Users who engaged</p>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Engagement Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>
                User interactions and sessions over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementMetrics.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="interactions"
                      stackId="1"
                      stroke="#00FF88"
                      fill="#00FF88"
                      fillOpacity={0.6}
                      name="Interactions"
                    />
                    <Area
                      type="monotone"
                      dataKey="uniqueUsers"
                      stackId="2"
                      stroke="#FF6B6B"
                      fill="#FF6B6B"
                      fillOpacity={0.6}
                      name="Unique Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Types</CardTitle>
                <CardDescription>
                  Distribution of different interaction types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementMetrics.engagementByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) =>
                          `${type} ${percentage.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {engagementMetrics.engagementByType.map((_, index) => (
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
                <CardTitle>Interaction Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of user interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engagementMetrics.engagementByType.map((item, index) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm font-medium capitalize">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(item.count)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          {/* Reading Behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scroll Depth Distribution</CardTitle>
                <CardDescription>
                  How far users scroll through the content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={readingBehavior.scrollDepthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#00FF88" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exit Points</CardTitle>
                <CardDescription>
                  Where users typically leave the content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {readingBehavior.exitPoints.map(point => (
                    <div
                      key={point.section}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {point.section}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${point.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {point.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interaction Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Interaction Heatmap</CardTitle>
              <CardDescription>
                User interactions by content section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={readingBehavior.interactionHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="section" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#00FF88" name="Clicks" />
                    <Bar
                      dataKey="highlights"
                      fill="#FF6B6B"
                      name="Highlights"
                    />
                    <Bar dataKey="shares" fill="#4ECDC4" name="Shares" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Device Usage</CardTitle>
              <CardDescription>
                User engagement across different devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {engagementMetrics.deviceBreakdown.map(device => {
                  const Icon =
                    device.device === 'Desktop'
                      ? Monitor
                      : device.device === 'Mobile'
                        ? Smartphone
                        : Tablet;

                  return (
                    <div
                      key={device.device}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{device.device}</h4>
                          <p className="text-sm text-gray-500">
                            {formatNumber(device.users)} users •{' '}
                            {formatNumber(device.sessions)} sessions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatTime(device.avgSessionTime)}
                        </div>
                        <p className="text-xs text-gray-500">avg session</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          {/* User Journey Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>User Journey Funnel</CardTitle>
              <CardDescription>
                How users progress through the content experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagementMetrics.userJourney.map((step, index) => (
                  <div key={step.step} className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{step.step}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {formatNumber(step.users)} users
                          </span>
                          {step.dropoffRate > 0 && (
                            <Badge variant="outline" className="text-red-600">
                              -{step.dropoffRate.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(step.users / engagementMetrics.userJourney[0].users) * 100}%`,
                          }}
                        />
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
