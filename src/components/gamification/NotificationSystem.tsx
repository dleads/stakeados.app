import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'achievement' | 'points' | 'milestone' | 'streak' | 'badge';
  title: string;
  message: string;
  icon: React.ReactNode;
  color: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationSystemProps {
  className?: string;
}

export default function NotificationSystem({
  className = '',
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) {
      setShowNotifications(false);
    }
  };

  const dismissAll = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  if (!showNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-3 ${className}`}>
      {notifications.slice(0, 3).map(notification => (
        <div
          key={notification.id}
          className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg p-4 min-w-[300px] max-w-[400px] animate-slide-in-right"
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${notification.color}`}>
              {notification.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">
                {notification.title}
              </h4>
              <p className="text-stakeados-gray-300 text-sm">
                {notification.message}
              </p>
              <div className="text-xs text-stakeados-gray-500 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>

            <button
              onClick={() => dismissNotification(notification.id)}
              className="flex-shrink-0 text-stakeados-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar for auto-dismiss */}
          <div className="mt-3 h-1 bg-stakeados-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-stakeados-primary rounded-full animate-progress-bar" />
          </div>
        </div>
      ))}

      {notifications.length > 3 && (
        <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg p-3 text-center">
          <p className="text-stakeados-gray-300 text-sm mb-2">
            +{notifications.length - 3} more notifications
          </p>
          <button onClick={dismissAll} className="btn-ghost text-xs">
            Dismiss All
          </button>
        </div>
      )}
    </div>
  );
}
