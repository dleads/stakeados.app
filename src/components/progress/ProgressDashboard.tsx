'use client';

import React from 'react';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { formatDate } from '@/lib/utils';
import {
  TrendingUp,
  Target,
  Flame,
  BarChart3,
  Star,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

interface ProgressDashboardProps {
  className?: string;
  showDetailedStats?: boolean;
}

export default function ProgressDashboard({
  className = '',
  showDetailedStats = true,
}: ProgressDashboardProps) {
  const {
    analytics,
    weeklyProgress,
    learningStreak,
    isLoading,
    error,
    getRecentActivity,
    getPointsThisWeek,
    getLearningMomentum,
    isAuthenticated,
  } = useProgressTracking();

  const recentActivity = getRecentActivity(5);
  const pointsThisWeek = getPointsThisWeek();
  const momentum = getLearningMomentum();

  if (!isAuthenticated) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to view your learning progress
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading progress: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-stakeados-primary" />
        <div>
          <h2 className="text-2xl font-bold text-neon">Learning Progress</h2>
          <p className="text-stakeados-gray-300">
            Track your educational journey
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-6 h-6 text-stakeados-orange" />
          </div>
          <div className="text-2xl font-bold text-stakeados-orange mb-1">
            {learningStreak}
          </div>
          <div className="text-sm text-stakeados-gray-300">Day Streak</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-6 h-6 text-stakeados-primary" />
          </div>
          <div className="text-2xl font-bold text-stakeados-primary mb-1">
            {analytics?.completedActivities || 0}
          </div>
          <div className="text-sm text-stakeados-gray-300">Completed</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-stakeados-blue" />
          </div>
          <div className="text-2xl font-bold text-stakeados-blue mb-1">
            {analytics?.averageScore || 0}%
          </div>
          <div className="text-sm text-stakeados-gray-300">Avg Score</div>
        </div>

        <div className="card-primary text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-stakeados-yellow" />
          </div>
          <div className="text-2xl font-bold text-stakeados-yellow mb-1">
            {pointsThisWeek}
          </div>
          <div className="text-sm text-stakeados-gray-300">
            Points This Week
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      {weeklyProgress && (
        <div className="card-primary">
          <h3 className="text-lg font-bold text-neon mb-4">Weekly Activity</h3>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weeklyProgress.dailyActivity.map(day => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-stakeados-gray-400 mb-2">
                  {new Date(day.date).toLocaleDateString('en', {
                    weekday: 'short',
                  })}
                </div>
                <div
                  className={`h-12 rounded-gaming flex items-end justify-center text-xs font-semibold ${
                    day.activities > 0
                      ? 'bg-stakeados-primary text-stakeados-dark'
                      : 'bg-stakeados-gray-700 text-stakeados-gray-400'
                  }`}
                >
                  {day.activities > 0 && day.activities}
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-stakeados-gray-400 text-center">
            {weeklyProgress.activitiesThisWeek} activities •{' '}
            {weeklyProgress.completionsThisWeek} completions
          </div>
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetailedStats && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Progress */}
          <div className="card-primary">
            <h3 className="text-lg font-bold text-neon mb-4">
              Course Progress
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">
                  Courses Started:
                </span>
                <span className="text-white font-semibold">
                  {analytics.coursesStarted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">
                  Courses Completed:
                </span>
                <span className="text-stakeados-primary font-semibold">
                  {analytics.coursesCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">
                  Completion Rate:
                </span>
                <span className="text-stakeados-blue font-semibold">
                  {analytics.coursesStarted > 0
                    ? Math.round(
                        (analytics.coursesCompleted /
                          analytics.coursesStarted) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="card-primary">
            <h3 className="text-lg font-bold text-neon mb-4">
              Difficulty Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-stakeados-primary rounded-full"></div>
                  <span className="text-stakeados-gray-300">Basic:</span>
                </div>
                <span className="text-stakeados-primary font-semibold">
                  {analytics.difficultyBreakdown.basic}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-stakeados-blue rounded-full"></div>
                  <span className="text-stakeados-gray-300">Intermediate:</span>
                </div>
                <span className="text-stakeados-blue font-semibold">
                  {analytics.difficultyBreakdown.intermediate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-stakeados-purple rounded-full"></div>
                  <span className="text-stakeados-gray-300">Advanced:</span>
                </div>
                <span className="text-stakeados-purple font-semibold">
                  {analytics.difficultyBreakdown.advanced}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card-primary">
        <h3 className="text-lg font-bold text-neon mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={`${activity.course_id}-${activity.content_id}-${index}`}
                className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming"
              >
                <CheckCircle className="w-5 h-5 text-stakeados-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-white font-medium">
                    Completed {activity.content_id.replace('-', ' ')}
                  </div>
                  <div className="text-sm text-stakeados-gray-400">
                    {activity.score && `Score: ${activity.score}%`}
                    {activity.completed_at &&
                      ` • ${formatDate(activity.completed_at)}`}
                  </div>
                </div>
                {activity.score && activity.score >= 90 && (
                  <Star className="w-4 h-4 text-stakeados-yellow" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
            <p className="text-stakeados-gray-400">No recent activity</p>
            <p className="text-sm text-stakeados-gray-500">
              Start a course to see your progress here
            </p>
          </div>
        )}
      </div>

      {/* Learning Momentum */}
      <div className="card-primary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-neon">Learning Momentum</h3>
          <div
            className={`px-3 py-1 rounded-gaming text-sm font-semibold ${
              momentum >= 3
                ? 'bg-stakeados-primary/20 text-stakeados-primary'
                : momentum >= 1
                  ? 'bg-stakeados-blue/20 text-stakeados-blue'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300'
            }`}
          >
            {momentum >= 3 ? 'High' : momentum >= 1 ? 'Medium' : 'Low'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-stakeados-blue" />
            <span className="text-stakeados-gray-300">Last 3 days:</span>
          </div>
          <span className="text-white font-semibold">
            {momentum} activities
          </span>
        </div>

        <div className="mt-3 text-sm text-stakeados-gray-400">
          {momentum >= 3
            ? "🔥 You're on fire! Keep up the great momentum!"
            : momentum >= 1
              ? '📈 Good progress! Try to maintain consistency.'
              : '💪 Time to get back into learning! Start a lesson today.'}
        </div>
      </div>
    </div>
  );
}
