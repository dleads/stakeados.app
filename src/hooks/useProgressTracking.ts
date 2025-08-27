'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  // getUserProgress,
  getUserCourseProgress,
  markContentCompletedWithRewards,
  getUserCompletionStats,
  getUserProgressAnalytics,
  getUserLearningStreak,
  getWeeklyProgressSummary,
  checkCourseCompletion,
} from '@/lib/supabase/progress';
import type { Database } from '@/types/supabase';

type UserProgress = Database['public']['Tables']['user_progress']['Row'] & {
  courses?: {
    id: string;
    title: string;
    difficulty: string;
    estimated_time: number;
  } | null;
};

interface ProgressAnalytics {
  totalActivities: number;
  completedActivities: number;
  averageScore: number;
  timeSpent: number;
  coursesStarted: number;
  coursesCompleted: number;
  difficultyBreakdown: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  recentActivity: any[];
  streakDays: number;
}

interface WeeklyProgress {
  activitiesThisWeek: number;
  completionsThisWeek: number;
  pointsEarned: number;
  dailyActivity: Array<{
    date: string;
    activities: number;
    completions: number;
  }>;
}

interface ProgressTrackingState {
  userProgress: UserProgress[];
  analytics: ProgressAnalytics | null;
  weeklyProgress: WeeklyProgress | null;
  learningStreak: number;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  success: string | null;
}

export function useProgressTracking() {
  const { user } = useAuthContext();

  const [state, setState] = useState<ProgressTrackingState>({
    userProgress: [],
    analytics: null,
    weeklyProgress: null,
    learningStreak: 0,
    isLoading: false,
    isUpdating: false,
    error: null,
    success: null,
  });

  // Load user progress data
  const loadProgressData = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [analytics, weeklyProgress, streak] = await Promise.all([
        // getUserProgress(user.id), // Temporarily commented out
        getUserProgressAnalytics(user.id),
        getWeeklyProgressSummary(user.id),
        getUserLearningStreak(user.id),
      ]);

      setState(prev => ({
        ...prev,
        userProgress: [], // Temporarily simplified
        analytics,
        weeklyProgress,
        learningStreak: streak,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load progress data',
      }));
    }
  }, [user]);

  // Mark content as completed
  const markCompleted = useCallback(
    async (courseId: string, contentId: string, score?: number) => {
      if (!user) {
        setState(prev => ({ ...prev, error: 'User must be authenticated' }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isUpdating: true,
        error: null,
        success: null,
      }));

      try {
        await markContentCompletedWithRewards(
          user.id,
          courseId,
          contentId,
          score
        );

        setState(prev => ({
          ...prev,
          isUpdating: false,
          success: 'Progress updated successfully!',
        }));

        // Reload progress data
        setTimeout(loadProgressData, 1000);
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isUpdating: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update progress',
        }));
        return false;
      }
    },
    [user, loadProgressData]
  );

  // Get course progress
  const getCourseProgress = useCallback(
    async (courseId: string) => {
      if (!user) return [];

      try {
        return await getUserCourseProgress(user.id, courseId);
      } catch (error) {
        console.error('Error getting course progress:', error);
        return [];
      }
    },
    [user]
  );

  // Check if course is completed
  const isCourseCompleted = useCallback(
    async (courseId: string) => {
      if (!user) return false;

      try {
        return await checkCourseCompletion(user.id, courseId);
      } catch (error) {
        console.error('Error checking course completion:', error);
        return false;
      }
    },
    [user]
  );

  // Get completion stats
  const getCompletionStats = useCallback(async () => {
    if (!user) return null;

    try {
      return await getUserCompletionStats(user.id);
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return null;
    }
  }, [user]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Load progress data on mount and user change
  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Get progress percentage for a course
  const getCourseProgressPercentage = useCallback(
    (courseId: string) => {
      const courseProgress = state.userProgress.filter(
        p => p.course_id === courseId
      );
      const totalContent = 9; // This should come from course structure
      const completedContent = courseProgress.filter(
        p => p.completed_at
      ).length;
      return Math.round((completedContent / totalContent) * 100);
    },
    [state.userProgress]
  );

  // Get recent activity
  const getRecentActivity = useCallback(
    (limit: number = 5) => {
      return state.userProgress
        .filter(p => p.completed_at)
        .sort(
          (a, b) =>
            new Date(b.completed_at!).getTime() -
            new Date(a.completed_at!).getTime()
        )
        .slice(0, limit);
    },
    [state.userProgress]
  );

  // Get activity by date range
  const getActivityByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return state.userProgress.filter(p => {
        if (!p.completed_at) return false;
        const completionDate = new Date(p.completed_at);
        return completionDate >= startDate && completionDate <= endDate;
      });
    },
    [state.userProgress]
  );

  // Calculate points earned this week
  const getPointsThisWeek = useCallback(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekActivity = getActivityByDateRange(oneWeekAgo, new Date());
    return thisWeekActivity.length * 5; // 5 points per completion
  }, [getActivityByDateRange]);

  // Get learning momentum (activities in last 3 days)
  const getLearningMomentum = useCallback(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentActivity = getActivityByDateRange(threeDaysAgo, new Date());
    return recentActivity.length;
  }, [getActivityByDateRange]);

  return {
    // State
    ...state,

    // Actions
    markCompleted,
    getCourseProgress,
    isCourseCompleted,
    getCompletionStats,
    loadProgressData,
    clearMessages,

    // Computed values
    getCourseProgressPercentage,
    getRecentActivity,
    getActivityByDateRange,
    getPointsThisWeek,
    getLearningMomentum,

    // Status
    isAuthenticated: !!user,
    hasProgress: state.userProgress.length > 0,
  };
}
