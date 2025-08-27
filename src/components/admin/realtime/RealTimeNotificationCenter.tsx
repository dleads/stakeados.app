'use client';

import React, { useState } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useRealTimeNotifications,
  NotificationSettings,
} from '@/hooks/useRealTimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealTimeNotificationCenterProps {
  className?: string;
}

export function RealTimeNotificationCenter({
  className,
}: RealTimeNotificationCenterProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enableToasts: true,
    enableSound: true,
    enableDesktop: true,
    priorities: ['medium', 'high', 'critical'],
  });

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useRealTimeNotifications(settings);

  const [showSettings, setShowSettings] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'article_status_change':
        return '📝';
      case 'news_processed':
        return '📰';
      case 'ai_processing_complete':
        return '🤖';
      case 'system_alert':
        return '⚠️';
      case 'user_activity':
        return '👤';
      default:
        return '📢';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl;
    }
  };

  const updateSettings = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePriority = (priority: string) => {
    setSettings(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority as any)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority as any],
    }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <div
            className={`absolute top-0 right-0 h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Circle
                    className={`h-2 w-2 fill-current ${
                      isConnected ? 'text-green-500' : 'text-red-500'
                    }`}
                  />
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {unreadCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{unreadCount} sin leer</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas como leídas
                </Button>
              </div>
            )}

            {showSettings && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-toasts" className="text-sm">
                    Mostrar toasts
                  </Label>
                  <Switch
                    id="enable-toasts"
                    checked={settings.enableToasts}
                    onCheckedChange={checked =>
                      updateSettings('enableToasts', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-sound" className="text-sm">
                    Sonido
                  </Label>
                  <Switch
                    id="enable-sound"
                    checked={settings.enableSound}
                    onCheckedChange={checked =>
                      updateSettings('enableSound', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-desktop" className="text-sm">
                    Notificaciones del navegador
                  </Label>
                  <Switch
                    id="enable-desktop"
                    checked={settings.enableDesktop}
                    onCheckedChange={checked =>
                      updateSettings('enableDesktop', checked)
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm">Prioridades habilitadas:</Label>
                  <div className="flex gap-2 mt-1">
                    {['low', 'medium', 'high', 'critical'].map(priority => (
                      <Button
                        key={priority}
                        variant={
                          settings.priorities.includes(priority as any)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => togglePriority(priority)}
                        className="text-xs"
                      >
                        {priority}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer border-l-4 ${
                        notification.read ? 'opacity-60' : ''
                      } ${getPriorityColor(notification.priority)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Circle className="h-2 w-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.created_at, {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>

                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar todas
                </Button>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
