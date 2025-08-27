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
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  HardDrive,
  Image,
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface StorageConfig {
  limits: {
    maxFileSize: number; // MB
    maxTotalStorage: number; // GB
    allowedFileTypes: string[];
    imageOptimization: boolean;
    autoCleanup: boolean;
    cleanupAfterDays: number;
  };
  cdn: {
    enabled: boolean;
    provider: 'cloudflare' | 'aws' | 'gcp' | 'custom';
    baseUrl?: string;
    apiKey?: string;
    zoneId?: string;
  };
  compression: {
    enabled: boolean;
    quality: number;
    format: 'webp' | 'jpeg' | 'auto';
    generateThumbnails: boolean;
    thumbnailSizes: number[];
  };
}

interface StorageStats {
  totalUsed: number; // bytes
  totalLimit: number; // bytes
  fileCount: number;
  breakdown: {
    images: { count: number; size: number };
    documents: { count: number; size: number };
    videos: { count: number; size: number };
    other: { count: number; size: number };
  };
}

interface StorageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
  lastAccessed?: string;
  isOptimized: boolean;
}

export default function StorageManagement() {
  const t = useTranslations('admin.settings.storage');
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    loadConfiguration();
    loadStorageStats();
    loadFiles();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/settings/storage');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading storage configuration:', error);
      toast.error(t('errors.loadConfigFailed'));
    }
  };

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/admin/storage/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading storage stats:', error);
      toast.error(t('errors.loadStatsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/admin/storage/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/storage', {
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
      console.error('Error saving storage configuration:', error);
      toast.error(t('errors.saveConfigFailed'));
    } finally {
      setSaving(false);
    }
  };

  const optimizeImages = async () => {
    setOptimizing(true);
    try {
      const response = await fetch('/api/admin/storage/optimize', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          t('success.optimizationStarted', { count: result.queuedFiles })
        );
        loadStorageStats();
      } else {
        throw new Error('Failed to start optimization');
      }
    } catch (error) {
      console.error('Error optimizing images:', error);
      toast.error(t('errors.optimizationFailed'));
    } finally {
      setOptimizing(false);
    }
  };

  const cleanupOldFiles = async () => {
    setCleaning(true);
    try {
      const response = await fetch('/api/admin/storage/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: config?.limits.cleanupAfterDays }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          t('success.cleanupCompleted', {
            count: result.deletedFiles,
            size: formatFileSize(result.freedSpace),
          })
        );
        loadStorageStats();
        loadFiles();
      } else {
        throw new Error('Failed to cleanup files');
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
      toast.error(t('errors.cleanupFailed'));
    } finally {
      setCleaning(false);
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const response = await fetch('/api/admin/storage/files/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: selectedFiles }),
      });

      if (response.ok) {
        toast.success(
          t('success.filesDeleted', { count: selectedFiles.length })
        );
        setSelectedFiles([]);
        loadStorageStats();
        loadFiles();
      } else {
        throw new Error('Failed to delete files');
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      toast.error(t('errors.deleteFailed'));
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsagePercentage = () => {
    if (!stats) return 0;
    return (stats.totalUsed / stats.totalLimit) * 100;
  };

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!config || !stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">{t('errors.noData')}</p>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage();

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t('overview.title')}
          </CardTitle>
          <CardDescription>{t('overview.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('overview.used')}</span>
              <span>
                {formatFileSize(stats.totalUsed)} /{' '}
                {formatFileSize(stats.totalLimit)}
              </span>
            </div>
            <Progress value={usagePercentage} className="w-full" />
            {usagePercentage > 80 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{t('overview.nearLimit')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.breakdown.images.count}
              </div>
              <div className="text-sm text-gray-500">
                {t('overview.images')}
              </div>
              <div className="text-xs text-gray-400">
                {formatFileSize(stats.breakdown.images.size)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.breakdown.documents.count}
              </div>
              <div className="text-sm text-gray-500">
                {t('overview.documents')}
              </div>
              <div className="text-xs text-gray-400">
                {formatFileSize(stats.breakdown.documents.size)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.breakdown.videos.count}
              </div>
              <div className="text-sm text-gray-500">
                {t('overview.videos')}
              </div>
              <div className="text-xs text-gray-400">
                {formatFileSize(stats.breakdown.videos.size)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.breakdown.other.count}
              </div>
              <div className="text-sm text-gray-500">{t('overview.other')}</div>
              <div className="text-xs text-gray-400">
                {formatFileSize(stats.breakdown.other.size)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>{t('limits.title')}</CardTitle>
          <CardDescription>{t('limits.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">{t('limits.maxFileSize')}</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={config.limits.maxFileSize}
                onChange={e =>
                  updateConfig('limits.maxFileSize', parseInt(e.target.value))
                }
                min="1"
                max="1000"
              />
              <p className="text-xs text-gray-500">
                {t('limits.maxFileSizeHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTotalStorage">
                {t('limits.maxTotalStorage')}
              </Label>
              <Input
                id="maxTotalStorage"
                type="number"
                value={config.limits.maxTotalStorage}
                onChange={e =>
                  updateConfig(
                    'limits.maxTotalStorage',
                    parseInt(e.target.value)
                  )
                }
                min="1"
                max="1000"
              />
              <p className="text-xs text-gray-500">
                {t('limits.maxTotalStorageHelp')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="imageOptimization"
                checked={config.limits.imageOptimization}
                onCheckedChange={checked =>
                  updateConfig('limits.imageOptimization', checked)
                }
              />
              <Label htmlFor="imageOptimization">
                {t('limits.imageOptimization')}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoCleanup"
                checked={config.limits.autoCleanup}
                onCheckedChange={checked =>
                  updateConfig('limits.autoCleanup', checked)
                }
              />
              <Label htmlFor="autoCleanup">{t('limits.autoCleanup')}</Label>
            </div>
          </div>

          {config.limits.autoCleanup && (
            <div className="space-y-2">
              <Label htmlFor="cleanupAfterDays">
                {t('limits.cleanupAfterDays')}
              </Label>
              <Input
                id="cleanupAfterDays"
                type="number"
                value={config.limits.cleanupAfterDays}
                onChange={e =>
                  updateConfig(
                    'limits.cleanupAfterDays',
                    parseInt(e.target.value)
                  )
                }
                min="1"
                max="365"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* CDN Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('cdn.title')}</CardTitle>
          <CardDescription>{t('cdn.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="cdnEnabled"
              checked={config.cdn.enabled}
              onCheckedChange={checked => updateConfig('cdn.enabled', checked)}
            />
            <Label htmlFor="cdnEnabled">{t('cdn.enabled')}</Label>
          </div>

          {config.cdn.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cdnProvider">{t('cdn.provider')}</Label>
                <Select
                  value={config.cdn.provider}
                  onValueChange={value => updateConfig('cdn.provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="aws">AWS CloudFront</SelectItem>
                    <SelectItem value="gcp">Google Cloud CDN</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cdnBaseUrl">{t('cdn.baseUrl')}</Label>
                <Input
                  id="cdnBaseUrl"
                  value={config.cdn.baseUrl || ''}
                  onChange={e => updateConfig('cdn.baseUrl', e.target.value)}
                  placeholder="https://cdn.stakeados.com"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Compression */}
      <Card>
        <CardHeader>
          <CardTitle>{t('compression.title')}</CardTitle>
          <CardDescription>{t('compression.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="compressionEnabled"
              checked={config.compression.enabled}
              onCheckedChange={checked =>
                updateConfig('compression.enabled', checked)
              }
            />
            <Label htmlFor="compressionEnabled">
              {t('compression.enabled')}
            </Label>
          </div>

          {config.compression.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">
                    {t('compression.quality')}: {config.compression.quality}%
                  </Label>
                  <Input
                    id="quality"
                    type="range"
                    min="10"
                    max="100"
                    value={config.compression.quality}
                    onChange={e =>
                      updateConfig(
                        'compression.quality',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">{t('compression.format')}</Label>
                  <Select
                    value={config.compression.format}
                    onValueChange={value =>
                      updateConfig('compression.format', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="generateThumbnails"
                  checked={config.compression.generateThumbnails}
                  onCheckedChange={checked =>
                    updateConfig('compression.generateThumbnails', checked)
                  }
                />
                <Label htmlFor="generateThumbnails">
                  {t('compression.generateThumbnails')}
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t('files.title')}</CardTitle>
          <CardDescription>{t('files.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={optimizeImages}
                disabled={optimizing}
              >
                {optimizing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Image className="h-4 w-4 mr-2" />
                )}
                {t('files.optimizeImages')}
              </Button>

              <Button
                variant="outline"
                onClick={cleanupOldFiles}
                disabled={cleaning}
              >
                {cleaning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t('files.cleanup')}
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <Button variant="destructive" onClick={deleteSelectedFiles}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('files.deleteSelected', { count: selectedFiles.length })}
              </Button>
            )}
          </div>

          <div className="border rounded-lg">
            <div className="max-h-96 overflow-y-auto">
              {files.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {t('files.noFiles')}
                </p>
              ) : (
                <div className="space-y-1">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 ${
                        selectedFiles.includes(file.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedFiles([...selectedFiles, file.id]);
                            } else {
                              setSelectedFiles(
                                selectedFiles.filter(id => id !== file.id)
                              );
                            }
                          }}
                        />
                        {getFileTypeIcon(file.type)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} •{' '}
                            {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {file.isOptimized && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('files.optimized')}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
