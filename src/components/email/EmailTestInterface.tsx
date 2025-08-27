'use client';

import React, { useState } from 'react';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Mail, Send, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface EmailTestInterfaceProps {
  className?: string;
}

export default function EmailTestInterface({
  className = '',
}: EmailTestInterfaceProps) {
  const { user, profile } = useAuthContext();
  const {
    sendWelcome,
    sendCourseCompletion,
    sendAchievement,
    sendWeeklyDigest,
    isSending,
    error,
    success,
    clearMessages,
  } = useEmailNotifications();

  const [testData, setTestData] = useState({
    courseName: 'Blockchain Fundamentals',
    certificateId: 'cert-123',
    achievementName: 'First Course Completed',
    achievementDescription: 'You completed your first course on Stakeados!',
  });

  const handleTestWelcome = async () => {
    await sendWelcome('en');
  };

  const handleTestCourseCompletion = async () => {
    await sendCourseCompletion(
      testData.courseName,
      testData.certificateId,
      'en'
    );
  };

  const handleTestAchievement = async () => {
    await sendAchievement(
      testData.achievementName,
      testData.achievementDescription,
      'en'
    );
  };

  const handleTestWeeklyDigest = async () => {
    const digestData = {
      coursesCompleted: 2,
      pointsEarned: 25,
      newAchievements: ['First Course', 'Point Collector'],
      recommendedCourses: [
        { title: 'DeFi Fundamentals', url: '/courses/defi-fundamentals' },
        { title: 'NFT Technology', url: '/courses/nft-technology' },
      ],
    };
    await sendWeeklyDigest(digestData, 'en');
  };

  if (!user) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Mail className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to test email functionality
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TestTube className="w-6 h-6 text-stakeados-blue" />
          <h3 className="text-xl font-bold text-neon">
            Email Testing Interface
          </h3>
        </div>
        <p className="text-stakeados-gray-300">
          Test different email templates and functionality
        </p>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="mb-6">
          {error && (
            <div className="notification-error mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-red hover:text-stakeados-red/80 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="notification-success mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-primary hover:text-stakeados-primary/80 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Data Configuration */}
      <div className="mb-6 space-y-4">
        <h4 className="font-semibold text-stakeados-primary">
          Test Data Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-gaming">
            <label htmlFor="courseName">Course Name</label>
            <input
              type="text"
              id="courseName"
              value={testData.courseName}
              onChange={e =>
                setTestData(prev => ({ ...prev, courseName: e.target.value }))
              }
            />
          </div>

          <div className="form-gaming">
            <label htmlFor="certificateId">Certificate ID</label>
            <input
              type="text"
              id="certificateId"
              value={testData.certificateId}
              onChange={e =>
                setTestData(prev => ({
                  ...prev,
                  certificateId: e.target.value,
                }))
              }
            />
          </div>

          <div className="form-gaming">
            <label htmlFor="achievementName">Achievement Name</label>
            <input
              type="text"
              id="achievementName"
              value={testData.achievementName}
              onChange={e =>
                setTestData(prev => ({
                  ...prev,
                  achievementName: e.target.value,
                }))
              }
            />
          </div>

          <div className="form-gaming">
            <label htmlFor="achievementDescription">
              Achievement Description
            </label>
            <input
              type="text"
              id="achievementDescription"
              value={testData.achievementDescription}
              onChange={e =>
                setTestData(prev => ({
                  ...prev,
                  achievementDescription: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="space-y-4">
        <h4 className="font-semibold text-stakeados-primary">
          Email Templates
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleTestWelcome}
            disabled={isSending}
            className="btn-primary"
          >
            {isSending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Test Welcome Email
              </div>
            )}
          </button>

          <button
            onClick={handleTestCourseCompletion}
            disabled={isSending}
            className="btn-secondary"
          >
            <Send className="w-4 h-4 mr-2" />
            Test Course Completion
          </button>

          <button
            onClick={handleTestAchievement}
            disabled={isSending}
            className="btn-ghost"
          >
            <Send className="w-4 h-4 mr-2" />
            Test Achievement
          </button>

          <button
            onClick={handleTestWeeklyDigest}
            disabled={isSending}
            className="btn-ghost"
          >
            <Send className="w-4 h-4 mr-2" />
            Test Weekly Digest
          </button>
        </div>
      </div>

      {/* Current User Info */}
      <div className="mt-6 p-4 bg-stakeados-gray-800 rounded-gaming">
        <h4 className="font-semibold text-stakeados-primary mb-2">
          Current User Info
        </h4>
        <div className="text-sm text-stakeados-gray-300 space-y-1">
          <div>Email: {user.email}</div>
          <div>Display Name: {profile?.display_name || 'User'}</div>
          <div>User ID: {user.id}</div>
        </div>
      </div>

      {/* Email Service Info */}
      <div className="mt-4 p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
        <h4 className="font-semibold text-stakeados-blue mb-2">
          📧 Email Service Info
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-1">
          <li>• Powered by Resend API</li>
          <li>• Gaming-themed email templates</li>
          <li>• Multi-language support (EN/ES)</li>
          <li>• Responsive email design</li>
          <li>• Automatic queue processing</li>
        </ul>
      </div>
    </div>
  );
}
