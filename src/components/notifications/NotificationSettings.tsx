'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell, Settings, Users, BarChart3 } from 'lucide-react';
import { SubscriptionManager } from './SubscriptionManager';
import { NotificationPreferences } from './NotificationPreferences';
import { NotificationCenter } from './NotificationCenter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface NotificationSettingsProps {
  className?: string;
  defaultTab?: string;
}

export function NotificationSettings({
  className,
  defaultTab = 'notifications',
}: NotificationSettingsProps) {
  const t = useTranslations('notifications');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/stats');
      if (!response.ok) throw new Error('Failed to fetch notification stats');
      const data = await response.json();
      return data.stats;
    },
    enabled: !!user?.id,
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/stats');
      if (!response.ok) throw new Error('Failed to fetch subscription stats');
      const data = await response.json();
      return data.stats;
    },
    enabled: !!user?.id,
  });

  return (
    <div className={className}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-2">{t('settings.description')}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Notifications
                </p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{stats?.unread || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Subscriptions
                </p>
                <p className="text-2xl font-bold">
                  {subscriptionStats?.totalSubscriptions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-bold">
                  {subscriptionStats?.activeSubscriptions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            {t('settings.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            {t('settings.tabs.subscriptions')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            {t('settings.tabs.preferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('center.title')}</CardTitle>
              <CardDescription>{t('center.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationCenter showHeader={false} maxHeight="600px" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
