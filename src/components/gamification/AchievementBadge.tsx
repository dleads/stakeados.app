'use client';

import { ContributorAchievement } from '@/types/gamification';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Star,
  Award,
  Crown,
  Shield,
  Target,
  BookOpen,
  Edit,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AchievementBadgeProps {
  achievement: ContributorAchievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  award: Award,
  crown: Crown,
  shield: Shield,
  target: Target,
  'book-open': BookOpen,
  edit: Edit,
  'check-circle': CheckCircle,
  zap: Zap,
};

export function AchievementBadge({
  achievement,
  size = 'md',
  showDetails = false,
  className = '',
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon as keyof typeof iconMap] || Award;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (!showDetails) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
        style={{ backgroundColor: achievement.color }}
        title={`${achievement.achievementName}: ${achievement.description}`}
      >
        <Icon className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}
            style={{ backgroundColor: achievement.color }}
          >
            <Icon className={`${iconSizes[size]} text-white`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">
              {achievement.achievementName}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              {achievement.description}
            </p>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>
                Earned{' '}
                {formatDistanceToNow(achievement.earnedAt, { addSuffix: true })}
              </span>

              {achievement.pointsThreshold && (
                <Badge variant="outline" className="text-xs">
                  {achievement.pointsThreshold}+ points
                </Badge>
              )}

              {achievement.contentCountThreshold && (
                <Badge variant="outline" className="text-xs">
                  {achievement.contentCountThreshold}+ content
                </Badge>
              )}

              {achievement.qualityThreshold && (
                <Badge variant="outline" className="text-xs">
                  {achievement.qualityThreshold}+ quality
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementGridProps {
  achievements: ContributorAchievement[];
  showEmpty?: boolean;
  maxDisplay?: number;
}

export function AchievementGrid({
  achievements,
  showEmpty = false,
  maxDisplay,
}: AchievementGridProps) {
  const displayAchievements = maxDisplay
    ? achievements.slice(0, maxDisplay)
    : achievements;

  if (achievements.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className="space-y-4">
      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No achievements yet</p>
          <p className="text-sm text-gray-400">
            Start contributing to earn your first badge!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayAchievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                showDetails
              />
            ))}
          </div>

          {maxDisplay && achievements.length > maxDisplay && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                +{achievements.length - maxDisplay} more achievements
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface AchievementSummaryProps {
  achievements: ContributorAchievement[];
  maxBadges?: number;
}

export function AchievementSummary({
  achievements,
  maxBadges = 5,
}: AchievementSummaryProps) {
  const displayAchievements = achievements.slice(0, maxBadges);
  const remainingCount = Math.max(0, achievements.length - maxBadges);

  return (
    <div className="flex items-center space-x-2">
      {displayAchievements.map(achievement => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size="sm"
        />
      ))}

      {remainingCount > 0 && (
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">
            +{remainingCount}
          </span>
        </div>
      )}

      {achievements.length === 0 && (
        <span className="text-sm text-gray-500">No achievements yet</span>
      )}
    </div>
  );
}
