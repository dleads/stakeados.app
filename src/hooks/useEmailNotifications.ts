'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  sendWelcomeEmail,
  sendCourseCompletionEmail,
  sendAchievementEmail,
  sendWeeklyDigestEmail,
  getUserEmailPreferences,
  updateUserEmailPreferences,
} from '@/lib/email/services';
import type { Locale } from '@/types';

interface EmailNotificationState {
  isSending: boolean;
  error: string | null;
  success: string | null;
  preferences: {
    emailNotifications: boolean;
    courseUpdates: boolean;
    achievementAlerts: boolean;
    communityUpdates: boolean;
    marketingEmails: boolean;
  };
  isLoading: boolean;
}

export function useEmailNotifications() {
  const { user, profile } = useAuthContext();

  const [state, setState] = useState<EmailNotificationState>({
    isSending: false,
    error: null,
    success: null,
    preferences: {
      emailNotifications: true,
      courseUpdates: true,
      achievementAlerts: true,
      communityUpdates: false,
      marketingEmails: false,
    },
    isLoading: false,
  });

  // Load user email preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const preferences = await getUserEmailPreferences(user.id);
      setState(prev => ({
        ...prev,
        preferences,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load email preferences',
      }));
    }
  }, [user]);

  // Update email preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<typeof state.preferences>) => {
      if (!user) return { success: false };

      setState(prev => ({
        ...prev,
        isSending: true,
        error: null,
        success: null,
      }));

      try {
        const result = await updateUserEmailPreferences(
          user.id,
          newPreferences
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            preferences: { ...prev.preferences, ...newPreferences },
            isSending: false,
            success: 'Email preferences updated successfully',
          }));
        } else {
          setState(prev => ({
            ...prev,
            isSending: false,
            error: result.error || 'Failed to update preferences',
          }));
        }

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return { success: false };
      }
    },
    [user]
  );

  // Send welcome email
  const sendWelcome = useCallback(
    async (locale: Locale = 'en') => {
      if (!user || !user.email) return { success: false };

      setState(prev => ({
        ...prev,
        isSending: true,
        error: null,
        success: null,
      }));

      try {
        const displayName =
          profile?.display_name || profile?.username || 'User';
        const result = await sendWelcomeEmail(
          user.id,
          user.email,
          displayName,
          locale
        );

        setState(prev => ({
          ...prev,
          isSending: false,
          success: result.success ? 'Welcome email sent successfully' : null,
          error: result.success
            ? null
            : result.error || 'Failed to send welcome email',
        }));

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return { success: false };
      }
    },
    [user, profile]
  );

  // Send course completion email
  const sendCourseCompletion = useCallback(
    async (
      courseName: string,
      certificateId: string,
      locale: Locale = 'en'
    ) => {
      if (!user || !user.email || !state.preferences.courseUpdates)
        return { success: false };

      setState(prev => ({
        ...prev,
        isSending: true,
        error: null,
        success: null,
      }));

      try {
        const displayName =
          profile?.display_name || profile?.username || 'User';
        const result = await sendCourseCompletionEmail(
          user.id,
          user.email,
          displayName,
          courseName,
          certificateId,
          locale
        );

        setState(prev => ({
          ...prev,
          isSending: false,
          success: result.success ? 'Course completion email sent' : null,
          error: result.success ? null : result.error || 'Failed to send email',
        }));

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return { success: false };
      }
    },
    [user, profile, state.preferences.courseUpdates]
  );

  // Send achievement email
  const sendAchievement = useCallback(
    async (
      achievementName: string,
      achievementDescription: string,
      locale: Locale = 'en'
    ) => {
      if (!user || !user.email || !state.preferences.achievementAlerts)
        return { success: false };

      setState(prev => ({
        ...prev,
        isSending: true,
        error: null,
        success: null,
      }));

      try {
        const displayName =
          profile?.display_name || profile?.username || 'User';
        const result = await sendAchievementEmail(
          user.id,
          user.email,
          displayName,
          achievementName,
          achievementDescription,
          locale
        );

        setState(prev => ({
          ...prev,
          isSending: false,
          success: result.success ? 'Achievement email sent' : null,
          error: result.success ? null : result.error || 'Failed to send email',
        }));

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return { success: false };
      }
    },
    [user, profile, state.preferences.achievementAlerts]
  );

  // Send weekly digest
  const sendWeeklyDigest = useCallback(
    async (
      digestData: {
        coursesCompleted: number;
        pointsEarned: number;
        newAchievements: string[];
        recommendedCourses: Array<{ title: string; url: string }>;
      },
      locale: Locale = 'en'
    ) => {
      if (!user || !user.email || !state.preferences.emailNotifications)
        return { success: false };

      setState(prev => ({
        ...prev,
        isSending: true,
        error: null,
        success: null,
      }));

      try {
        const displayName =
          profile?.display_name || profile?.username || 'User';
        const result = await sendWeeklyDigestEmail(
          user.id,
          user.email,
          displayName,
          digestData,
          locale
        );

        setState(prev => ({
          ...prev,
          isSending: false,
          success: result.success ? 'Weekly digest sent' : null,
          error: result.success
            ? null
            : result.error || 'Failed to send digest',
        }));

        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return { success: false };
      }
    },
    [user, profile, state.preferences.emailNotifications]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    loadPreferences,
    updatePreferences,
    sendWelcome,
    sendCourseCompletion,
    sendAchievement,
    sendWeeklyDigest,
    clearMessages,

    // Status
    isAuthenticated: !!user,
    hasEmailConfigured: !!user?.email,
  };
}
