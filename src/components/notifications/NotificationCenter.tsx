'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, CheckCheck, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types/notifications';

interface NotificationCenterProps {
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

export function NotificationCenter({
  className,
  showHeader = true,
  maxHeight = '400px',
}: NotificationCenterProps) {
  const t = useTranslations('notifications');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.notifications as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count as number;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
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
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.data.articleId) {
      window.open(`/articles/${notification.data.articleId}`, '_blank');
    } else if (notification.data.newsId) {
      window.open(`/news/${notification.data.newsId}`, '_blank');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_article':
        return '📄';
      case 'new_news':
        return '📰';
      case 'article_approved':
        return '✅';
      case 'proposal_reviewed':
        return '👀';
      case 'breaking_news':
        return '🚨';
      default:
        return '🔔';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t('common.justNow');
    if (diffInMinutes < 60)
      return t('common.minutesAgo', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('common.hoursAgo', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    return t('common.daysAgo', { count: diffInDays });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              {t('center.title')}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              {t('center.title')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('center.empty.title')}
            </h3>
            <p className="text-gray-600">{t('center.empty.description')}</p>
          </div>
        ) : (
          <ScrollArea style={{ height: maxHeight }}>
            <div className="p-4 space-y-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      notification.isRead
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title.en ||
                              Object.values(notification.title)[0]}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message.en ||
                            Object.values(notification.message)[0]}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {t(`types.${notification.type}`)}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {notification.deliveryStatus.email === 'sent' && (
                              <span title="Email sent">📧</span>
                            )}
                            {notification.deliveryStatus.push === 'sent' && (
                              <span title="Push sent">📱</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
