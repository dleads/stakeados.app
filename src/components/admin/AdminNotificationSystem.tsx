'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bell,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export default function AdminNotificationSystem() {
  const t = useTranslations('admin.notifications');
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: '1',
      type: 'info',
      title: t('pendingArticles.title'),
      message: t('pendingArticles.message', { count: 3 }),
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      actionUrl: '/admin/articles?status=pending',
      actionLabel: t('actions.review'),
    },
    {
      id: '2',
      type: 'warning',
      title: t('rssSourceDown.title'),
      message: t('rssSourceDown.message', { source: 'TechNews', hours: 2 }),
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionUrl: '/admin/news-sources',
      actionLabel: t('actions.verify'),
    },
    {
      id: '3',
      type: 'success',
      title: t('backupCompleted.title'),
      message: t('backupCompleted.message'),
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
    },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Get notification icon
  const getNotificationIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-stakeados-primary" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-stakeados-yellow" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-stakeados-red" />;
      default:
        return <Info className="w-5 h-5 text-stakeados-blue" />;
    }
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t('time.now');
    if (diffInMinutes < 60) return t('time.minutes', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('time.hours', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    return t('time.days', { count: diffInDays });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-gaming transition-all duration-200',
          isOpen
            ? 'bg-stakeados-primary/20 text-stakeados-primary'
            : 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700'
        )}
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-stakeados-red text-white text-xs font-semibold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stakeados-gray-700">
            <div>
              <h3 className="font-semibold text-white">{t('title')}</h3>
              <p className="text-xs text-stakeados-gray-400">
                {unreadCount > 0
                  ? t('unreadCount', { count: unreadCount })
                  : t('allCaughtUp')}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-stakeados-primary hover:text-stakeados-primary-light transition-colors"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-3" />
                <p className="text-stakeados-gray-400">{t('empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-stakeados-gray-700">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-stakeados-gray-800/50 transition-colors relative',
                      !notification.read &&
                        'bg-stakeados-primary/5 border-l-2 border-stakeados-primary'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-stakeados-gray-300 mt-1">
                              {notification.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
                                title={t('markAsRead')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                removeNotification(notification.id)
                              }
                              className="p-1 text-stakeados-gray-400 hover:text-stakeados-red transition-colors"
                              title={t('removeNotification')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-stakeados-gray-500">
                            {formatRelativeTime(notification.timestamp)}
                          </span>

                          {notification.actionUrl &&
                            notification.actionLabel && (
                              <button
                                onClick={() => {
                                  // Navigate to action URL
                                  window.location.href =
                                    notification.actionUrl!;
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="text-xs text-stakeados-primary hover:text-stakeados-primary-light transition-colors font-medium"
                              >
                                {notification.actionLabel}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-stakeados-gray-700 text-center">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/admin/notifications';
                  setIsOpen(false);
                }}
                className="text-sm text-stakeados-primary hover:text-stakeados-primary-light transition-colors"
              >
                {t('viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
