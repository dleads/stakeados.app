'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AchievementSummary } from './AchievementBadge';
import { Trophy, Medal, Award, Star, FileText, Crown } from 'lucide-react';

interface LeaderboardProps {
  limit?: number;
  showTabs?: boolean;
  highlightUserId?: string;
}

export function Leaderboard({
  limit = 50,
  showTabs = true,
  highlightUserId,
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'points' | 'articles' | 'quality'>(
    'points'
  );

  const {
    data: leaderboard,
    isLoading,
    error,
  } = useLeaderboard(activeTab, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-center space-x-4"
              >
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !leaderboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Failed to load leaderboard</p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="text-sm font-medium text-gray-500">#{position}</span>
        );
    }
  };

  const getTabConfig = (tab: string) => {
    switch (tab) {
      case 'points':
        return {
          title: 'Top Contributors',
          icon: Trophy,
          getValue: (entry: any) => `${entry.totalPoints.toLocaleString()} pts`,
          getSubValue: (entry: any) => `${entry.totalArticles} articles`,
        };
      case 'articles':
        return {
          title: 'Most Articles',
          icon: FileText,
          getValue: (entry: any) => `${entry.totalArticles} articles`,
          getSubValue: (entry: any) =>
            `${entry.totalPoints.toLocaleString()} pts`,
        };
      case 'quality':
        return {
          title: 'Highest Quality',
          icon: Star,
          getValue: (entry: any) =>
            `${entry.averageQualityScore.toFixed(1)}/5.0`,
          getSubValue: (entry: any) => `${entry.totalArticles} articles`,
        };
      default:
        return {
          title: 'Leaderboard',
          icon: Trophy,
          getValue: (entry: any) => `${entry.totalPoints.toLocaleString()} pts`,
          getSubValue: (entry: any) => `${entry.totalArticles} articles`,
        };
    }
  };

  const tabConfig = getTabConfig(activeTab);

  const LeaderboardContent = () => (
    <div className="space-y-3">
      {leaderboard.map((entry, index) => {
        const isHighlighted = entry.userId === highlightUserId;
        const position = index + 1;

        return (
          <div
            key={entry.userId}
            className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
              isHighlighted
                ? 'bg-primary/10 border-2 border-primary'
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-8">
              {getRankIcon(position)}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.userAvatar} alt={entry.userName} />
              <AvatarFallback>
                {entry.userName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium truncate">{entry.userName}</h3>
                {isHighlighted && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">
                  {tabConfig.getSubValue(entry)}
                </span>

                {entry.achievements.length > 0 && (
                  <AchievementSummary
                    achievements={entry.achievements}
                    maxBadges={3}
                  />
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="font-semibold text-primary">
                {tabConfig.getValue(entry)}
              </p>
              {position <= 3 && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    position === 1
                      ? 'border-yellow-500 text-yellow-700'
                      : position === 2
                        ? 'border-gray-400 text-gray-700'
                        : 'border-amber-600 text-amber-700'
                  }`}
                >
                  Top {position}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!showTabs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <tabConfig.icon className="h-5 w-5" />
            <span>{tabConfig.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points" className="flex items-center space-x-1">
              <Trophy className="h-4 w-4" />
              <span>Points</span>
            </TabsTrigger>
            <TabsTrigger
              value="articles"
              className="flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>Articles</span>
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="flex items-center space-x-1"
            >
              <Star className="h-4 w-4" />
              <span>Quality</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="mt-4">
            <LeaderboardContent />
          </TabsContent>

          <TabsContent value="articles" className="mt-4">
            <LeaderboardContent />
          </TabsContent>

          <TabsContent value="quality" className="mt-4">
            <LeaderboardContent />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface MiniLeaderboardProps {
  limit?: number;
  type?: 'points' | 'articles' | 'quality';
  title?: string;
}

export function MiniLeaderboard({
  limit = 5,
  type = 'points',
  title,
}: MiniLeaderboardProps) {
  const { data: leaderboard, isLoading } = useLeaderboard(type, limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!leaderboard?.length) {
    return <p className="text-sm text-gray-500">No data available</p>;
  }

  return (
    <div className="space-y-2">
      {title && <h4 className="font-medium text-sm text-gray-700">{title}</h4>}

      {leaderboard.slice(0, limit).map((entry, index) => (
        <div key={entry.userId} className="flex items-center space-x-2 text-sm">
          <span className="w-6 text-center font-medium text-gray-500">
            #{index + 1}
          </span>

          <Avatar className="h-6 w-6">
            <AvatarImage src={entry.userAvatar} alt={entry.userName} />
            <AvatarFallback className="text-xs">
              {entry.userName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <span className="flex-1 truncate">{entry.userName}</span>

          <span className="font-medium text-primary">
            {type === 'points' && `${entry.totalPoints.toLocaleString()}`}
            {type === 'articles' && `${entry.totalArticles}`}
            {type === 'quality' && `${entry.averageQualityScore.toFixed(1)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// Default export for backward compatibility
export default Leaderboard;
