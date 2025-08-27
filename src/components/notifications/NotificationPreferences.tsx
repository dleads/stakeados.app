'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Globe,
  Settings,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { notificationPreferencesService } from '@/lib/services/notificationPreferencesService';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationPreferences } from '@/types/notifications';

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferences({
  className,
}: NotificationPreferencesProps) {
  const t = useTranslations('notifications');
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);
  const [quietHoursStatus, setQuietHoursStatus] = useState<{
    inQuietHours: boolean;
    nextActiveTime?: Date;
  }>({ inQuietHours: false });

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
      loadTimezones();
      checkQuietHours();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await notificationPreferencesService.getUserPreferences(
        user!.id
      );
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimezones = async () => {
    try {
      const timezones =
        await notificationPreferencesService.getAvailableTimezones();
      setAvailableTimezones(timezones);
    } catch (error) {
      console.error('Error loading timezones:', error);
    }
  };

  const checkQuietHours = async () => {
    try {
      const status = await notificationPreferencesService.getQuietHoursStatus(
        user!.id
      );
      setQuietHoursStatus(status);
    } catch (error) {
      console.error('Error checking quiet hours:', error);
    }
  };

  const handleUpdatePreferences = async (
    updates: Partial<NotificationPreferences>
  ) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updated =
        await notificationPreferencesService.updateUserPreferences(
          user!.id,
          updates
        );
      setPreferences(updated);

      // Recheck quiet hours if time-related settings changed
      if (
        updates.quietHoursStart ||
        updates.quietHoursEnd ||
        updates.timezone
      ) {
        await checkQuietHours();
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setSaving(true);
      const defaultPreferences =
        await notificationPreferencesService.resetToDefaults(user!.id);
      setPreferences(defaultPreferences);
      await checkQuietHours();
    } catch (error) {
      console.error('Error resetting preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPreferences = async () => {
    try {
      const exported = await notificationPreferencesService.exportPreferences(
        user!.id
      );
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notification-preferences.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting preferences:', error);
    }
  };

  const handleImportPreferences = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const text = await file.text();
      const imported = await notificationPreferencesService.importPreferences(
        user!.id,
        text
      );
      setPreferences(imported);
      await checkQuietHours();
    } catch (error) {
      console.error('Error importing preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t('preferences.title')}</h2>
          <p className="text-gray-600">{t('preferences.description')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportPreferences}>
            <Download className="w-4 h-4 mr-2" />
            {t('preferences.export')}
          </Button>
          <label className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            {t('preferences.import')}
            <input
              type="file"
              accept=".json"
              onChange={handleImportPreferences}
              className="hidden"
            />
          </label>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('preferences.reset')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              {t('preferences.deliveryMethods.title')}
            </CardTitle>
            <CardDescription>
              {t('preferences.deliveryMethods.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="text-base font-medium">
                    {t('preferences.deliveryMethods.inApp')}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {t('preferences.deliveryMethods.inAppDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.inAppEnabled}
                onCheckedChange={checked =>
                  handleUpdatePreferences({ inAppEnabled: checked })
                }
                disabled={saving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="text-base font-medium">
                    {t('preferences.deliveryMethods.email')}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {t('preferences.deliveryMethods.emailDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={checked =>
                  handleUpdatePreferences({ emailEnabled: checked })
                }
                disabled={saving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <div>
                  <Label className="text-base font-medium">
                    {t('preferences.deliveryMethods.push')}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {t('preferences.deliveryMethods.pushDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.pushEnabled}
                onCheckedChange={checked =>
                  handleUpdatePreferences({ pushEnabled: checked })
                }
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Digest Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.digest.title')}</CardTitle>
            <CardDescription>
              {t('preferences.digest.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  {t('preferences.digest.frequency')}
                </Label>
                <Select
                  value={preferences.digestFrequency}
                  onValueChange={value =>
                    handleUpdatePreferences({
                      digestFrequency: value as 'daily' | 'weekly' | 'none',
                    })
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t('preferences.digest.none')}
                    </SelectItem>
                    <SelectItem value="daily">
                      {t('preferences.digest.daily')}
                    </SelectItem>
                    <SelectItem value="weekly">
                      {t('preferences.digest.weekly')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {t('preferences.quietHours.title')}
              {quietHoursStatus.inQuietHours && (
                <Badge variant="secondary" className="ml-2">
                  {t('preferences.quietHours.active')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t('preferences.quietHours.description')}
              {quietHoursStatus.nextActiveTime && (
                <span className="block mt-1 text-sm">
                  {t('preferences.quietHours.nextActive', {
                    time: quietHoursStatus.nextActiveTime.toLocaleTimeString(),
                  })}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('preferences.quietHours.start')}</Label>
                <Input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={e =>
                    handleUpdatePreferences({ quietHoursStart: e.target.value })
                  }
                  disabled={saving}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t('preferences.quietHours.end')}</Label>
                <Input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={e =>
                    handleUpdatePreferences({ quietHoursEnd: e.target.value })
                  }
                  disabled={saving}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              {t('preferences.timezone.title')}
            </CardTitle>
            <CardDescription>
              {t('preferences.timezone.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.timezone}
              onValueChange={value =>
                handleUpdatePreferences({ timezone: value })
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTimezones.map(timezone => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Category-specific Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.categories.title')}</CardTitle>
            <CardDescription>
              {t('preferences.categories.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(preferences.categories).length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  {t('preferences.categories.empty')}
                </p>
              ) : (
                Object.entries(preferences.categories).map(
                  ([categoryId, settings]) => (
                    <div
                      key={categoryId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <Label className="font-medium">
                          Category {categoryId}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {settings.enabled
                            ? t('preferences.categories.enabled')
                            : t('preferences.categories.disabled')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Select
                          value={settings.frequency}
                          onValueChange={value => {
                            const frequency = value as
                              | 'daily'
                              | 'weekly'
                              | 'immediate';
                            const updatedCategories = {
                              ...preferences.categories,
                              [categoryId]: { ...settings, frequency },
                            };
                            handleUpdatePreferences({
                              categories: updatedCategories,
                            });
                          }}
                          disabled={!settings.enabled || saving}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">
                              {t('subscriptions.frequency.immediate')}
                            </SelectItem>
                            <SelectItem value="daily">
                              {t('subscriptions.frequency.daily')}
                            </SelectItem>
                            <SelectItem value="weekly">
                              {t('subscriptions.frequency.weekly')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Switch
                          checked={settings.enabled}
                          onCheckedChange={enabled => {
                            const updatedCategories = {
                              ...preferences.categories,
                              [categoryId]: { ...settings, enabled },
                            };
                            handleUpdatePreferences({
                              categories: updatedCategories,
                            });
                          }}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NotificationPreferences;
