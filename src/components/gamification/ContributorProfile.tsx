'use client';

import { useState } from 'react';
import {
  useContributorStats,
  useUserAchievements,
  useUserContributions,
} from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { AchievementGrid, AchievementSummary } from './AchievementBadge';
import { ContributorStats } from './ContributorStats';
import {
  Trophy,
  FileText,
  Star,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ContributorProfileProps {
  userId: string;
  userInfo?: {
    name: string;
    avatar?: string;
    joinedAt: Date;
    bio?: string;
  };
  showFullProfile?: boolean;
}

export function ContributorProfile({
  userId,
  userInfo,
  showFullProfile = true,
}: ContributorProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: statsLoading } = useContributorStats(userId);
  const { data: achievements, isLoading: achievementsLoading } =
    useUserAchievements(userId);
  const { data: contributionsData, isLoading: contributionsLoading } =
    useUserContributions(userId, 20);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Contributor profile not found</p>
        </CardContent>
      </Card>
    );
  }

  const ProfileHeader = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar and Basic Info */}
          <div className="flex-shrink-0">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userInfo?.avatar} alt={userInfo?.name} />
              <AvatarFallback className="text-2xl">
                {userInfo?.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold">
                {userInfo?.name || 'Anonymous Contributor'}
              </h1>
              {stats.rankPosition && stats.rankPosition <= 10 && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Trophy className="h-3 w-3" />
                  <span>Top {stats.rankPosition}</span>
                </Badge>
              )}
            </div>

            {userInfo?.bio && (
              <p className="text-gray-600 mb-3">{userInfo.bio}</p>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
              {userInfo?.joinedAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(userInfo.joinedAt, 'MMM yyyy')}</span>
                </div>
              )}

              {stats.lastContributionAt && (
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>
                    Last active{' '}
                    {formatDistanceToNow(stats.lastContributionAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.totalContentPoints.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalArticles}</p>
                <p className="text-xs text-gray-600">Articles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stats.averageQualityScore.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">Avg Quality</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {achievements?.length || 0}
                </p>
                <p className="text-xs text-gray-600">Achievements</p>
              </div>
            </div>

            {/* Recent Achievements */}
            {achievements && achievements.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Recent Achievements
                </p>
                <AchievementSummary achievements={achievements} maxBadges={6} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Contribution Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Contribution Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalArticles}
              </p>
              <p className="text-sm text-gray-600">Articles Published</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {stats.totalReviews}
              </p>
              <p className="text-sm text-gray-600">Reviews Completed</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {stats.averageQualityScore.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Quality Score</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {stats.currentStreak}
              </p>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Content Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Views</span>
                <span className="text-sm text-gray-600">
                  {stats.totalViews.toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min(100, (stats.totalViews / 10000) * 100)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Likes</span>
                <span className="text-sm text-gray-600">
                  {stats.totalLikes.toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min(100, (stats.totalLikes / 1000) * 100)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Shares</span>
                <span className="text-sm text-gray-600">
                  {stats.totalShares.toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min(100, (stats.totalShares / 500) * 100)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {contributionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : contributionsData?.contributions.length ? (
            <div className="space-y-3">
              {contributionsData.contributions.slice(0, 5).map(contribution => (
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
    </div>
  );

  if (!showFullProfile) {
    return <ProfileHeader />;
  }

  return (
    <div className="space-y-6">
      <ProfileHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Achievements ({achievements?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievementsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <AchievementGrid achievements={achievements || []} showEmpty />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <ContributorStats userId={userId} showDetailed />
        </TabsContent>

        <TabsContent value="contributions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              {contributionsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : contributionsData?.contributions.length ? (
                <div className="space-y-3">
                  {contributionsData.contributions.map(contribution => (
                    <div
                      key={contribution.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {contribution.contributionType}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {contribution.contentType}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(contribution.awardedAt, {
                            addSuffix: true,
                          })}
                        </p>
                        {contribution.engagementMetrics &&
                          Object.keys(contribution.engagementMetrics).length >
                            0 && (
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              {contribution.engagementMetrics.views && (
                                <span>
                                  {contribution.engagementMetrics.views} views
                                </span>
                              )}
                              {contribution.engagementMetrics.likes && (
                                <span>
                                  {contribution.engagementMetrics.likes} likes
                                </span>
                              )}
                              {contribution.engagementMetrics.shares && (
                                <span>
                                  {contribution.engagementMetrics.shares} shares
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          +{contribution.totalPoints} pts
                        </p>
                        <div className="text-xs text-gray-500">
                          <span>Base: {contribution.basePoints}</span>
                          {contribution.bonusPoints > 0 && (
                            <span className="text-green-600">
                              {' '}
                              +{contribution.bonusPoints} bonus
                            </span>
                          )}
                        </div>
                        {contribution.qualityScore > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
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
      </Tabs>
    </div>
  );
}
