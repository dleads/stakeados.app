'use client';

import {
  useContributorStats,
  useUserContributions,
} from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  FileText,
  Eye,
  Heart,
  Share2,
  Star,
  TrendingUp,
  Award,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContributorStatsProps {
  userId: string;
  showDetailed?: boolean;
}

export function ContributorStats({
  userId,
  showDetailed = false,
}: ContributorStatsProps) {
  const { data: stats, isLoading: statsLoading } = useContributorStats(userId);
  const { data: contributionsData, isLoading: contributionsLoading } =
    useUserContributions(userId, 10);

  if (statsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No contributor stats available</p>
        </CardContent>
      </Card>
    );
  }

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          title="Total Points"
          value={stats.totalContentPoints.toLocaleString()}
          subtitle={
            stats.rankPosition ? `Rank #${stats.rankPosition}` : undefined
          }
        />
        <StatCard
          icon={FileText}
          title="Articles"
          value={stats.totalArticles}
        />
        <StatCard
          icon={Star}
          title="Avg Quality"
          value={stats.averageQualityScore.toFixed(1)}
          subtitle="out of 5.0"
        />
        <StatCard icon={Award} title="Reviews" value={stats.totalReviews} />
      </div>

      {/* Engagement Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Engagement Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">
                  {stats.totalViews.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Views</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">
                  {stats.totalLikes.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Likes</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Share2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {stats.totalShares.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Shares</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Activity Streak</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Streak</span>
                <span className="text-sm text-gray-600">
                  {stats.currentStreak} days
                </span>
              </div>
              <Progress
                value={
                  (stats.currentStreak / Math.max(stats.longestStreak, 30)) *
                  100
                }
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>Longest Streak: {stats.longestStreak} days</span>
              {stats.lastContributionAt && (
                <span>
                  Last:{' '}
                  {formatDistanceToNow(stats.lastContributionAt, {
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View */}
      {showDetailed && (
        <Tabs defaultValue="contributions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contributions">
              Recent Contributions
            </TabsTrigger>
            <TabsTrigger value="breakdown">Points Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                {contributionsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : contributionsData?.contributions.length ? (
                  <div className="space-y-3">
                    {contributionsData.contributions.map(contribution => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">
                              {contribution.contributionType}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {contribution.contentType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDistanceToNow(contribution.awardedAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            +{contribution.totalPoints} pts
                          </p>
                          {contribution.qualityScore > 0 && (
                            <p className="text-xs text-gray-500">
                              Quality: {contribution.qualityScore.toFixed(1)}/5
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No contributions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Points Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {contributionsData?.breakdown ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Base Points</p>
                        <p className="text-2xl font-bold">
                          {contributionsData.breakdown.basePoints}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quality Bonus</p>
                        <p className="text-2xl font-bold text-green-600">
                          +{contributionsData.breakdown.qualityBonus}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Contribution Sources</h4>
                      {contributionsData.breakdown.breakdown.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">{item.source}</span>
                            <span className="font-medium">
                              +{item.points} pts
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No points breakdown available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
