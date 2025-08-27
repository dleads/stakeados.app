'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferences } from '@/types/notifications';

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }
      const data = await response.json();
      return data.preferences as NotificationPreferences;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      const data = await response.json();
      return data.preferences as NotificationPreferences;
    },
    onSuccess: updatedPreferences => {
      queryClient.setQueryData(
        ['notification-preferences'],
        updatedPreferences
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to reset notification preferences');
      }
      const data = await response.json();
      return data.preferences as NotificationPreferences;
    },
    onSuccess: resetPreferences => {
      queryClient.setQueryData(['notification-preferences'], resetPreferences);
    },
  });

  return {
    preferences,
    isLoading,
    error,
    refetch,
    updatePreferences: updateMutation.mutate,
    resetPreferences: resetMutation.mutate,
    isUpdating: updateMutation.isPending,
    isResetting: resetMutation.isPending,
  };
}

export function useQuietHoursStatus() {
  return useQuery({
    queryKey: ['quiet-hours-status'],
    queryFn: async () => {
      const response = await fetch(
        '/api/notifications/preferences/quiet-hours'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch quiet hours status');
      }
      const data = await response.json();
      return data.status as {
        inQuietHours: boolean;
        nextActiveTime?: Date;
      };
    },
    refetchInterval: 60000, // Refetch every minute to keep status current
  });
}
