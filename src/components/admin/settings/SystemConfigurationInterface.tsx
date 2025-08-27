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
import AIProcessingConfiguration from './AIProcessingConfiguration';
import NotificationSettings from './NotificationSettings';
import UserPermissionManagement from './UserPermissionManagement';
import BackupMaintenanceTools from './BackupMaintenanceTools';
import SEOConfiguration from './SEOConfiguration';
import StorageManagement from './StorageManagement';

export default function SystemConfigurationInterface() {
  const t = useTranslations('admin.settings');
  const [activeTab, setActiveTab] = useState('ai-processing');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ai-processing">
            {t('tabs.aiProcessing')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t('tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>
          <TabsTrigger value="seo">{t('tabs.seo')}</TabsTrigger>
          <TabsTrigger value="storage">{t('tabs.storage')}</TabsTrigger>
          <TabsTrigger value="backup">{t('tabs.backup')}</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('aiProcessing.title')}</CardTitle>
              <CardDescription>{t('aiProcessing.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AIProcessingConfiguration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.title')}</CardTitle>
              <CardDescription>
                {t('notifications.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('users.title')}</CardTitle>
              <CardDescription>{t('users.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserPermissionManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('seo.title')}</CardTitle>
              <CardDescription>{t('seo.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SEOConfiguration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('storage.title')}</CardTitle>
              <CardDescription>{t('storage.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <StorageManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('backup.title')}</CardTitle>
              <CardDescription>{t('backup.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <BackupMaintenanceTools />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
