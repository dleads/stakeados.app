'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import {
  realTimeService,
  AdminNotification,
} from '@/lib/services/realTimeService';
import { toast } from 'sonner';

export interface NotificationSettings {
  enableToasts: boolean;
  enableSound: boolean;
  enableDesktop: boolean;
  priorities: ('low' | 'medium' | 'high' | 'critical')[];
}

const defaultSettings: NotificationSettings = {
  enableToasts: true,
  enableSound: true,
  enableDesktop: true,
  priorities: ['medium', 'high', 'critical'],
};

export function useRealTimeNotifications(
  settings: NotificationSettings = defaultSettings
) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Load existing notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(
          data.notifications?.filter((n: AdminNotification) => !n.read)
            .length || 0
        );
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user?.id]);

  // Handle new notification
  const handleNewNotification = useCallback(
    (notification: AdminNotification) => {
      // Check if notification priority is enabled
      if (!settings.priorities.includes(notification.priority)) {
        return;
      }

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      if (settings.enableToasts) {
        const toastOptions = {
          duration: notification.priority === 'critical' ? 10000 : 5000,
          action: notification.data?.actionUrl
            ? {
                label: 'View',
                onClick: () =>
                  (window.location.href = notification.data.actionUrl),
              }
            : undefined,
        };

        switch (notification.priority) {
          case 'critical':
            toast.error(notification.title, {
              description: notification.message,
              ...toastOptions,
            });
            break;
          case 'high':
            toast.warning(notification.title, {
              description: notification.message,
              ...toastOptions,
            });
            break;
          case 'medium':
            toast.info(notification.title, {
              description: notification.message,
              ...toastOptions,
            });
            break;
          case 'low':
            toast(notification.title, {
              description: notification.message,
              ...toastOptions,
            });
            break;
        }
      }

      // Play sound
      if (settings.enableSound && notification.priority !== 'low') {
        playNotificationSound(notification.priority);
      }

      // Show desktop notification
      if (settings.enableDesktop && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
              });
            }
          });
        }
      }
    },
    [settings]
  );

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    try {
      const audio = new Audio();
      switch (priority) {
        case 'critical':
          audio.src = '/sounds/critical-alert.mp3';
          break;
        case 'high':
          audio.src = '/sounds/high-alert.mp3';
          break;
        default:
          audio.src = '/sounds/notification.mp3';
          break;
      }
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(
          `/api/admin/notifications/${notificationId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          setUnreadCount(prev => {
            const notification = notifications.find(
              n => n.id === notificationId
            );
            return notification && !notification.read ? prev - 1 : prev;
          });
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [notifications]
  );

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    const unsubscribe = realTimeService.subscribeToAdminNotifications(
      user.id,
      handleNewNotification
    );

    // Check connection status
    const checkConnection = () => {
      setIsConnected(realTimeService.getConnectionStatus());
    };

    checkConnection();
    const connectionInterval = setInterval(checkConnection, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
    };
  }, [user?.id, handleNewNotification, loadNotifications]);

  // Request desktop notification permission on mount
  useEffect(() => {
    if (settings.enableDesktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.enableDesktop]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: loadNotifications,
  };
}
