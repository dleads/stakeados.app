'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Activity,
  Settings,
  Eye,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total_items: number;
    processed_items: number;
    failed_items: number;
    skipped_items: number;
    percentage: number;
  };
  timing: {
    created_at: string;
    started_at?: string;
    completed_at?: string;
    processing_rate_per_minute: number;
    estimated_remaining_minutes?: number;
  };
  processing_options: {
    generate_summary?: boolean;
    extract_keywords?: boolean;
    calculate_relevance?: boolean;
    detect_duplicates?: boolean;
    translate?: boolean;
    target_language?: string;
  };
  error_message?: string;
}

interface AIProcessingMonitorProps {
  jobs: AIProcessingJob[];
  onStartBatch?: (
    options: AIProcessingJob['processing_options']
  ) => Promise<void>;
  onCancelJob?: (jobId: string) => Promise<void>;
  onRetryJob?: (jobId: string) => Promise<void>;
  className?: string;
}

export default function AIProcessingMonitor({
  jobs,
  onStartBatch,
  onCancelJob,
  onRetryJob,
  className,
}: AIProcessingMonitorProps) {
  const t = useTranslations('admin.news.processing');
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchOptions, setBatchOptions] = useState<
    AIProcessingJob['processing_options']
  >({
    generate_summary: true,
    extract_keywords: true,
    calculate_relevance: true,
    detect_duplicates: true,
    translate: false,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <Square className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleStartBatch = async () => {
    if (onStartBatch) {
      try {
        await onStartBatch(batchOptions);
        setShowBatchDialog(false);
      } catch (error) {
        console.error('Error starting batch processing:', error);
      }
    }
  };

  const activeJobs = jobs.filter(job =>
    ['pending', 'processing'].includes(job.status)
  );
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Processing Overview */}
      <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            {t('title')}
          </h3>
          <button
            onClick={() => setShowBatchDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-gaming transition-colors"
          >
            <Zap className="w-4 h-4" />
            {t('startBatch')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {activeJobs.length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('stats.active')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {completedJobs.length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('stats.completed')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {failedJobs.length}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('stats.failed')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {jobs.reduce((sum, job) => sum + job.progress.processed_items, 0)}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {t('stats.totalProcessed')}
            </div>
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">
            {t('activeJobs')}
          </h4>
          {activeJobs.map(job => (
            <div
              key={job.id}
              className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h5 className="text-white font-medium">
                      {t('jobId')}: {job.id.slice(0, 8)}...
                    </h5>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        getStatusColor(job.status)
                      )}
                    >
                      {t(`status.${job.status}`)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium text-lg">
                    {job.progress.percentage}%
                  </p>
                  <p className="text-stakeados-gray-400 text-sm">
                    {job.progress.processed_items}/{job.progress.total_items}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-stakeados-gray-700 rounded-full h-3">
                  <div
                    className={cn(
                      'h-3 rounded-full transition-all duration-300',
                      getProgressBarColor(job.status)
                    )}
                    style={{ width: `${job.progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    {t('details.processed')}
                  </p>
                  <p className="text-white font-medium">
                    {job.progress.processed_items}
                  </p>
                </div>
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    {t('details.failed')}
                  </p>
                  <p className="text-red-500 font-medium">
                    {job.progress.failed_items}
                  </p>
                </div>
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    {t('details.rate')}
                  </p>
                  <p className="text-white font-medium">
                    {job.timing.processing_rate_per_minute}/min
                  </p>
                </div>
                <div>
                  <p className="text-stakeados-gray-400 text-sm">
                    {t('details.remaining')}
                  </p>
                  <p className="text-white font-medium">
                    {job.timing.estimated_remaining_minutes
                      ? formatDuration(job.timing.estimated_remaining_minutes)
                      : '--'}
                  </p>
                </div>
              </div>

              {/* Processing Options */}
              <div className="mb-4">
                <p className="text-stakeados-gray-400 text-sm mb-2">
                  {t('details.options')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(job.processing_options).map(
                    ([key, value]) =>
                      value && (
                        <span
                          key={key}
                          className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-gaming"
                        >
                          {t(`options.${key}`)}
                        </span>
                      )
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {job.status === 'processing' && onCancelJob && (
                  <button
                    onClick={() => onCancelJob(job.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-gaming transition-colors"
                  >
                    <Square className="w-3 h-3" />
                    {t('actions.cancel')}
                  </button>
                )}
                <button className="flex items-center gap-2 px-3 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white text-sm rounded-gaming transition-colors">
                  <Eye className="w-3 h-3" />
                  {t('actions.details')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">{t('recentJobs')}</h4>
        {jobs
          .filter(job => !['pending', 'processing'].includes(job.status))
          .slice(0, 5)
          .map(job => (
            <div
              key={job.id}
              className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h5 className="text-white font-medium">
                      {t('jobId')}: {job.id.slice(0, 8)}...
                    </h5>
                    <p className="text-stakeados-gray-400 text-sm">
                      {new Date(job.timing.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      getStatusColor(job.status)
                    )}
                  >
                    {t(`status.${job.status}`)}
                  </span>
                  <span className="text-stakeados-gray-400 text-sm">
                    {job.progress.processed_items}/{job.progress.total_items}
                  </span>
                  {job.status === 'failed' && onRetryJob && (
                    <button
                      onClick={() => onRetryJob(job.id)}
                      className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                      title={t('actions.retry')}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {job.error_message && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-gaming">
                  <p className="text-red-400 text-sm">{job.error_message}</p>
                </div>
              )}
            </div>
          ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <p className="text-stakeados-gray-400">{t('noJobs')}</p>
        </div>
      )}

      {/* Batch Processing Dialog */}
      {showBatchDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {t('batchDialog.title')}
                </h3>
                <button
                  onClick={() => setShowBatchDialog(false)}
                  className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-stakeados-gray-400 text-sm">
                  {t('batchDialog.description')}
                </p>

                {Object.entries(batchOptions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={e =>
                        setBatchOptions(prev => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-purple-600 bg-stakeados-gray-700 border-stakeados-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-white">{t(`options.${key}`)}</span>
                  </label>
                ))}

                {batchOptions.translate && (
                  <div className="ml-7">
                    <label className="block text-sm text-stakeados-gray-400 mb-2">
                      {t('batchDialog.targetLanguage')}
                    </label>
                    <select className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBatchDialog(false)}
                  className="flex-1 py-2 px-4 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors"
                >
                  {t('batchDialog.cancel')}
                </button>
                <button
                  onClick={handleStartBatch}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-gaming transition-colors"
                >
                  {t('batchDialog.start')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
