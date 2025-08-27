'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  DocumentChartBarIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  BookmarkIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AnalyticsChart } from './AnalyticsChart';
import { toast } from 'sonner';

interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  dataSource: 'articles' | 'news' | 'categories' | 'authors' | 'mixed';
  dateRange: {
    type: 'relative' | 'absolute';
    days?: number;
    startDate?: string;
    endDate?: string;
  };
  filters: {
    categories?: string[];
    authors?: string[];
    status?: string[];
    tags?: string[];
    language?: string[];
  };
  metrics: string[];
  groupBy: string[];
  chartType: 'table' | 'line' | 'bar' | 'pie' | 'area' | 'doughnut';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit?: number;
  includeComparisons: boolean;
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

interface SavedReport {
  id: string;
  name: string;
  description?: string;
  config: ReportConfig;
  created_at: string;
  updated_at: string;
  last_run?: string;
  is_favorite: boolean;
}

interface ReportResult {
  data: any[];
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string };
    generatedAt: string;
  };
  chartData: any[];
  metadata: {
    columns: Array<{ key: string; label: string; type: string }>;
    filters: Record<string, any>;
  };
}

interface CustomReportBuilderProps {
  className?: string;
}

export function CustomReportBuilder({ className }: CustomReportBuilderProps) {
  const t = useTranslations('admin.analytics');
  const [currentConfig, setCurrentConfig] = useState<ReportConfig>({
    name: '',
    dataSource: 'articles',
    dateRange: { type: 'relative', days: 30 },
    filters: {},
    metrics: ['views', 'likes'],
    groupBy: ['created_date'],
    chartType: 'table',
    sortBy: 'created_at',
    sortOrder: 'desc',
    includeComparisons: false,
  });

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Available options for dropdowns
  const dataSourceOptions = [
    { value: 'articles', label: t('reportBuilder.dataSources.articles') },
    { value: 'news', label: t('reportBuilder.dataSources.news') },
    { value: 'categories', label: t('reportBuilder.dataSources.categories') },
    { value: 'authors', label: t('reportBuilder.dataSources.authors') },
    { value: 'mixed', label: t('reportBuilder.dataSources.mixed') },
  ];

  const metricOptions = [
    { value: 'views', label: t('metrics.views') },
    { value: 'likes', label: t('metrics.likes') },
    { value: 'shares', label: t('metrics.shares') },
    { value: 'reading_time', label: t('metrics.readingTime') },
    { value: 'engagement_rate', label: t('metrics.engagementRate') },
    { value: 'bounce_rate', label: t('metrics.bounceRate') },
    { value: 'conversion_rate', label: t('metrics.conversionRate') },
  ];

  const groupByOptions = [
    { value: 'created_date', label: t('reportBuilder.groupBy.createdDate') },
    {
      value: 'published_date',
      label: t('reportBuilder.groupBy.publishedDate'),
    },
    { value: 'category', label: t('reportBuilder.groupBy.category') },
    { value: 'author', label: t('reportBuilder.groupBy.author') },
    { value: 'language', label: t('reportBuilder.groupBy.language') },
    { value: 'status', label: t('reportBuilder.groupBy.status') },
  ];

  const chartTypeOptions = [
    { value: 'table', label: t('chartTypes.table'), icon: TableCellsIcon },
    { value: 'line', label: t('chartTypes.line'), icon: ChartBarIcon },
    { value: 'bar', label: t('chartTypes.bar'), icon: ChartBarIcon },
    { value: 'pie', label: t('chartTypes.pie'), icon: ChartBarIcon },
    { value: 'area', label: t('chartTypes.area'), icon: ChartBarIcon },
    { value: 'doughnut', label: t('chartTypes.doughnut'), icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const response = await fetch('/api/admin/analytics/reports');
      if (response.ok) {
        const reports = await response.json();
        setSavedReports(reports);
      }
    } catch (error) {
      console.error('Failed to fetch saved reports:', error);
    }
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/admin/analytics/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      setReportResult(result);
      toast.success(t('reportBuilder.messages.reportGenerated'));
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(t('reportBuilder.messages.generationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReport = async (name: string, description?: string) => {
    try {
      const reportData = {
        name,
        description,
        config: currentConfig,
      };

      const response = await fetch('/api/admin/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      await fetchSavedReports();
      setShowSaveDialog(false);
      toast.success(t('reportBuilder.messages.reportSaved'));
    } catch (error) {
      console.error('Save report error:', error);
      toast.error(t('reportBuilder.messages.saveFailed'));
    }
  };

  const loadReport = (report: SavedReport) => {
    setCurrentConfig(report.config);
    toast.success(t('reportBuilder.messages.reportLoaded'));
  };

  const deleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      await fetchSavedReports();
      toast.success(t('reportBuilder.messages.reportDeleted'));
    } catch (error) {
      console.error('Delete report error:', error);
      toast.error(t('reportBuilder.messages.deleteFailed'));
    }
  };

  const exportReport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!reportResult) return;

    try {
      const response = await fetch('/api/admin/analytics/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: reportResult.data,
          config: currentConfig,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('reportBuilder.messages.exportCompleted'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('reportBuilder.messages.exportFailed'));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('reportBuilder.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reportBuilder.subtitle')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <PlayIcon className="h-4 w-4" />
            {isGenerating
              ? t('reportBuilder.actions.generating')
              : t('reportBuilder.actions.generate')}
          </Button>

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <BookmarkIcon className="h-4 w-4" />
                {t('reportBuilder.actions.save')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('reportBuilder.saveDialog.title')}</DialogTitle>
              </DialogHeader>
              <SaveReportForm onSave={saveReport} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5" />
                {t('reportBuilder.configuration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Source */}
              <div>
                <Label>{t('reportBuilder.dataSource')}</Label>
                <Select
                  value={currentConfig.dataSource}
                  onValueChange={(value: any) =>
                    setCurrentConfig(prev => ({ ...prev, dataSource: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSourceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <Label>{t('reportBuilder.dateRange')}</Label>
                <div className="space-y-2">
                  <Select
                    value={currentConfig.dateRange.type}
                    onValueChange={(value: 'relative' | 'absolute') =>
                      setCurrentConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relative">
                        {t('reportBuilder.dateRange.relative')}
                      </SelectItem>
                      <SelectItem value="absolute">
                        {t('reportBuilder.dateRange.absolute')}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {currentConfig.dateRange.type === 'relative' ? (
                    <Select
                      value={currentConfig.dateRange.days?.toString()}
                      onValueChange={value =>
                        setCurrentConfig(prev => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            days: parseInt(value),
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">{t('periods.week')}</SelectItem>
                        <SelectItem value="30">{t('periods.month')}</SelectItem>
                        <SelectItem value="90">
                          {t('periods.quarter')}
                        </SelectItem>
                        <SelectItem value="365">{t('periods.year')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={currentConfig.dateRange.startDate || ''}
                        onChange={e =>
                          setCurrentConfig(prev => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              startDate: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        type="date"
                        value={currentConfig.dateRange.endDate || ''}
                        onChange={e =>
                          setCurrentConfig(prev => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              endDate: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <Label>{t('reportBuilder.metrics')}</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {metricOptions.map(metric => (
                    <div
                      key={metric.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={metric.value}
                        checked={currentConfig.metrics.includes(metric.value)}
                        onCheckedChange={checked => {
                          if (checked) {
                            setCurrentConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric.value],
                            }));
                          } else {
                            setCurrentConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(
                                m => m !== metric.value
                              ),
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={metric.value} className="text-sm">
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group By */}
              <div>
                <Label>{t('reportBuilder.groupBy')}</Label>
                <Select
                  value={currentConfig.groupBy[0] || ''}
                  onValueChange={value =>
                    setCurrentConfig(prev => ({ ...prev, groupBy: [value] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupByOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Type */}
              <div>
                <Label>{t('reportBuilder.chartType')}</Label>
                <Select
                  value={currentConfig.chartType}
                  onValueChange={(value: any) =>
                    setCurrentConfig(prev => ({ ...prev, chartType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Saved Reports */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reportBuilder.savedReports')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedReports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {report.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadReport(report)}
                        className="p-1"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReport(report.id)}
                        className="p-1 text-red-600"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <DocumentChartBarIcon className="h-5 w-5" />
                  {t('reportBuilder.results')}
                </CardTitle>

                {reportResult && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportReport('csv')}
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportReport('json')}
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      JSON
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">
                    {t('reportBuilder.messages.generating')}
                  </span>
                </div>
              ) : reportResult ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reportBuilder.summary.totalRecords')}
                      </p>
                      <p className="text-2xl font-bold">
                        {reportResult.summary.totalRecords}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reportBuilder.summary.dateRange')}
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(
                          reportResult.summary.dateRange.start
                        ).toLocaleDateString()}{' '}
                        -
                        {new Date(
                          reportResult.summary.dateRange.end
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reportBuilder.summary.generatedAt')}
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(
                          reportResult.summary.generatedAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Chart or Table */}
                  {currentConfig.chartType === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            {reportResult.metadata.columns.map(column => (
                              <th
                                key={column.key}
                                className="border border-gray-200 dark:border-gray-700 p-2 text-left"
                              >
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportResult.data.slice(0, 100).map((row, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              {reportResult.metadata.columns.map(column => (
                                <td
                                  key={column.key}
                                  className="border border-gray-200 dark:border-gray-700 p-2"
                                >
                                  {row[column.key]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-96">
                      <AnalyticsChart
                        type={currentConfig.chartType as any}
                        data={reportResult.chartData}
                        isLoading={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <DocumentChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('reportBuilder.messages.noResults')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface SaveReportFormProps {
  onSave: (name: string, description?: string) => void;
}

function SaveReportForm({ onSave }: SaveReportFormProps) {
  const t = useTranslations('admin.analytics');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="report-name">
          {t('reportBuilder.saveDialog.name')}
        </Label>
        <Input
          id="report-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('reportBuilder.saveDialog.namePlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor="report-description">
          {t('reportBuilder.saveDialog.description')}
        </Label>
        <Textarea
          id="report-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('reportBuilder.saveDialog.descriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">{t('reportBuilder.saveDialog.save')}</Button>
      </div>
    </form>
  );
}
