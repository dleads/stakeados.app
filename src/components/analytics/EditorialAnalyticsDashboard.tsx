'use client';

import { useState, useEffect } from 'react';
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
  FileText,
  Users,
  Clock,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Lightbulb,
  Star,
  MessageSquare,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface EditorialAnalyticsDashboardProps {
  editorId?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface EditorialMetrics {
  articlesReviewed: number;
  articlesApproved: number;
  articlesRejected: number;
  averageReviewTime: number;
  qualityScore: number;
  feedbackQualityRating: number;
  proposalsProcessed: number;
  contentModerated: number;
  productivityTrend: Array<{
    date: string;
    reviewed: number;
    approved: number;
    rejected: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    approvalRate: number;
  }>;
  authorPerformance: Array<{
    authorId: string;
    authorName: string;
    articlesSubmitted: number;
    approvalRate: number;
    averageQuality: number;
  }>;
  reviewTimeDistribution: Array<{
    timeRange: string;
    count: number;
  }>;
  qualityMetrics: {
    grammar: number;
    structure: number;
    accuracy: number;
    guidelines: number;
    seo: number;
    readability: number;
  };
}

interface ContentGapAnalysis {
  suggestedTopics: Array<{
    topic: string;
    demand: number;
    competition: number;
    opportunity: number;
    keywords: string[];
  }>;
  trendingTopics: Array<{
    topic: string;
    growth: number;
    articles: number;
    engagement: number;
  }>;
  contentCalendar: Array<{
    date: string;
    suggestedContent: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface AuthorInsights {
  topAuthors: Array<{
    authorId: string;
    authorName: string;
    articlesPublished: number;
    totalViews: number;
    averageEngagement: number;
    qualityScore: number;
    specialties: string[];
  }>;
  authorGrowth: Array<{
    authorId: string;
    authorName: string;
    monthlyGrowth: number;
    engagementTrend: number;
    potentialRating: number;
  }>;
  recognitionSuggestions: Array<{
    authorId: string;
    authorName: string;
    achievement: string;
    reason: string;
    impact: number;
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

export default function EditorialAnalyticsDashboard({
  editorId,
  timeRange = 'month',
}: EditorialAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [editorialMetrics, setEditorialMetrics] =
    useState<EditorialMetrics | null>(null);
  const [contentGapAnalysis, setContentGapAnalysis] =
    useState<ContentGapAnalysis | null>(null);
  const [authorInsights, setAuthorInsights] = useState<AuthorInsights | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadEditorialData();
  }, [editorId, selectedTimeRange]);

  const loadEditorialData = async () => {
    try {
      setLoading(true);

      // Mock data - in real implementation, these would call the analytics service
      const mockEditorialMetrics: EditorialMetrics = {
        articlesReviewed: 156,
        articlesApproved: 134,
        articlesRejected: 22,
        averageReviewTime: 2.4, // hours
        qualityScore: 8.7,
        feedbackQualityRating: 4.3,
        proposalsProcessed: 89,
        contentModerated: 45,
        productivityTrend: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(
            Date.now() - (29 - i) * 24 * 60 * 60 * 1000
          ).toLocaleDateString(),
          reviewed: Math.floor(Math.random() * 10) + 2,
          approved: Math.floor(Math.random() * 8) + 1,
          rejected: Math.floor(Math.random() * 3),
        })),
        categoryBreakdown: [
          { category: 'DeFi', count: 45, approvalRate: 89.2 },
          { category: 'NFTs', count: 32, approvalRate: 84.6 },
          { category: 'Base', count: 28, approvalRate: 92.1 },
          { category: 'Trading', count: 25, approvalRate: 76.8 },
          { category: 'Technology', count: 18, approvalRate: 88.9 },
          { category: 'Regulation', count: 8, approvalRate: 75.0 },
        ],
        authorPerformance: [
          {
            authorId: '1',
            authorName: 'Alice Johnson',
            articlesSubmitted: 12,
            approvalRate: 91.7,
            averageQuality: 8.9,
          },
          {
            authorId: '2',
            authorName: 'Bob Smith',
            articlesSubmitted: 8,
            approvalRate: 87.5,
            averageQuality: 8.2,
          },
          {
            authorId: '3',
            authorName: 'Carol Davis',
            articlesSubmitted: 15,
            approvalRate: 93.3,
            averageQuality: 9.1,
          },
          {
            authorId: '4',
            authorName: 'David Wilson',
            articlesSubmitted: 6,
            approvalRate: 83.3,
            averageQuality: 7.8,
          },
        ],
        reviewTimeDistribution: [
          { timeRange: '< 1 hour', count: 23 },
          { timeRange: '1-2 hours', count: 45 },
          { timeRange: '2-4 hours', count: 67 },
          { timeRange: '4-8 hours', count: 34 },
          { timeRange: '> 8 hours', count: 12 },
        ],
        qualityMetrics: {
          grammar: 8.9,
          structure: 8.4,
          accuracy: 9.1,
          guidelines: 8.7,
          seo: 7.8,
          readability: 8.2,
        },
      };

      const mockContentGapAnalysis: ContentGapAnalysis = {
        suggestedTopics: [
          {
            topic: 'Base Layer 2 Scaling',
            demand: 85,
            competition: 32,
            opportunity: 78,
            keywords: ['base network', 'layer 2', 'scaling', 'ethereum'],
          },
          {
            topic: 'DeFi Yield Farming Strategies',
            demand: 92,
            competition: 67,
            opportunity: 65,
            keywords: ['yield farming', 'defi', 'liquidity', 'rewards'],
          },
          {
            topic: 'NFT Utility and Gaming',
            demand: 78,
            competition: 45,
            opportunity: 72,
            keywords: ['nft utility', 'gaming', 'play to earn', 'metaverse'],
          },
        ],
        trendingTopics: [
          {
            topic: 'AI in Crypto',
            growth: 156.7,
            articles: 8,
            engagement: 4.2,
          },
          {
            topic: 'Regulatory Updates',
            growth: 89.3,
            articles: 12,
            engagement: 3.8,
          },
          {
            topic: 'Base Ecosystem',
            growth: 234.5,
            articles: 15,
            engagement: 5.1,
          },
        ],
        contentCalendar: [
          {
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            suggestedContent: ['Base Network Tutorial', 'DeFi Security Guide'],
            priority: 'high',
          },
          {
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            suggestedContent: ['NFT Market Analysis', 'Trading Psychology'],
            priority: 'medium',
          },
        ],
      };

      const mockAuthorInsights: AuthorInsights = {
        topAuthors: [
          {
            authorId: '1',
            authorName: 'Alice Johnson',
            articlesPublished: 24,
            totalViews: 45678,
            averageEngagement: 8.9,
            qualityScore: 9.2,
            specialties: ['DeFi', 'Base Network'],
          },
          {
            authorId: '2',
            authorName: 'Carol Davis',
            articlesPublished: 18,
            totalViews: 38945,
            averageEngagement: 8.4,
            qualityScore: 8.8,
            specialties: ['NFTs', 'Gaming'],
          },
        ],
        authorGrowth: [
          {
            authorId: '3',
            authorName: 'Bob Smith',
            monthlyGrowth: 45.6,
            engagementTrend: 23.4,
            potentialRating: 8.7,
          },
        ],
        recognitionSuggestions: [
          {
            authorId: '1',
            authorName: 'Alice Johnson',
            achievement: 'Top Contributor Badge',
            reason: 'Consistently high-quality DeFi content',
            impact: 9.2,
          },
        ],
      };

      setEditorialMetrics(mockEditorialMetrics);
      setContentGapAnalysis(mockContentGapAnalysis);
      setAuthorInsights(mockAuthorInsights);
    } catch (error) {
      console.error('Failed to load editorial data:', error);
    } finally {
      setLoading(false);
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

  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
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

  if (!editorialMetrics || !contentGapAnalysis || !authorInsights) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Editorial Data
        </h3>
        <p className="text-gray-500">
          Editorial analytics will appear here once content review activity
          begins
        </p>
      </div>
    );
  }

  const approvalRate =
    editorialMetrics.articlesReviewed > 0
      ? (editorialMetrics.articlesApproved /
          editorialMetrics.articlesReviewed) *
        100
      : 0;

  const qualityRadarData = Object.entries(editorialMetrics.qualityMetrics).map(
    ([key, value]) => ({
      metric: key.charAt(0).toUpperCase() + key.slice(1),
      score: value,
      fullMark: 10,
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Editorial Analytics & Insights
          </h1>
          <p className="text-gray-500">
            Content performance metrics and editorial team insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedTimeRange}
            onChange={e =>
              setSelectedTimeRange(
                e.target.value as 'month' | 'week' | 'quarter' | 'year'
              )
            }
            className="w-32"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Articles Reviewed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {editorialMetrics.articlesReviewed}
            </div>
            <p className="text-xs text-muted-foreground">
              {approvalRate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Review Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(editorialMetrics.averageReviewTime)}
            </div>
            <p className="text-xs text-muted-foreground">Per article review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {editorialMetrics.qualityScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 10.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feedback Rating
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {editorialMetrics.feedbackQualityRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Author satisfaction</p>
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
          <TabsTrigger value="content-gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Productivity Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Editorial Productivity</CardTitle>
              <CardDescription>
                Daily review activity and approval trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={editorialMetrics.productivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="reviewed"
                      stackId="1"
                      stroke="#00FF88"
                      fill="#00FF88"
                      fillOpacity={0.6}
                      name="Reviewed"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="2"
                      stroke="#4ECDC4"
                      fill="#4ECDC4"
                      fillOpacity={0.6}
                      name="Approved"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      stackId="3"
                      stroke="#FF6B6B"
                      fill="#FF6B6B"
                      fillOpacity={0.6}
                      name="Rejected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance and Quality Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Approval rates by content category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {editorialMetrics.categoryBreakdown.map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm font-medium">
                          {category.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {category.count} articles
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.approvalRate.toFixed(1)}% approved
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  Content quality assessment breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={qualityRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} />
                      <Radar
                        name="Quality Score"
                        dataKey="score"
                        stroke="#00FF88"
                        fill="#00FF88"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Review Time Distribution</CardTitle>
              <CardDescription>
                How long articles typically take to review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={editorialMetrics.reviewTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeRange" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00FF88" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-gaps" className="space-y-6">
          {/* Suggested Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Content Gap Analysis</CardTitle>
              <CardDescription>
                AI-identified opportunities for new content based on demand and
                competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentGapAnalysis.suggestedTopics.map(topic => (
                  <div key={topic.topic} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{topic.topic}</h4>
                      <Badge variant="outline" className="text-green-600">
                        {topic.opportunity}% opportunity
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {topic.demand}%
                        </div>
                        <div className="text-xs text-gray-500">Demand</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {topic.competition}%
                        </div>
                        <div className="text-xs text-gray-500">Competition</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {topic.opportunity}%
                        </div>
                        <div className="text-xs text-gray-500">Opportunity</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {topic.keywords.map(keyword => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Trending Topics</CardTitle>
              <CardDescription>
                Topics gaining traction in the crypto space
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentGapAnalysis.trendingTopics.map(topic => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">{topic.topic}</h4>
                        <p className="text-sm text-gray-500">
                          {topic.articles} articles •{' '}
                          {topic.engagement.toFixed(1)} avg engagement
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      +{topic.growth.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authors" className="space-y-6">
          {/* Top Authors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Authors</CardTitle>
              <CardDescription>
                Authors with highest quality and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {authorInsights.topAuthors.map((author, index) => (
                  <div
                    key={author.authorId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{author.authorName}</h4>
                        <p className="text-sm text-gray-500">
                          {author.articlesPublished} articles •{' '}
                          {formatNumber(author.totalViews)} views
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {author.specialties.map(specialty => (
                            <Badge
                              key={specialty}
                              variant="secondary"
                              className="text-xs"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Quality: {author.qualityScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Engagement: {author.averageEngagement.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Author Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Author Performance Tracking</CardTitle>
              <CardDescription>
                Individual author metrics and approval rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editorialMetrics.authorPerformance.map(author => (
                  <div
                    key={author.authorId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{author.authorName}</h4>
                      <p className="text-sm text-gray-500">
                        {author.articlesSubmitted} submissions
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {author.approvalRate.toFixed(1)}% approved
                        </div>
                        <div className="text-sm text-gray-500">
                          Quality: {author.averageQuality.toFixed(1)}
                        </div>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${author.approvalRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Recognition Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Recognition Suggestions</CardTitle>
              <CardDescription>
                AI-recommended author recognition and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {authorInsights.recognitionSuggestions.map(suggestion => (
                  <div
                    key={suggestion.authorId}
                    className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg"
                  >
                    <Award className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800">
                        {suggestion.authorName} - {suggestion.achievement}
                      </h4>
                      <p className="text-sm text-green-600 mt-1">
                        {suggestion.reason}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-green-700">
                          Impact: {suggestion.impact.toFixed(1)}/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Editorial Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Editorial Insights</CardTitle>
              <CardDescription>
                AI-generated insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      Review Time Optimization
                    </h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Consider implementing automated grammar checks to reduce
                      review time by an estimated 30%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800">
                      Content Quality Improvement
                    </h4>
                    <p className="text-sm text-purple-600 mt-1">
                      SEO scores are below average. Consider providing authors
                      with SEO guidelines and tools.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">
                      Author Development
                    </h4>
                    <p className="text-sm text-orange-600 mt-1">
                      3 authors show high potential for growth. Consider
                      mentorship programs to develop their skills.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
