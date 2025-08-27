'use client';

import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { X, Award, BookOpen, Crown, Users, AlertTriangle } from 'lucide-react';

interface InAppNotificationsProps {
  className?: string;
}

export default function InAppNotifications({
  className = '',
}: InAppNotificationsProps) {
  const { notifications, markAsRead } = useNotifications();

  // Only show unread notifications as toasts
  const toastNotifications = notifications.filter(n => !n.isRead).slice(0, 3); // Limit to 3 visible toasts

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_article':
        return <BookOpen className="w-5 h-5 text-stakeados-primary" />;
      case 'new_news':
        return <AlertTriangle className="w-5 h-5 text-stakeados-orange" />;
      case 'article_approved':
        return <Award className="w-5 h-5 text-stakeados-yellow" />;
      case 'proposal_reviewed':
        return <Users className="w-5 h-5 text-stakeados-blue" />;
      case 'breaking_news':
        return <Crown className="w-5 h-5 text-stakeados-yellow" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-stakeados-gray-400" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'new_article':
        return 'border-stakeados-primary bg-stakeados-primary/10';
      case 'new_news':
        return 'border-stakeados-orange bg-stakeados-orange/10';
      case 'article_approved':
        return 'border-stakeados-yellow bg-stakeados-yellow/10';
      case 'proposal_reviewed':
        return 'border-stakeados-blue bg-stakeados-blue/10';
      case 'breaking_news':
        return 'border-stakeados-yellow bg-stakeados-yellow/10';
      default:
        return 'border-stakeados-gray-600 bg-stakeados-gray-800';
    }
  };

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    toastNotifications.forEach(notification => {
      const timer = setTimeout(() => {
        markAsRead(notification.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [toastNotifications, markAsRead]);

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-3 ${className}`}>
      {toastNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`bg-gaming-card border rounded-gaming shadow-glow-lg p-4 min-w-[320px] max-w-[400px] animate-slide-in-right ${getNotificationStyle(notification.type)}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">
                {typeof notification.title === 'string'
                  ? notification.title
                  : notification.title?.en ||
                    notification.title?.es ||
                    'Notification'}
              </h4>
              <p className="text-sm text-stakeados-gray-300">
                {typeof notification.message === 'string'
                  ? notification.message
                  : notification.message?.en || notification.message?.es || ''}
              </p>

              {/* Action buttons for specific notification types */}
              {notification.type === 'new_article' &&
                notification.data?.articleId && (
                  <button className="mt-2 text-xs text-stakeados-primary hover:text-stakeados-primary-light transition-colors">
                    View Article →
                  </button>
                )}

              {notification.type === 'article_approved' && (
                <button className="mt-2 text-xs text-stakeados-yellow hover:text-stakeados-yellow/80 transition-colors">
                  View Article →
                </button>
              )}

              {notification.type === 'new_news' &&
                notification.data?.newsId && (
                  <button className="mt-2 text-xs text-stakeados-orange hover:text-stakeados-orange/80 transition-colors">
                    Read News →
                  </button>
                )}

              {notification.type === 'breaking_news' && (
                <button className="mt-2 text-xs text-stakeados-yellow hover:text-stakeados-yellow/80 transition-colors">
                  Read Breaking News →
                </button>
              )}
            </div>

            <button
              onClick={() => markAsRead(notification.id)}
              className="flex-shrink-0 text-stakeados-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Auto-dismiss progress bar */}
          <div className="mt-3 h-1 bg-stakeados-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-stakeados-primary rounded-full animate-progress-bar" />
          </div>
        </div>
      ))}
    </div>
  );
}
