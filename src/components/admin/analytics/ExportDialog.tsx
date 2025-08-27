'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  NewspaperIcon,
  UserIcon,
  TagIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => Promise<void>;
}

interface ExportConfig {
  exportType: 'articles' | 'news' | 'authors' | 'categories' | 'analytics';
  format: 'csv' | 'json';
  dateRange: { days: number };
  filters: Record<string, any>;
  includeMetrics: boolean;
}

export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
  const t = useTranslations('admin.analytics.export');
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    exportType: 'articles',
    format: 'csv',
    dateRange: { days: 30 },
    filters: {},
    includeMetrics: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(config);
    } finally {
      setIsExporting(false);
    }
  };

  const exportTypes = [
    {
      value: 'articles',
      label: t('types.articles'),
      description: t('descriptions.articles'),
      icon: DocumentTextIcon,
    },
    {
      value: 'news',
      label: t('types.news'),
      description: t('descriptions.news'),
      icon: NewspaperIcon,
    },
    {
      value: 'authors',
      label: t('types.authors'),
      description: t('descriptions.authors'),
      icon: UserIcon,
    },
    {
      value: 'categories',
      label: t('types.categories'),
      description: t('descriptions.categories'),
      icon: TagIcon,
    },
    {
      value: 'analytics',
      label: t('types.analytics'),
      description: t('descriptions.analytics'),
      icon: ChartBarIcon,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('fields.exportType')}
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {exportTypes.map(type => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-colors ${
                      config.exportType === type.value
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() =>
                      setConfig(prev => ({
                        ...prev,
                        exportType: type.value as any,
                      }))
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            config.exportType === type.value
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {config.exportType === type.value && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Format and Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">{t('fields.format')}</Label>
              <Select
                value={config.format}
                onValueChange={value =>
                  setConfig(prev => ({ ...prev, format: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">{t('fields.dateRange')}</Label>
              <Select
                value={config.dateRange.days.toString()}
                onValueChange={value =>
                  setConfig(prev => ({
                    ...prev,
                    dateRange: { days: parseInt(value) },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('ranges.week')}</SelectItem>
                  <SelectItem value="30">{t('ranges.month')}</SelectItem>
                  <SelectItem value="90">{t('ranges.quarter')}</SelectItem>
                  <SelectItem value="365">{t('ranges.year')}</SelectItem>
                  <SelectItem value="0">{t('ranges.all')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('fields.options')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetrics"
                  checked={config.includeMetrics}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      includeMetrics: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="includeMetrics" className="text-sm">
                  {t('options.includeMetrics')}
                </Label>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('preview.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
              <div className="space-y-1">
                <p>
                  <strong>{t('preview.type')}:</strong>{' '}
                  {exportTypes.find(t => t.value === config.exportType)?.label}
                </p>
                <p>
                  <strong>{t('preview.format')}:</strong>{' '}
                  {config.format.toUpperCase()}
                </p>
                <p>
                  <strong>{t('preview.period')}:</strong>{' '}
                  {config.dateRange.days === 0
                    ? t('ranges.all')
                    : t('preview.lastDays', { days: config.dateRange.days })}
                </p>
                <p>
                  <strong>{t('preview.metrics')}:</strong>{' '}
                  {config.includeMetrics
                    ? t('preview.included')
                    : t('preview.excluded')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('actions.exporting')}
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {t('actions.export')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
