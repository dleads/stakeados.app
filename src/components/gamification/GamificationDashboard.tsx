'use client';

import { useState } from 'react';
import {
  useContributorStats,
  useUserAchievements,
} from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ContributorStats } from './ContributorStats';
import { Leaderboard, MiniLeaderboard } from './Leaderboard';
import { AchievementGrid } from './AchievementBadge';
import { ContributorProfile } from './ContributorProfile';
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Award,
  Star,
  FileText,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface GamificationDashboardProps {
  userId: string;
  userInfo?: {
    name: string;
    avatar?: string;
    joinedAt: Date;
  };
  showCreateContent?: boolean;
}

export function GamificationDashboard({
  userId,
  userInfo,
  showCreateContent = true,
}: GamificationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const locale = useLocale();

  const { data: stats } = useContributorStats(userId);
  const { data: achievements } = useUserAchievements(userId);

  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - User Stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Actions */}
        {showCreateContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Earn More Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href={`/${locale}/articles/propose`}>
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">Propose Article</p>
                      <p className="text-xs text-gray-500">+15 points</p>
                    </div>
                  </Button>
                </Link>

                <Link href={`/${locale}/admin/proposals`}>
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Award className="h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">Review Content</p>
                      <p className="text-xs text-gray-500">+5 points</p>
                    </div>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-center space-y-2"
                  disabled
                >
                  <Star className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium">Translate Content</p>
                    <p className="text-xs text-gray-500">+8 points</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Stats */}
        <ContributorStats userId={userId} />

        {/* Recent Achievements */}
        {achievements && achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Recent Achievements</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('achievements')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AchievementGrid achievements={achievements.slice(0, 4)} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Community & Leaderboard */}
      <div className="space-y-6">
        {/* User Rank Card */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Your Rank</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  #{stats.rankPosition || '—'}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {stats.totalContentPoints.toLocaleString()} points
                </p>

                {stats.rankPosition && stats.rankPosition <= 10 && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🏆 Top 10 Contributor
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mini Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Top Contributors</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('leaderboard')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniLeaderboard limit={5} type="points" />
          </CardContent>
        </Card>

        {/* Progress to Next Achievement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Next Milestone</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats && (
                <>
                  {/* Next article milestone */}
                  {stats.totalArticles < 10 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Prolific Writer
                        </span>
                        <span className="text-sm text-gray-600">
                          {stats.totalArticles}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(stats.totalArticles / 10) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {10 - stats.totalArticles} more articles to unlock
                      </p>
                    </div>
                  )}

                  {/* Quality milestone */}
                  {stats.averageQualityScore < 4.0 &&
                    stats.totalArticles >= 5 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            Quality Contributor
                          </span>
                          <span className="text-sm text-gray-600">
                            {stats.averageQualityScore.toFixed(1)}/4.0
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(stats.averageQualityScore / 4.0) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Maintain high quality content
                        </p>
                      </div>
                    )}

                  {/* Points milestone */}
                  {stats.totalContentPoints < 500 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Content Master
                        </span>
                        <span className="text-sm text-gray-600">
                          {stats.totalContentPoints}/500
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(stats.totalContentPoints / 500) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {500 - stats.totalContentPoints} more points to unlock
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contributor Dashboard</h1>
          <p className="text-gray-600">
            Track your contributions and compete with the community
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Your Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AchievementGrid achievements={achievements || []} showEmpty />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Leaderboard highlightUserId={userId} />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ContributorProfile
            userId={userId}
            userInfo={userInfo}
            showFullProfile={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
