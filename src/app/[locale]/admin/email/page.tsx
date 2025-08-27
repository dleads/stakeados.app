'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EmailTestInterface from '@/components/email/EmailTestInterface';
import EmailPreferences from '@/components/email/EmailPreferences';
import { Mail, Send, Settings, TestTube } from 'lucide-react';

export default function AdminEmailPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Mail className="w-12 h-12 text-stakeados-blue" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  Email Management
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Manage email templates, preferences, and testing
              </p>
            </div>

            {/* Email Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-stakeados-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Transactional Emails
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Welcome, course completion, and achievement notifications
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-stakeados-blue" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  User Preferences
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Granular control over notification preferences
                </p>
              </div>

              <div className="card-primary text-center">
                <div className="flex items-center justify-center mb-4">
                  <TestTube className="w-8 h-8 text-stakeados-purple" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Testing Interface
                </h3>
                <p className="text-stakeados-gray-300 text-sm">
                  Test email templates and delivery functionality
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Email Testing */}
              <EmailTestInterface />

              {/* Email Preferences */}
              <EmailPreferences />
            </div>

            {/* Email Templates Info */}
            <div className="mt-12 card-gaming">
              <h3 className="text-xl font-bold text-neon mb-6">
                Available Email Templates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-stakeados-primary mb-3">
                    Transactional Templates
                  </h4>
                  <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                    <li>• Welcome Email - New user onboarding</li>
                    <li>• Course Completion - Certificate notifications</li>
                    <li>• Achievement Unlocked - Achievement alerts</li>
                    <li>• Password Reset - Security notifications</li>
                    <li>• Genesis Invitation - Exclusive invitations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-stakeados-primary mb-3">
                    Marketing Templates
                  </h4>
                  <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                    <li>• Weekly Digest - Progress summaries</li>
                    <li>• Newsletter - Community updates</li>
                    <li>• Course Recommendations - Personalized suggestions</li>
                    <li>• Feature Announcements - New features</li>
                    <li>• Community Highlights - User spotlights</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Email Service Configuration */}
            <div className="mt-8 card-gaming">
              <h3 className="text-xl font-bold text-neon mb-6">
                Email Service Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-stakeados-primary mb-3">
                    Service Details
                  </h4>
                  <div className="space-y-2 text-stakeados-gray-300 text-sm">
                    <div>Provider: Resend</div>
                    <div>From: noreply@stakeados.com</div>
                    <div>Reply-To: support@stakeados.com</div>
                    <div>Rate Limit: 100 emails/hour</div>
                    <div>Queue Processing: Every 30 seconds</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-stakeados-primary mb-3">
                    Features
                  </h4>
                  <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                    <li>• Multi-language support (EN/ES)</li>
                    <li>• Responsive email design</li>
                    <li>• Gaming-themed templates</li>
                    <li>• Automatic queue processing</li>
                    <li>• User preference management</li>
                    <li>• Delivery tracking and analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
