import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ContentContribution,
  ContributorStats,
  ContributorAchievement,
  LeaderboardEntry,
  PointsBreakdown,
  CitizenshipProgress,
  PointsAwardRequest,
} from '@/types/gamification';

export function useContributorStats(userId?: string) {
  return useQuery({
    queryKey: ['contributor-stats', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/gamification/stats${params}`);
      if (!response.ok) throw new Error('Failed to fetch contributor stats');
      const data = await response.json();
      return data.stats as ContributorStats;
    },
    enabled: !!userId,
  });
}

export function useUserContributions(userId?: string, limit = 20) {
  return useQuery({
    queryKey: ['user-contributions', userId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/gamification/points?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contributions');
      const data = await response.json();
      return {
        contributions: data.contributions as ContentContribution[],
        breakdown: data.breakdown as PointsBreakdown,
      };
    },
    enabled: !!userId,
  });
}

export function useLeaderboard(
  type: 'points' | 'articles' | 'quality' = 'points',
  limit = 50
) {
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('type', type);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/gamification/leaderboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      return data.leaderboard as LeaderboardEntry[];
    },
  });
}

export function useUserAchievements(userId?: string) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/gamification/achievements${params}`);
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const data = await response.json();
      return data.achievements as ContributorAchievement[];
    },
    enabled: !!userId,
  });
}

export function useCitizenshipProgress(userId?: string) {
  return useQuery({
    queryKey: ['citizenship-progress', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/gamification/citizenship${params}`);
      if (!response.ok) throw new Error('Failed to fetch citizenship progress');
      const data = await response.json();
      return data.progress as CitizenshipProgress;
    },
    enabled: !!userId,
  });
}

export function useAwardPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PointsAwardRequest) => {
      const response = await fetch('/api/gamification/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Failed to award points');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['contributor-stats', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-contributions', variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({
        queryKey: ['citizenship-progress', variables.userId],
      });

      // Show achievement notifications if any
      if (data.newAchievements?.length > 0) {
        // You can integrate with your notification system here
        console.log('New achievements earned:', data.newAchievements);
      }
    },
  });
}

export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch('/api/gamification/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to check achievements');
      return response.json();
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({
        queryKey: ['user-achievements', userId],
      });

      if (data.newAchievements?.length > 0) {
        console.log('New achievements earned:', data.newAchievements);
      }
    },
  });
}

// Hook for tracking content interactions and awarding points
export function useContentInteraction() {
  const awardPoints = useAwardPoints();

  const trackArticlePublication = async (
    articleId: string,
    authorId: string
  ) => {
    return awardPoints.mutateAsync({
      userId: authorId,
      contentId: articleId,
      contentType: 'article',
      contributionType: 'author',
      basePoints: 15,
    });
  };

  const trackReviewCompletion = async (
    proposalId: string,
    reviewerId: string
  ) => {
    return awardPoints.mutateAsync({
      userId: reviewerId,
      contentId: proposalId,
      contentType: 'proposal',
      contributionType: 'reviewer',
      basePoints: 5,
    });
  };

  const trackEditorialContribution = async (
    contentId: string,
    editorId: string
  ) => {
    return awardPoints.mutateAsync({
      userId: editorId,
      contentId,
      contentType: 'article',
      contributionType: 'editor',
      basePoints: 3,
    });
  };

  const trackTranslation = async (contentId: string, translatorId: string) => {
    return awardPoints.mutateAsync({
      userId: translatorId,
      contentId,
      contentType: 'article',
      contributionType: 'translator',
      basePoints: 8,
    });
  };

  return {
    trackArticlePublication,
    trackReviewCompletion,
    trackEditorialContribution,
    trackTranslation,
    isLoading: awardPoints.isPending,
  };
}

// Hook for gamification notifications
export function useGamificationNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'points' | 'achievement' | 'milestone';
      title: string;
      message: string;
      points?: number;
      achievement?: ContributorAchievement;
      timestamp: Date;
    }>
  >([]);

  const addNotification = (
    notification: Omit<(typeof notifications)[0], 'id' | 'timestamp'>
  ) => {
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 most recent
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}

// Main hook that combines all gamification functionality
export function useGamification(userId?: string) {
  const stats = useContributorStats(userId);
  const contributions = useUserContributions(userId);
  const achievements = useUserAchievements(userId);
  const citizenshipProgress = useCitizenshipProgress(userId);
  const contentInteraction = useContentInteraction();
  const notifications = useGamificationNotifications();

  return {
    stats,
    contributions,
    achievements,
    citizenshipProgress,
    contentInteraction,
    notifications,
    isLoading:
      stats.isLoading ||
      contributions.isLoading ||
      achievements.isLoading ||
      citizenshipProgress.isLoading,
  };
}
