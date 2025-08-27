'use client';

import React from 'react';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { formatRelativeTime } from '@/lib/utils';
import {
  Award,
  BookOpen,
  Target,
  Star,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export default function ActivityFeed({
  limit = 10,
  showHeader = true,
  className = '',
}: ActivityFeedProps) {
  const { getRecentActivity, analytics, isLoading, error, isAuthenticated } =
    useProgressTracking();

  const recentActivity = getRecentActivity(limit);

  const getActivityIcon = (contentId: string, score?: number) => {
    if (contentId.includes('quiz') || contentId.includes('exam')) {
      return score && score >= 90 ? (
        <Star className="w-5 h-5 text-stakeados-yellow" />
      ) : (
        <Target className="w-5 h-5 text-stakeados-blue" />
      );
    } else if (contentId.includes('assignment')) {
      return <Award className="w-5 h-5 text-stakeados-purple" />;
    } else {
      return <BookOpen className="w-5 h-5 text-stakeados-primary" />;
    }
  };

  const getActivityTitle = (contentId: string) => {
    if (contentId.includes('lesson')) {
      return `Completed ${contentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    } else if (contentId.includes('quiz')) {
      return `Passed ${contentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    } else if (contentId.includes('assignment')) {
      return `Submitted ${contentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    } else if (contentId.includes('exam')) {
      return `Completed ${contentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    } else {
      return `Completed ${contentId.replace('-', ' ')}`;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-stakeados-gray-400';
    if (score >= 90) return 'text-stakeados-primary';
    if (score >= 80) return 'text-stakeados-blue';
    if (score >= 70) return 'text-stakeados-yellow';
    return 'text-stakeados-orange';
  };

  if (!isAuthenticated) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to view your activity feed
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming animate-pulse"
            >
              <div className="w-10 h-10 bg-stakeados-gray-600 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-stakeados-gray-600 rounded mb-2" />
                <div className="h-3 bg-stakeados-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading activity: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-stakeados-blue" />
            <h3 className="text-xl font-bold text-neon">Recent Activity</h3>
          </div>

          {analytics && (
            <div className="text-sm text-stakeados-gray-400">
              {analytics.completedActivities} total completions
            </div>
          )}
        </div>
      )}

      {recentActivity.length > 0 ? (
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={`${activity.course_id}-${activity.content_id}-${index}`}
              className="flex items-start gap-3 p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            >
              {/* Activity Icon */}
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(
                  activity.content_id,
                  activity.score ?? undefined
                )}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-1">
                      {getActivityTitle(activity.content_id)}
                    </h4>

                    <div className="flex items-center gap-3 text-sm text-stakeados-gray-400">
                      <span>Course ID: {activity.course_id}</span>
                      {activity.score && (
                        <span
                          className={`font-semibold ${getScoreColor(activity.score)}`}
                        >
                          Score: {activity.score}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-stakeados-gray-500 flex-shrink-0">
                    {formatRelativeTime(activity.completed_at!)}
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className="flex items-center gap-2 mt-2">
                  {activity.score && activity.score >= 95 && (
                    <span className="px-2 py-1 bg-stakeados-yellow/20 text-stakeados-yellow text-xs rounded border border-stakeados-yellow/30">
                      Perfect Score
                    </span>
                  )}
                  {activity.score &&
                    activity.score >= 90 &&
                    activity.score < 95 && (
                      <span className="px-2 py-1 bg-stakeados-primary/20 text-stakeados-primary text-xs rounded border border-stakeados-primary/30">
                        Excellent
                      </span>
                    )}
                  {activity.content_id.includes('exam') && (
                    <span className="px-2 py-1 bg-stakeados-purple/20 text-stakeados-purple text-xs rounded border border-stakeados-purple/30">
                      Exam Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            No Activity Yet
          </h4>
          <p className="text-stakeados-gray-400 mb-6">
            Start learning to see your progress and achievements here
          </p>
          <button className="btn-primary">Browse Courses</button>
        </div>
      )}

      {/* View All Link */}
      {recentActivity.length >= limit && (
        <div className="mt-6 text-center">
          <button className="btn-ghost">
            <TrendingUp className="w-4 h-4 mr-2" />
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
}
