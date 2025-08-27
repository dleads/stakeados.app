'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Notification,
  NotificationFilters,
  NotificationStats,
  CreateNotificationRequest,
} from '@/types/notifications';

export function useNotifications(
  filters?: NotificationFilters,
  limit: number = 50,
  offset: number = 0
) {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', filters, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined)
        params.append('isRead', filters.isRead.toString());
      if (filters?.dateRange) {
        params.append('dateFrom', filters.dateRange.from.toISOString());
        params.append('dateTo', filters.dateRange.to.toISOString());
      }
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.notifications as Notification[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
        }
      );
      if (!response.ok) throw new Error('Failed to mark notification as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (!response.ok)
        throw new Error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (request: CreateNotificationRequest) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to create notification');
      const data = await response.json();
      return data.notification as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  return {
    notifications,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    createNotification: createNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isCreating: createNotificationMutation.isPending,
  };
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/stats');
      if (!response.ok) throw new Error('Failed to fetch notification stats');
      const data = await response.json();
      return data.stats as NotificationStats;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count as number;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
