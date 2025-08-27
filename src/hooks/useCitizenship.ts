import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CitizenshipProgress } from '@/types/gamification';

export function useCitizenshipProgress(userId?: string) {
  return useQuery({
    queryKey: ['citizenship-progress', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/citizenship/progress${params}`);
      if (!response.ok) throw new Error('Failed to fetch citizenship progress');
      const data = await response.json();
      return data.progress as CitizenshipProgress;
    },
    enabled: !!userId,
  });
}

export function useEligibleUsers() {
  return useQuery({
    queryKey: ['citizenship-eligible-users'],
    queryFn: async () => {
      const response = await fetch('/api/citizenship/eligible');
      if (!response.ok) throw new Error('Failed to fetch eligible users');
      const data = await response.json();
      return {
        eligibleUsers: data.eligibleUsers as Array<{
          userId: string;
          userName: string;
          eligibleAt: Date;
          claimed: boolean;
        }>,
        stats: data.stats as {
          totalEligible: number;
          totalClaimed: number;
          recentlyEligible: number;
          claimRate: number;
        },
      };
    },
  });
}

export function useCheckCitizenshipEligibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const response = await fetch('/api/citizenship/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'check_eligibility',
        }),
      });

      if (!response.ok)
        throw new Error('Failed to check citizenship eligibility');
      return response.json();
    },
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['citizenship-progress', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['citizenship-eligible-users'],
      });

      // Show notification if newly eligible
      if (data.newlyEligible) {
        // You can integrate with your notification system here
        console.log('User is now eligible for citizenship NFT!');
      }
    },
  });
}

export function useClaimCitizenshipNFT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nftTokenId?: string) => {
      const response = await fetch('/api/citizenship/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftTokenId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim citizenship NFT');
      }

      return response.json();
    },
    onSuccess: (_data, _variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['citizenship-progress'] });
      queryClient.invalidateQueries({
        queryKey: ['citizenship-eligible-users'],
      });
      queryClient.invalidateQueries({ queryKey: ['contributor-stats'] });

      console.log('Citizenship NFT claimed successfully!');
    },
  });
}

// Hook for automatic citizenship checking after content contributions
export function useCitizenshipTracker() {
  const checkEligibility = useCheckCitizenshipEligibility();

  const trackContribution = async (userId: string) => {
    // Automatically check citizenship eligibility after a contribution
    setTimeout(() => {
      checkEligibility.mutate(userId);
    }, 1000); // Small delay to ensure contribution is processed
  };

  return {
    trackContribution,
    isChecking: checkEligibility.isPending,
  };
}

// Hook for citizenship notifications
export function useCitizenshipNotifications() {
  const { data: progress } = useCitizenshipProgress();

  const getNotifications = () => {
    const notifications = [];

    if (progress) {
      // Newly eligible notification
      if (progress.isEligible) {
        notifications.push({
          type: 'success' as const,
          title: 'Citizenship Eligible!',
          message: 'You can now claim your citizenship NFT',
          action: 'claim_nft',
        });
      }

      // Close to milestone notifications
      if (!progress.isEligible && progress.progressPercentage >= 80) {
        notifications.push({
          type: 'info' as const,
          title: 'Almost There!',
          message: `You're ${100 - progress.progressPercentage}% away from citizenship`,
          action: 'view_progress',
        });
      }

      // Next milestone notification
      if (progress.nextMilestone) {
        const remaining =
          progress.nextMilestone.target - progress.nextMilestone.current;
        if (remaining <= 2 && remaining > 0) {
          notifications.push({
            type: 'info' as const,
            title: 'Close to Milestone',
            message: `Only ${remaining} more ${progress.nextMilestone.requirement.toLowerCase()} needed`,
            action: 'contribute',
          });
        }
      }
    }

    return notifications;
  };

  return {
    notifications: getNotifications(),
    hasNotifications: getNotifications().length > 0,
  };
}
