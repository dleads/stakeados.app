'use client';

import React, { useEffect } from 'react';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import {
  Mail,
  Bell,
  BookOpen,
  Award,
  Users,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface EmailPreferencesProps {
  className?: string;
}

export default function EmailPreferences({
  className = '',
}: EmailPreferencesProps) {
  const {
    preferences,
    isLoading,
    isSending,
    error,
    success,
    loadPreferences,
    updatePreferences,
    clearMessages,
    isAuthenticated,
    hasEmailConfigured,
  } = useEmailNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated, loadPreferences]);

  if (!isAuthenticated) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Mail className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to manage your email preferences
          </p>
        </div>
      </div>
    );
  }

  if (!hasEmailConfigured) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Mail className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            No Email Configured
          </h3>
          <p className="text-stakeados-gray-400">
            Add an email address to your account to receive notifications
          </p>
        </div>
      </div>
    );
  }

  const handlePreferenceChange = (
    key: keyof typeof preferences,
    value: boolean
  ) => {
    updatePreferences({ [key]: value });
  };

  const emailPreferenceItems = [
    {
      key: 'emailNotifications' as const,
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      color: 'text-stakeados-blue',
    },
    {
      key: 'courseUpdates' as const,
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Course Updates',
      description: 'New courses and completion notifications',
      color: 'text-stakeados-primary',
    },
    {
      key: 'achievementAlerts' as const,
      icon: <Award className="w-5 h-5" />,
      title: 'Achievement Alerts',
      description: 'When you unlock new achievements',
      color: 'text-stakeados-yellow',
    },
    {
      key: 'communityUpdates' as const,
      icon: <Users className="w-5 h-5" />,
      title: 'Community Updates',
      description: 'Community news and events',
      color: 'text-stakeados-purple',
    },
    {
      key: 'marketingEmails' as const,
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Marketing Emails',
      description: 'Product updates and promotional content',
      color: 'text-stakeados-orange',
    },
  ];

  return (
    <div className={`card-gaming ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-6 h-6 text-stakeados-primary" />
          <h3 className="text-xl font-bold text-neon">Email Preferences</h3>
        </div>
        <p className="text-stakeados-gray-300">
          Choose which email notifications you want to receive
        </p>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="mb-6">
          {error && (
            <div className="notification-error mb-3">
              <div className="flex items-center justify-between">
                <span>{error}</span>
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
                <span>{success}</span>
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-stakeados-primary animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">Loading preferences...</p>
        </div>
      )}

      {/* Preferences */}
      {!isLoading && (
        <div className="space-y-4">
          {emailPreferenceItems.map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-stakeados-gray-800 rounded-gaming"
            >
              <div className="flex items-center gap-3">
                <div className={item.color}>{item.icon}</div>
                <div>
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-stakeados-gray-400">
                    {item.description}
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={e =>
                    handlePreferenceChange(item.key, e.target.checked)
                  }
                  disabled={isSending}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-stakeados-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-stakeados-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stakeados-primary"></div>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Email Frequency Info */}
      <div className="mt-6 p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
        <h4 className="font-semibold text-stakeados-blue mb-2">
          📧 Email Frequency
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-1">
          <li>• Course completion: Immediate</li>
          <li>• Achievement alerts: Immediate</li>
          <li>• Community updates: Weekly digest</li>
          <li>• Marketing emails: Monthly maximum</li>
        </ul>
      </div>

      {/* Unsubscribe Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-stakeados-gray-400">
          You can unsubscribe from any email using the link at the bottom of
          each message
        </p>
      </div>
    </div>
  );
}
