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
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, RefreshCw } from 'lucide-react';

interface AIProcessingConfig {
  openai: {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
  processing: {
    batchSize: number;
    retryAttempts: number;
    duplicateThreshold: number;
    autoProcessing: boolean;
    processingSchedule: string;
  };
  translation: {
    enabled: boolean;
    targetLanguages: string[];
    qualityThreshold: number;
  };
  summarization: {
    enabled: boolean;
    maxLength: number;
    minLength: number;
  };
}

export default function AIProcessingConfiguration() {
  const t = useTranslations('admin.settings.aiProcessing');
  const [config, setConfig] = useState<AIProcessingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/settings/ai-processing');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading AI configuration:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/ai-processing', {
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
      console.error('Error saving AI configuration:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/settings/ai-processing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(
          t('success.testPassed', { responseTime: result.responseTime })
        );
      } else {
        toast.error(t('errors.testFailed', { error: result.error }));
      }
    } catch (error) {
      console.error('Error testing AI configuration:', error);
      toast.error(t('errors.testFailed', { error: 'Network error' }));
    } finally {
      setTesting(false);
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
        <Button onClick={loadConfiguration} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('openai.title')}</CardTitle>
          <CardDescription>{t('openai.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">{t('openai.model')}</Label>
              <Select
                value={config.openai.model}
                onValueChange={value => updateConfig('openai.model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">{t('openai.timeout')}</Label>
              <Input
                id="timeout"
                type="number"
                value={config.openai.timeout}
                onChange={e =>
                  updateConfig('openai.timeout', parseInt(e.target.value))
                }
                min="5"
                max="300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {t('openai.temperature')}: {config.openai.temperature}
            </Label>
            <Slider
              value={[config.openai.temperature]}
              onValueChange={([value]) =>
                updateConfig('openai.temperature', value)
              }
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">{t('openai.maxTokens')}</Label>
            <Input
              id="maxTokens"
              type="number"
              value={config.openai.maxTokens}
              onChange={e =>
                updateConfig('openai.maxTokens', parseInt(e.target.value))
              }
              min="100"
              max="4000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('processing.title')}</CardTitle>
          <CardDescription>{t('processing.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="autoProcessing"
              checked={config.processing.autoProcessing}
              onCheckedChange={checked =>
                updateConfig('processing.autoProcessing', checked)
              }
            />
            <Label htmlFor="autoProcessing">
              {t('processing.autoProcessing')}
            </Label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchSize">{t('processing.batchSize')}</Label>
              <Input
                id="batchSize"
                type="number"
                value={config.processing.batchSize}
                onChange={e =>
                  updateConfig('processing.batchSize', parseInt(e.target.value))
                }
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryAttempts">
                {t('processing.retryAttempts')}
              </Label>
              <Input
                id="retryAttempts"
                type="number"
                value={config.processing.retryAttempts}
                onChange={e =>
                  updateConfig(
                    'processing.retryAttempts',
                    parseInt(e.target.value)
                  )
                }
                min="1"
                max="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processingSchedule">
                {t('processing.schedule')}
              </Label>
              <Select
                value={config.processing.processingSchedule}
                onValueChange={value =>
                  updateConfig('processing.processingSchedule', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*/15 * * * *">
                    {t('processing.schedules.every15min')}
                  </SelectItem>
                  <SelectItem value="0 * * * *">
                    {t('processing.schedules.hourly')}
                  </SelectItem>
                  <SelectItem value="0 */6 * * *">
                    {t('processing.schedules.every6hours')}
                  </SelectItem>
                  <SelectItem value="0 0 * * *">
                    {t('processing.schedules.daily')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {t('processing.duplicateThreshold')}:{' '}
              {config.processing.duplicateThreshold}%
            </Label>
            <Slider
              value={[config.processing.duplicateThreshold]}
              onValueChange={([value]) =>
                updateConfig('processing.duplicateThreshold', value)
              }
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Translation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('translation.title')}</CardTitle>
          <CardDescription>{t('translation.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="translationEnabled"
              checked={config.translation.enabled}
              onCheckedChange={checked =>
                updateConfig('translation.enabled', checked)
              }
            />
            <Label htmlFor="translationEnabled">
              {t('translation.enabled')}
            </Label>
          </div>

          <div className="space-y-2">
            <Label>
              {t('translation.qualityThreshold')}:{' '}
              {config.translation.qualityThreshold}%
            </Label>
            <Slider
              value={[config.translation.qualityThreshold]}
              onValueChange={([value]) =>
                updateConfig('translation.qualityThreshold', value)
              }
              max={100}
              min={70}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summarization Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('summarization.title')}</CardTitle>
          <CardDescription>{t('summarization.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="summarizationEnabled"
              checked={config.summarization.enabled}
              onCheckedChange={checked =>
                updateConfig('summarization.enabled', checked)
              }
            />
            <Label htmlFor="summarizationEnabled">
              {t('summarization.enabled')}
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minLength">{t('summarization.minLength')}</Label>
              <Input
                id="minLength"
                type="number"
                value={config.summarization.minLength}
                onChange={e =>
                  updateConfig(
                    'summarization.minLength',
                    parseInt(e.target.value)
                  )
                }
                min="50"
                max="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLength">{t('summarization.maxLength')}</Label>
              <Input
                id="maxLength"
                type="number"
                value={config.summarization.maxLength}
                onChange={e =>
                  updateConfig(
                    'summarization.maxLength',
                    parseInt(e.target.value)
                  )
                }
                min="100"
                max="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={testConfiguration}
          disabled={testing}
        >
          {testing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {t('actions.test')}
        </Button>

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
