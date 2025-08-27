import React, { useState } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { formatDate } from '@/lib/utils';
import { Award, Lock, CheckCircle, Trophy } from 'lucide-react';

interface AchievementSystemProps {
  className?: string;
  showProgress?: boolean;
  maxAchievements?: number;
}

export default function AchievementSystem({
  className = '',
  showProgress = true,
  maxAchievements,
}: AchievementSystemProps) {
  const { achievements, isLoading } = useGamification();

  const [filter, setFilter] = useState<
    'all' | 'earned' | 'available' | 'common' | 'rare' | 'epic' | 'legendary'
  >('all');

  const getFilteredAchievements = () => {
    let filtered = achievements;

    switch (filter) {
      case 'earned':
      case 'available':
      case 'common':
      case 'rare':
      case 'epic':
      case 'legendary':
      default:
        filtered = achievements;
    }

    return maxAchievements
      ? (filtered.data || []).slice(0, maxAchievements)
      : filtered.data || [];
  };

  const filteredAchievements = getFilteredAchievements();
  const completionPercentage = 0;

  if (false) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to view your achievements and progress
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
          <p className="text-stakeados-gray-300">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (false) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading achievements</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-stakeados-yellow" />
          <div>
            <h2 className="text-2xl font-bold text-neon">Achievements</h2>
            <p className="text-stakeados-gray-300">
              Track your progress and unlock rewards
            </p>
          </div>
        </div>

        {showProgress && (
          <div className="text-right">
            <div className="text-2xl font-bold text-stakeados-primary">
              {completionPercentage}%
            </div>
            <div className="text-sm text-stakeados-gray-300">Complete</div>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {showProgress && (
        <div className="card-gaming">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neon">
              Achievement Progress
            </h3>
            <span className="text-stakeados-primary font-semibold">
              {0} / {(achievements.data || []).length}
            </span>
          </div>

          <div className="progress-bar mb-4">
            <div
              className="progress-fill transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-yellow">{0}</div>
              <div className="text-xs text-stakeados-gray-300">Legendary</div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-purple">{0}</div>
              <div className="text-xs text-stakeados-gray-300">Epic</div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-blue">{0}</div>
              <div className="text-xs text-stakeados-gray-300">Rare</div>
            </div>
            <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
              <div className="text-lg font-bold text-stakeados-primary">
                {0}
              </div>
              <div className="text-xs text-stakeados-gray-300">Common</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          'all',
          'earned',
          'available',
          'legendary',
          'epic',
          'rare',
          'common',
        ].map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === filterOption
                ? 'bg-stakeados-primary text-stakeados-dark'
                : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-gaming border-2 transition-all ${
                achievement.earnedAt
                  ? `bg-stakeados-primary/10 border-stakeados-primary/30 hover:shadow-glow`
                  : 'bg-stakeados-gray-800 border-stakeados-gray-600 opacity-60'
              }`}
            >
              <div className="relative text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    achievement.earnedAt
                      ? 'bg-stakeados-primary/10'
                      : 'bg-stakeados-gray-700'
                  }`}
                >
                  <div
                    className={
                      achievement.earnedAt
                        ? 'text-stakeados-primary'
                        : 'text-stakeados-gray-500'
                    }
                  >
                    {achievement.earnedAt ? (
                      <Award className="w-6 h-6" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <h4
                    className={`font-bold ${
                      achievement.earnedAt
                        ? 'text-white'
                        : 'text-stakeados-gray-400'
                    }`}
                  >
                    {achievement.achievementName}
                  </h4>
                  {achievement.earnedAt && (
                    <CheckCircle className="w-4 h-4 text-stakeados-primary" />
                  )}
                </div>

                <p
                  className={`text-sm mb-3 ${
                    achievement.earnedAt
                      ? 'text-stakeados-gray-300'
                      : 'text-stakeados-gray-500'
                  }`}
                >
                  {achievement.description}
                </p>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      achievement.earnedAt
                        ? 'bg-stakeados-primary/20 text-stakeados-primary'
                        : 'bg-stakeados-gray-700 text-stakeados-gray-400'
                    }`}
                  >
                    {achievement.achievementType.toUpperCase()}
                  </span>
                </div>

                {achievement.earnedAt && (
                  <div className="text-xs text-stakeados-gray-400">
                    Earned {formatDate(achievement.earnedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-gaming text-center py-12">
          <Award className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            No Achievements Found
          </h3>
          <p className="text-stakeados-gray-400">
            {filter === 'earned'
              ? 'Start learning and participating to earn your first achievements'
              : filter === 'available'
                ? 'All achievements have been earned!'
                : 'Try a different filter to see achievements'}
          </p>
        </div>
      )}

      {/* Achievement Categories */}
      <div className="card-gaming">
        <h3 className="text-lg font-bold text-neon mb-4">
          Achievement Categories
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Learning Achievements
            </h4>
            <ul className="space-y-2 text-stakeados-gray-300 text-sm">
              <li>• First Course - Complete your first course</li>
              <li>• Course Enthusiast - Complete 5 courses</li>
              <li>• Learning Master - Complete 10 courses</li>
              <li>• Perfect Score - Get 100% on a quiz</li>
              <li>• Streak Master - Maintain learning streak</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Community Achievements
            </h4>
            <ul className="space-y-2 text-stakeados-gray-300 text-sm">
              <li>• First Article - Publish your first article</li>
              <li>• Content Creator - Publish 5 articles</li>
              <li>• Point Collector - Earn 100 points</li>
              <li>• Point Master - Earn 500 points</li>
              <li>• Genesis Founder - Original member</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
