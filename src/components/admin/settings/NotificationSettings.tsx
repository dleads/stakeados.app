'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Bell,
  Mail,
  MessageSquare,
} from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  event: string;
  channels: string[];
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  enabled: boolean;
}

interface NotificationConfig {
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromAddress: string;
    fromName: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  inApp: {
    enabled: boolean;
    retentionDays: number;
  };
  rules: NotificationRule[];
}

export default function NotificationSettings() {
  const t = useTranslations('admin.settings.notifications');
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading notification configuration:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success(t('success.saved'));
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving notification configuration:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch(
        '/api/admin/settings/notifications/test-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config?.email),
        }
      );

      if (response.ok) {
        toast.success(t('success.emailTestSent'));
      } else {
        const error = await response.json();
        toast.error(t('errors.emailTestFailed', { error: error.message }));
      }
    } catch (error) {
      console.error('Error testing email configuration:', error);
      toast.error(t('errors.emailTestFailed', { error: 'Network error' }));
    } finally {
      setTestingEmail(false);
    }
  };

  const testSlackConfiguration = async () => {
    setTestingSlack(true);
    try {
      const response = await fetch(
        '/api/admin/settings/notifications/test-slack',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config?.slack),
        }
      );

      if (response.ok) {
        toast.success(t('success.slackTestSent'));
      } else {
        const error = await response.json();
        toast.error(t('errors.slackTestFailed', { error: error.message }));
      }
    } catch (error) {
      console.error('Error testing Slack configuration:', error);
      toast.error(t('errors.slackTestFailed', { error: 'Network error' }));
    } finally {
      setTestingSlack(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setConfig(newConfig);
  };

  const addNotificationRule = () => {
    if (!config) return;

    const newRule: NotificationRule = {
      id: Date.now().toString(),
      name: t('rules.newRule'),
      event: 'article_published',
      channels: ['inApp'],
      conditions: [],
      enabled: true,
    };

    setConfig({
      ...config,
      rules: [...config.rules, newRule],
    });
  };

  const updateRule = (ruleId: string, updates: Partial<NotificationRule>) => {
    if (!config) return;

    setConfig({
      ...config,
      rules: config.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    });
  };

  const deleteRule = (ruleId: string) => {
    if (!config) return;

    setConfig({
      ...config,
      rules: config.rules.filter(rule => rule.id !== ruleId),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">{t('errors.noConfig')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('email.title')}
          </CardTitle>
          <CardDescription>{t('email.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="emailEnabled"
              checked={config.email.enabled}
              onCheckedChange={checked =>
                updateConfig('email.enabled', checked)
              }
            />
            <Label htmlFor="emailEnabled">{t('email.enabled')}</Label>
          </div>

          {config.email.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">{t('email.smtpHost')}</Label>
                  <Input
                    id="smtpHost"
                    value={config.email.smtpHost}
                    onChange={e =>
                      updateConfig('email.smtpHost', e.target.value)
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">{t('email.smtpPort')}</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={config.email.smtpPort}
                    onChange={e =>
                      updateConfig('email.smtpPort', parseInt(e.target.value))
                    }
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromAddress">{t('email.fromAddress')}</Label>
                  <Input
                    id="fromAddress"
                    type="email"
                    value={config.email.fromAddress}
                    onChange={e =>
                      updateConfig('email.fromAddress', e.target.value)
                    }
                    placeholder="noreply@stakeados.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromName">{t('email.fromName')}</Label>
                  <Input
                    id="fromName"
                    value={config.email.fromName}
                    onChange={e =>
                      updateConfig('email.fromName', e.target.value)
                    }
                    placeholder="Stakeados Admin"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={testEmailConfiguration}
                disabled={testingEmail}
              >
                {testingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {t('email.testConnection')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slack Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('slack.title')}
          </CardTitle>
          <CardDescription>{t('slack.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="slackEnabled"
              checked={config.slack.enabled}
              onCheckedChange={checked =>
                updateConfig('slack.enabled', checked)
              }
            />
            <Label htmlFor="slackEnabled">{t('slack.enabled')}</Label>
          </div>

          {config.slack.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">{t('slack.webhookUrl')}</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={config.slack.webhookUrl}
                  onChange={e =>
                    updateConfig('slack.webhookUrl', e.target.value)
                  }
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slackChannel">{t('slack.channel')}</Label>
                <Input
                  id="slackChannel"
                  value={config.slack.channel}
                  onChange={e => updateConfig('slack.channel', e.target.value)}
                  placeholder="#admin-notifications"
                />
              </div>

              <Button
                variant="outline"
                onClick={testSlackConfiguration}
                disabled={testingSlack}
              >
                {testingSlack ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                {t('slack.testConnection')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('inApp.title')}
          </CardTitle>
          <CardDescription>{t('inApp.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="inAppEnabled"
              checked={config.inApp.enabled}
              onCheckedChange={checked =>
                updateConfig('inApp.enabled', checked)
              }
            />
            <Label htmlFor="inAppEnabled">{t('inApp.enabled')}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retentionDays">{t('inApp.retentionDays')}</Label>
            <Input
              id="retentionDays"
              type="number"
              value={config.inApp.retentionDays}
              onChange={e =>
                updateConfig('inApp.retentionDays', parseInt(e.target.value))
              }
              min="1"
              max="365"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Rules */}
      <Card>
        <CardHeader>
          <CardTitle>{t('rules.title')}</CardTitle>
          <CardDescription>{t('rules.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">{t('rules.activeRules')}</h4>
            <Button onClick={addNotificationRule} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('rules.addRule')}
            </Button>
          </div>

          <div className="space-y-3">
            {config.rules.map(rule => (
              <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={checked =>
                        updateRule(rule.id, { enabled: checked })
                      }
                    />
                    <Input
                      value={rule.name}
                      onChange={e =>
                        updateRule(rule.id, { name: e.target.value })
                      }
                      className="font-medium"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('rules.event')}</Label>
                    <Select
                      value={rule.event}
                      onValueChange={value =>
                        updateRule(rule.id, { event: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article_published">
                          {t('rules.events.articlePublished')}
                        </SelectItem>
                        <SelectItem value="article_submitted">
                          {t('rules.events.articleSubmitted')}
                        </SelectItem>
                        <SelectItem value="news_processed">
                          {t('rules.events.newsProcessed')}
                        </SelectItem>
                        <SelectItem value="system_error">
                          {t('rules.events.systemError')}
                        </SelectItem>
                        <SelectItem value="backup_completed">
                          {t('rules.events.backupCompleted')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('rules.channels')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['inApp', 'email', 'slack'].map(channel => (
                        <Badge
                          key={channel}
                          variant={
                            rule.channels.includes(channel)
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const channels = rule.channels.includes(channel)
                              ? rule.channels.filter(c => c !== channel)
                              : [...rule.channels, channel];
                            updateRule(rule.id, { channels });
                          }}
                        >
                          {t(`rules.channelTypes.${channel}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfiguration} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('actions.save')}
        </Button>
      </div>
    </div>
  );
}
