'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import NotificationTriggers from '@/components/notifications/NotificationTriggers';
import {
  Bell,
  Send,
  Settings,
  TestTube,
  BookOpen,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function AdminNotificationsPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Bell className="w-12 h-12 text-stakeados-primary" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  Notification Management
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Manage notification system, preferences, and testing
              </p>
            </div>

            {/* Notification Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-stakeados-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  In-App Notifications
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Real-time notifications within the application
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-stakeados-blue" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Email Integration
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Automated email notifications via Resend
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-stakeados-purple" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  User Preferences
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Granular control over notification types
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <TestTube className="w-8 h-8 text-stakeados-yellow" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Testing Interface
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Test notification delivery and appearance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Notification Preferences */}
              <div className="card-gaming">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Notification Preferences
                </h3>
                <p className="text-stakeados-gray-300">
                  Notification preferences component will be implemented here.
                </p>
              </div>

              {/* Testing Interface */}
              <NotificationTriggers />
            </div>

            {/* Notification System Info */}
            <div className="mt-12 card-gaming">
              <h3 className="text-xl font-bold text-neon mb-6">
                Notification System Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-stakeados-primary mb-3">
                    In-App Features
                  </h4>
                  <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                    <li>• Real-time toast notifications</li>
                    <li>• Notification center with history</li>
                    <li>• Auto-dismiss with progress bars</li>
                    <li>• Type-specific icons and colors</li>
                    <li>• Mark as read/unread functionality</li>
                    <li>• Bulk actions (mark all, clear all)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-stakeados-primary mb-3">
                    Email Integration
                  </h4>
                  <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                    <li>• Course completion emails with certificates</li>
                    <li>• Achievement unlock notifications</li>
                    <li>• Genesis early access alerts</li>
                    <li>• Community update digests</li>
                    <li>• System maintenance notices</li>
                    <li>• Preference-based filtering</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div className="mt-8 card-gaming">
              <h3 className="text-xl font-bold text-neon mb-6">
                Notification Types
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-stakeados-primary" />
                    <h4 className="font-semibold text-stakeados-primary">
                      Course Completion
                    </h4>
                  </div>
                  <p className="text-stakeados-gray-300 text-sm">
                    Triggered when users complete courses. Includes certificate
                    information and next course recommendations.
                  </p>
                </div>

                <div className="p-4 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-5 h-5 text-stakeados-yellow" />
                    <h4 className="font-semibold text-stakeados-yellow">
                      Achievement Unlocked
                    </h4>
                  </div>
                  <p className="text-stakeados-gray-300 text-sm">
                    Triggered when users unlock achievements. Includes rarity
                    information and progress towards next achievements.
                  </p>
                </div>

                <div className="p-4 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-5 h-5 text-stakeados-yellow" />
                    <h4 className="font-semibold text-stakeados-yellow">
                      Genesis Early Access
                    </h4>
                  </div>
                  <p className="text-stakeados-gray-300 text-sm">
                    Exclusive notifications for Genesis holders about new
                    features and early access opportunities.
                  </p>
                </div>

                <div className="p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-stakeados-blue" />
                    <h4 className="font-semibold text-stakeados-blue">
                      Community Updates
                    </h4>
                  </div>
                  <p className="text-stakeados-gray-300 text-sm">
                    Community news, new articles, events, and social updates
                    from other users.
                  </p>
                </div>

                <div className="p-4 bg-stakeados-orange/10 border border-stakeados-orange/30 rounded-gaming">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-stakeados-orange" />
                    <h4 className="font-semibold text-stakeados-orange">
                      System Updates
                    </h4>
                  </div>
                  <p className="text-stakeados-gray-300 text-sm">
                    Platform updates, maintenance schedules, and important
                    system announcements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
