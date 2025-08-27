'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  LazyProgressDashboard,
  LazyCourseGrid,
  LazyNFTGallery,
  LazyAchievementSystem,
  LazyLeaderboard,
} from '@/components/ui/LazyComponents';
import ActivityFeed from '@/components/progress/ActivityFeed';
import LearningStreakWidget from '@/components/progress/LearningStreakWidget';
import PointsSystem from '@/components/gamification/PointsSystem';
import NotificationSystem from '@/components/gamification/NotificationSystem';
import { BarChart3, BookOpen, Award, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <ProtectedRoute>
      <NotificationSystem />
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BarChart3 className="w-12 h-12 text-stakeados-primary" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  {t('navigation.dashboard')}
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Track your learning progress and achievements
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Progress Dashboard */}
                <LazyProgressDashboard showDetailedStats={true} />

                {/* My Courses */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <BookOpen className="w-8 h-8 text-stakeados-blue" />
                    <h2 className="text-2xl font-bold text-neon">My Courses</h2>
                  </div>
                  <LazyCourseGrid
                    enrolledOnly={true}
                    showFilters={false}
                    showSearch={false}
                    maxCourses={6}
                  />
                </div>

                {/* Recent Certificates */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-8 h-8 text-stakeados-yellow" />
                    <h2 className="text-2xl font-bold text-neon">
                      Recent Certificates
                    </h2>
                  </div>
                  <LazyNFTGallery showFilters={false} maxItems={3} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Learning Streak */}
                <LearningStreakWidget showDetails={true} />

                {/* Points Overview */}
                <PointsSystem showBreakdown={false} />

                {/* Activity Feed */}
                <ActivityFeed limit={5} showHeader={true} />

                {/* Recent Achievements */}
                <LazyAchievementSystem
                  showProgress={false}
                  maxAchievements={3}
                />

                {/* Mini Leaderboard */}
                <LazyLeaderboard />

                {/* Quick Actions */}
                <div className="card-primary">
                  <h3 className="text-lg font-bold text-neon mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="btn-ghost w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-3" />
                      Continue Learning
                    </button>
                    <button className="btn-ghost w-full justify-start">
                      <Award className="w-4 h-4 mr-3" />
                      View Certificates
                    </button>
                    <button className="btn-ghost w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-3" />
                      View Progress
                    </button>
                  </div>
                </div>

                {/* Learning Goals */}
                <div className="card-primary">
                  <h3 className="text-lg font-bold text-neon mb-4">
                    Learning Goals
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-stakeados-gray-300 text-sm">
                        Weekly Goal:
                      </span>
                      <span className="text-stakeados-primary font-semibold">
                        3/5 days
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '60%' }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stakeados-gray-300 text-sm">
                        Monthly Goal:
                      </span>
                      <span className="text-stakeados-blue font-semibold">
                        12/20 activities
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '60%' }} />
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
