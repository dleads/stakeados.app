import React from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { Star, TrendingUp, Award, Zap, Target } from 'lucide-react';

interface PointsSystemProps {
  className?: string;
  showBreakdown?: boolean;
}

export default function PointsSystem({
  className = '',
  showBreakdown = true,
}: PointsSystemProps) {
  const { profile } = useAuthContext();

  const currentPoints = profile?.total_points || 0;

  if (!profile) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to view your points and progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Points Overview */}
      <div className="card-highlight">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-stakeados-dark" />
          </div>

          <h2 className="text-3xl font-bold text-neon mb-2">
            {currentPoints.toLocaleString()}
          </h2>
          <p className="text-stakeados-gray-300 mb-4">Total Points Earned</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-stakeados-primary" />
              </div>
              <div className="font-semibold text-stakeados-primary">#?</div>
              <div className="text-xs text-stakeados-gray-400">
                Community Rank
              </div>
            </div>

            <div className="p-3 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-stakeados-blue" />
              </div>
              <div className="font-semibold text-stakeados-blue">0</div>
              <div className="text-xs text-stakeados-gray-400">Day Streak</div>
            </div>

            <div className="p-3 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-stakeados-yellow" />
              </div>
              <div className="font-semibold text-stakeados-yellow">
                {Math.max(0, 100 - currentPoints)}
              </div>
              <div className="text-xs text-stakeados-gray-400">
                To Citizenship
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      {showBreakdown && (
        <div className="card-gaming">
          <h3 className="text-lg font-bold text-neon mb-6">
            How to Earn Points
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Activities */}
            <div>
              <h4 className="font-semibold text-stakeados-primary mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Learning Activities
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      Complete Profile
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      One-time bonus
                    </div>
                  </div>
                  <span className="text-stakeados-primary font-bold">+5</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">Basic Course</div>
                    <div className="text-xs text-stakeados-gray-400">
                      Per course completion
                    </div>
                  </div>
                  <span className="text-stakeados-primary font-bold">+5</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      Intermediate Course
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      Per course completion
                    </div>
                  </div>
                  <span className="text-stakeados-blue font-bold">+10</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      Advanced Course
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      Per course completion
                    </div>
                  </div>
                  <span className="text-stakeados-purple font-bold">+15</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      Perfect Quiz Score
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      100% on quiz
                    </div>
                  </div>
                  <span className="text-stakeados-yellow font-bold">+5</span>
                </div>
              </div>
            </div>

            {/* Community Activities */}
            <div>
              <h4 className="font-semibold text-stakeados-primary mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Community Activities
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">Daily Login</div>
                    <div className="text-xs text-stakeados-gray-400">
                      Max 20 per month
                    </div>
                  </div>
                  <span className="text-stakeados-gray-400 font-bold">+1</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      Discussion Participation
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      Max 10 per discussion
                    </div>
                  </div>
                  <span className="text-stakeados-primary font-bold">+2</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      Published Article
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      Approved by community
                    </div>
                  </div>
                  <span className="text-stakeados-primary font-bold">+5</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">
                      High-Quality Article
                    </div>
                    <div className="text-xs text-stakeados-gray-400">
                      Featured content
                    </div>
                  </div>
                  <span className="text-stakeados-blue font-bold">+10</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stakeados-gray-800 rounded-gaming">
                  <div>
                    <div className="font-medium text-white">Genesis Claim</div>
                    <div className="text-xs text-stakeados-gray-400">
                      One-time founder bonus
                    </div>
                  </div>
                  <span className="text-stakeados-yellow font-bold">+30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="card-gaming">
        <h3 className="text-lg font-bold text-neon mb-4">Point Milestones</h3>

        <div className="space-y-3">
          {[
            { points: 100, reward: 'Citizenship NFT Eligibility', icon: '🏛️' },
            { points: 250, reward: 'Silver Tier Citizenship', icon: '🥈' },
            { points: 500, reward: 'Gold Tier Citizenship', icon: '🥇' },
            { points: 1000, reward: 'Legendary Status', icon: '💎' },
            { points: 2500, reward: 'Community Leader', icon: '👑' },
          ].map(milestone => (
            <div
              key={milestone.points}
              className={`flex items-center gap-4 p-4 rounded-gaming border ${
                currentPoints >= milestone.points
                  ? 'bg-stakeados-primary/10 border-stakeados-primary/30'
                  : 'bg-stakeados-gray-800 border-stakeados-gray-600'
              }`}
            >
              <div className="text-2xl">{milestone.icon}</div>
              <div className="flex-1">
                <div
                  className={`font-semibold ${
                    currentPoints >= milestone.points
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-gray-300'
                  }`}
                >
                  {milestone.points.toLocaleString()} Points
                </div>
                <div className="text-sm text-stakeados-gray-400">
                  {milestone.reward}
                </div>
              </div>
              {currentPoints >= milestone.points && (
                <div className="text-stakeados-primary">
                  <Award className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next Goal */}
      <div className="card-gaming">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-stakeados-blue" />
          <h3 className="text-lg font-bold text-neon">Next Goal</h3>
        </div>

        {currentPoints < 100 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">
                Citizenship Eligibility
              </span>
              <span className="text-stakeados-blue font-bold">
                {currentPoints} / 100 points
              </span>
            </div>
            <div className="progress-bar mb-3">
              <div
                className="progress-fill transition-all duration-500"
                style={{
                  width: `${Math.min(100, (currentPoints / 100) * 100)}%`,
                }}
              />
            </div>
            <p className="text-stakeados-gray-400 text-sm">
              Earn {100 - currentPoints} more points to become eligible for
              Citizenship NFT
            </p>
          </div>
        ) : currentPoints < 250 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">
                Silver Tier Citizenship
              </span>
              <span className="text-stakeados-blue font-bold">
                {currentPoints} / 250 points
              </span>
            </div>
            <div className="progress-bar mb-3">
              <div
                className="progress-fill transition-all duration-500"
                style={{
                  width: `${Math.min(100, (currentPoints / 250) * 100)}%`,
                }}
              />
            </div>
            <p className="text-stakeados-gray-400 text-sm">
              Earn {250 - currentPoints} more points for Silver tier benefits
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <Award className="w-12 h-12 text-stakeados-primary mx-auto mb-3" />
            <p className="text-stakeados-primary font-semibold">
              Congratulations! You've reached major milestones.
            </p>
            <p className="text-stakeados-gray-400 text-sm">
              Keep learning and contributing to maintain your status!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
