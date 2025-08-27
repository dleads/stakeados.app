'use client';

import React from 'react';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { Flame, Calendar, TrendingUp, Target } from 'lucide-react';

interface LearningStreakWidgetProps {
  className?: string;
  showDetails?: boolean;
}

export default function LearningStreakWidget({
  className = '',
  showDetails = true,
}: LearningStreakWidgetProps) {
  const {
    learningStreak,
    weeklyProgress,
    getLearningMomentum,
    isLoading,
    isAuthenticated,
  } = useProgressTracking();

  const momentum = getLearningMomentum();

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`card-primary ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-stakeados-gray-600 rounded mb-2" />
          <div className="h-8 bg-stakeados-gray-600 rounded" />
        </div>
      </div>
    );
  }

  const getStreakMessage = () => {
    if (learningStreak === 0) {
      return 'Start your learning streak today!';
    } else if (learningStreak === 1) {
      return 'Great start! Keep it going tomorrow.';
    } else if (learningStreak < 7) {
      return `${learningStreak} days strong! You're building a habit.`;
    } else if (learningStreak < 30) {
      return `${learningStreak} days! You're on fire! 🔥`;
    } else {
      return `${learningStreak} days! Incredible dedication! 🏆`;
    }
  };

  const getStreakColor = () => {
    if (learningStreak === 0) return 'text-stakeados-gray-400';
    if (learningStreak < 7) return 'text-stakeados-blue';
    if (learningStreak < 30) return 'text-stakeados-orange';
    return 'text-stakeados-yellow';
  };

  return (
    <div className={`card-primary ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-gaming ${
            learningStreak > 0
              ? 'bg-stakeados-orange/20'
              : 'bg-stakeados-gray-700'
          }`}
        >
          <Flame
            className={`w-6 h-6 ${
              learningStreak > 0
                ? 'text-stakeados-orange'
                : 'text-stakeados-gray-400'
            }`}
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neon">Learning Streak</h3>
          <p className="text-sm text-stakeados-gray-300">
            Keep the momentum going
          </p>
        </div>
      </div>

      {/* Streak Counter */}
      <div className="text-center mb-4">
        <div className={`text-4xl font-bold mb-2 ${getStreakColor()}`}>
          {learningStreak}
        </div>
        <div className="text-stakeados-gray-300">
          {learningStreak === 1 ? 'day' : 'days'}
        </div>
      </div>

      {/* Streak Message */}
      <div className="text-center mb-4">
        <p className="text-sm text-stakeados-gray-300">{getStreakMessage()}</p>
      </div>

      {/* Details */}
      {showDetails && weeklyProgress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stakeados-blue" />
              <span className="text-stakeados-gray-300">This Week:</span>
            </div>
            <span className="text-white font-semibold">
              {weeklyProgress.activitiesThisWeek} activities
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-stakeados-primary" />
              <span className="text-stakeados-gray-300">Momentum:</span>
            </div>
            <span
              className={`font-semibold ${
                momentum >= 3
                  ? 'text-stakeados-primary'
                  : momentum >= 1
                    ? 'text-stakeados-blue'
                    : 'text-stakeados-gray-400'
              }`}
            >
              {momentum >= 3 ? 'High' : momentum >= 1 ? 'Medium' : 'Low'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-stakeados-yellow" />
              <span className="text-stakeados-gray-300">Points Earned:</span>
            </div>
            <span className="text-stakeados-yellow font-semibold">
              {weeklyProgress.pointsEarned}
            </span>
          </div>
        </div>
      )}

      {/* Motivation */}
      <div className="mt-4 p-3 bg-stakeados-gray-800 rounded-gaming">
        <div className="text-xs text-stakeados-gray-400 text-center">
          {learningStreak === 0
            ? '💡 Complete any lesson to start your streak!'
            : learningStreak < 7
              ? '🎯 Reach 7 days for your first milestone!'
              : learningStreak < 30
                ? "🚀 You're building an amazing habit!"
                : "🏆 You're a learning champion!"}
        </div>
      </div>
    </div>
  );
}
