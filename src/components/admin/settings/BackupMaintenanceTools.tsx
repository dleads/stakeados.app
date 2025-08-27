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
import { Progress } from '@/components/ui/Progress';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Download,
  Database,
  HardDrive,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface BackupConfig {
  automatic: {
    enabled: boolean;
    frequency: string; // cron expression
    retention: number; // days
    includeMedia: boolean;
    compression: boolean;
  };
  storage: {
    type: 'local' | 's3' | 'gcs';
    path: string;
    credentials?: {
      accessKey?: string;
      secretKey?: string;
      bucket?: string;
      region?: string;
    };
  };
}

interface BackupItem {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
  includesMedia: boolean;
}

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
}

export default function BackupMaintenanceTools() {
  const t = useTranslations('admin.settings.backup');
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [runningMaintenance, setRunningMaintenance] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadConfiguration();
    loadBackups();
    loadMaintenanceTasks();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/settings/backup');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading backup configuration:', error);
      toast.error(t('errors.loadConfigFailed'));
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error(t('errors.loadBackupsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceTasks = async () => {
    try {
      const response = await fetch('/api/admin/maintenance/tasks');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceTasks(data);
      }
    } catch (error) {
      console.error('Error loading maintenance tasks:', error);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success(t('success.configSaved'));
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving backup configuration:', error);
      toast.error(t('errors.saveConfigFailed'));
    } finally {
      setSaving(false);
    }
  };

  const createManualBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual',
          includeMedia: config?.automatic.includeMedia || false,
        }),
      });

      if (response.ok) {
        const backup = await response.json();
        setBackups(prev => [backup, ...prev]);
        toast.success(t('success.backupCreated'));
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(t('errors.backupCreationFailed'));
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backups/${backupId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download backup');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error(t('errors.downloadFailed'));
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backups/${backupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBackups(prev => prev.filter(b => b.id !== backupId));
        toast.success(t('success.backupDeleted'));
      } else {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(t('errors.deleteFailed'));
    }
  };

  const runMaintenanceTask = async (taskId: string) => {
    setRunningMaintenance(taskId);
    try {
      const response = await fetch(
        `/api/admin/maintenance/tasks/${taskId}/run`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast.success(t('success.maintenanceStarted'));
        loadMaintenanceTasks(); // Refresh tasks
      } else {
        throw new Error('Failed to run maintenance task');
      }
    } catch (error) {
      console.error('Error running maintenance task:', error);
      toast.error(t('errors.maintenanceFailed'));
    } finally {
      setRunningMaintenance(null);
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
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
      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('configuration.title')}
          </CardTitle>
          <CardDescription>{t('configuration.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="automaticBackup"
              checked={config.automatic.enabled}
              onCheckedChange={checked =>
                updateConfig('automatic.enabled', checked)
              }
            />
            <Label htmlFor="automaticBackup">
              {t('configuration.automaticEnabled')}
            </Label>
          </div>

          {config.automatic.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">
                    {t('configuration.frequency')}
                  </Label>
                  <Select
                    value={config.automatic.frequency}
                    onValueChange={value =>
                      updateConfig('automatic.frequency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 2 * * *">
                        {t('configuration.frequencies.daily')}
                      </SelectItem>
                      <SelectItem value="0 2 * * 0">
                        {t('configuration.frequencies.weekly')}
                      </SelectItem>
                      <SelectItem value="0 2 1 * *">
                        {t('configuration.frequencies.monthly')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention">
                    {t('configuration.retention')}
                  </Label>
                  <Input
                    id="retention"
                    type="number"
                    value={config.automatic.retention}
                    onChange={e =>
                      updateConfig(
                        'automatic.retention',
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeMedia"
                    checked={config.automatic.includeMedia}
                    onCheckedChange={checked =>
                      updateConfig('automatic.includeMedia', checked)
                    }
                  />
                  <Label htmlFor="includeMedia">
                    {t('configuration.includeMedia')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="compression"
                    checked={config.automatic.compression}
                    onCheckedChange={checked =>
                      updateConfig('automatic.compression', checked)
                    }
                  />
                  <Label htmlFor="compression">
                    {t('configuration.compression')}
                  </Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t('storage.title')}
          </CardTitle>
          <CardDescription>{t('storage.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storageType">{t('storage.type')}</Label>
            <Select
              value={config.storage.type}
              onValueChange={value => updateConfig('storage.type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  {t('storage.types.local')}
                </SelectItem>
                <SelectItem value="s3">{t('storage.types.s3')}</SelectItem>
                <SelectItem value="gcs">{t('storage.types.gcs')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storagePath">{t('storage.path')}</Label>
            <Input
              id="storagePath"
              value={config.storage.path}
              onChange={e => updateConfig('storage.path', e.target.value)}
              placeholder={
                config.storage.type === 'local'
                  ? '/backups'
                  : 'bucket-name/backups'
              }
            />
          </div>

          {config.storage.type !== 'local' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessKey">{t('storage.accessKey')}</Label>
                <Input
                  id="accessKey"
                  type="password"
                  value={config.storage.credentials?.accessKey || ''}
                  onChange={e =>
                    updateConfig(
                      'storage.credentials.accessKey',
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">{t('storage.secretKey')}</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={config.storage.credentials?.secretKey || ''}
                  onChange={e =>
                    updateConfig(
                      'storage.credentials.secretKey',
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('manual.title')}
          </CardTitle>
          <CardDescription>{t('manual.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={createManualBackup}
            disabled={creatingBackup}
            className="w-full"
          >
            {creatingBackup ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t('manual.createBackup')}
          </Button>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
          <CardDescription>{t('history.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {t('history.noBackups')}
              </p>
            ) : (
              backups.map(backup => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(backup.createdAt).toLocaleString()} •{' '}
                        {formatFileSize(backup.size)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        backup.type === 'automatic' ? 'default' : 'secondary'
                      }
                    >
                      {t(`history.types.${backup.type}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {backup.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('maintenance.title')}
          </CardTitle>
          <CardDescription>{t('maintenance.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceTasks.map(task => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <h4 className="font-medium">{task.name}</h4>
                      <p className="text-sm text-gray-500">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runMaintenanceTask(task.id)}
                    disabled={
                      runningMaintenance === task.id ||
                      task.status === 'running'
                    }
                  >
                    {runningMaintenance === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {task.status === 'running' && task.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={task.progress} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">
                      {task.progress}% {t('maintenance.complete')}
                    </p>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>
                    {task.lastRun
                      ? t('maintenance.lastRun', {
                          date: new Date(task.lastRun).toLocaleString(),
                        })
                      : t('maintenance.neverRun')}
                  </span>
                  {task.nextRun && (
                    <span>
                      {t('maintenance.nextRun', {
                        date: new Date(task.nextRun).toLocaleString(),
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Configuration */}
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
