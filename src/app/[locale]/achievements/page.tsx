'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AchievementSystem from '@/components/gamification/AchievementSystem';
import PointsSystem from '@/components/gamification/PointsSystem';
import Leaderboard from '@/components/gamification/Leaderboard';
import NotificationSystem from '@/components/gamification/NotificationSystem';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <NotificationSystem />
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-12 h-12 text-stakeados-yellow" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  Achievements & Rewards
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Track your progress, earn achievements, and climb the
                leaderboard
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <Star className="w-8 h-8 text-stakeados-primary" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Points</div>
                <div className="text-sm text-stakeados-gray-300">
                  Earn through learning
                </div>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <Trophy className="w-8 h-8 text-stakeados-yellow" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  Achievements
                </div>
                <div className="text-sm text-stakeados-gray-300">
                  Unlock milestones
                </div>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-stakeados-orange" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  Leaderboard
                </div>
                <div className="text-sm text-stakeados-gray-300">
                  Compete with others
                </div>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-stakeados-blue" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  Rewards
                </div>
                <div className="text-sm text-stakeados-gray-300">
                  Unlock benefits
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Achievement System */}
                <AchievementSystem showProgress={true} />

                {/* Leaderboard */}
                <Leaderboard limit={20} showTabs={true} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Points System */}
                <PointsSystem showBreakdown={true} />

                {/* Gamification Tips */}
                <div className="card-gaming">
                  <h3 className="text-lg font-bold text-neon mb-4">
                    💡 Gamification Tips
                  </h3>
                  <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                    <li>• Complete your profile for instant points</li>
                    <li>• Maintain daily login streaks for bonus points</li>
                    <li>• Focus on advanced courses for maximum points</li>
                    <li>• Contribute articles for community recognition</li>
                    <li>• Aim for perfect quiz scores for bonus rewards</li>
                    <li>• Participate in discussions for engagement points</li>
                  </ul>
                </div>

                {/* Upcoming Features */}
                <div className="card-gaming">
                  <h3 className="text-lg font-bold text-neon mb-4">
                    🚀 Coming Soon
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-stakeados-gray-800 rounded-gaming opacity-60">
                      <div className="font-medium text-stakeados-yellow">
                        Seasonal Events
                      </div>
                      <div className="text-xs text-stakeados-gray-400">
                        Limited-time challenges
                      </div>
                    </div>
                    <div className="p-3 bg-stakeados-gray-800 rounded-gaming opacity-60">
                      <div className="font-medium text-stakeados-blue">
                        Team Competitions
                      </div>
                      <div className="text-xs text-stakeados-gray-400">
                        Collaborative achievements
                      </div>
                    </div>
                    <div className="p-3 bg-stakeados-gray-800 rounded-gaming opacity-60">
                      <div className="font-medium text-stakeados-purple">
                        NFT Rewards
                      </div>
                      <div className="text-xs text-stakeados-gray-400">
                        Special achievement NFTs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
