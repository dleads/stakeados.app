'use client';

import React from 'react';
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
  Filter,
  Search,
  RefreshCw,
  FileText,
  Copy,
  Trash2,
  CheckSquare,
  X,
  ArrowRight,
  BarChart3,
  Layers,
  Target,
  Cpu,
  Database,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AIProcessingMonitor from './AIProcessingMonitor';
import { useAIProcessingInterface } from '@/hooks/useAIProcessingInterface';

interface DuplicateGroup {
  group_id: string;
  primary_item: {
    id: string;
    title: string;
    content: string;
    source_name: string;
    created_at: string;
    processed: boolean;
  };
  duplicate_items: Array<{
    id: string;
    title: string;
    content: string;
    source_name: string;
    created_at: string;
    processed: boolean;
  }>;
  detection_details: Array<{
    id: string;
    similarity: number;
    confidence: number;
    reasons: string[];
    title: string;
  }>;
  group_statistics: {
    total_items: number;
    avg_similarity: number;
    avg_confidence: number;
    min_similarity: number;
    max_similarity: number;
  };
  recommended_action: string;
  risk_level: 'low' | 'medium' | 'high';
}

interface AIProcessingConfig {
  similarity_threshold: number;
  batch_size: number;
  processing_options: {
    generate_summary: boolean;
    extract_keywords: boolean;
    calculate_relevance: boolean;
    detect_duplicates: boolean;
    categorize: boolean;
    translate: boolean;
    target_language?: string;
  };
  duplicate_detection: {
    similarity_threshold: number;
    title_weight: number;
    content_weight: number;
    include_processed: boolean;
    date_range_days: number;
  };
  rate_limiting: {
    requests_per_minute: number;
    concurrent_jobs: number;
    retry_attempts: number;
  };
}

interface ProcessingQueue {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total_items: number;
  estimated_completion: string;
}

interface NewsProcessingInterfaceProps {
  className?: string;
}

export default function NewsProcessingInterface({
  className,
}: NewsProcessingInterfaceProps) {
  const t = useTranslations('admin.news.processing');

  // Use the comprehensive hook for state management
  const {
    // State
    duplicateGroups,
    processingJobs,
    processingConfig,
    processingQueue,
    activeTab,
    selectedDuplicates,
    duplicateFilters,
    loading,
    duplicatesLoading,
    error,

    // Actions
    setActiveTab,
    fetchDuplicates,
    resolveDuplicates,
    setDuplicateFilters,
    toggleDuplicateSelection,
    clearDuplicateSelection,
    startBatchProcessing,
    cancelJob,
    retryJob,
    updateConfig,
    saveConfig,
    clearError,
  } = useAIProcessingInterface();

  // Handle batch processing start
  const handleStartBatchProcessing = async () => {
    try {
      await startBatchProcessing();
      // Switch to monitor tab to show progress
      setActiveTab('monitor');
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-500 bg-green-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'high':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'auto_delete_duplicates':
        return 'text-red-500';
      case 'keep_primary_delete_others':
        return 'text-yellow-500';
      case 'manual_review_required':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bot className="w-8 h-8 text-purple-500" />
            AI News Processing Interface
          </h2>
          <p className="text-stakeados-gray-400 mt-1">
            Monitor AI operations, manage duplicates, and configure processing
            parameters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDuplicates()}
            disabled={duplicatesLoading}
            className="flex items-center gap-2 px-4 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn('w-4 h-4', duplicatesLoading && 'animate-spin')}
            />
            Refresh
          </button>
          <button
            onClick={handleStartBatchProcessing}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-gaming transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Start Processing
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-gaming p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto p-1 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-stakeados-gray-600">
        <nav className="flex space-x-8">
          {[
            { id: 'monitor', label: 'Processing Monitor', icon: Activity },
            { id: 'duplicates', label: 'Duplicate Detection', icon: Copy },
            { id: 'config', label: 'AI Configuration', icon: Settings },
            { id: 'queue', label: 'Processing Queue', icon: Layers },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                'flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors',
                activeTab === id
                  ? 'border-purple-500 text-purple-500'
                  : 'border-transparent text-stakeados-gray-400 hover:text-white hover:border-stakeados-gray-500'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'monitor' && (
          <AIProcessingMonitor
            jobs={processingJobs}
            onStartBatch={async options => {
              updateConfig('processing_options', options);
              await startBatchProcessing(options);
            }}
            onCancelJob={cancelJob}
            onRetryJob={retryJob}
          />
        )}

        {activeTab === 'duplicates' && (
          <div className="space-y-6">
            {/* Duplicate Detection Filters */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-500" />
                Detection Filters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Similarity Threshold
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={duplicateFilters.similarity_threshold}
                    onChange={e =>
                      setDuplicateFilters({
                        similarity_threshold: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="text-center text-white text-sm mt-1">
                    {Math.round(duplicateFilters.similarity_threshold * 100)}%
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Date Range (Days)
                  </label>
                  <select
                    value={duplicateFilters.date_range_days}
                    onChange={e =>
                      setDuplicateFilters({
                        date_range_days: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={365}>Last year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={duplicateFilters.risk_level}
                    onChange={e =>
                      setDuplicateFilters({
                        risk_level: e.target.value as any,
                      })
                    }
                    className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={duplicateFilters.include_processed}
                      onChange={e =>
                        setDuplicateFilters({
                          include_processed: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-purple-600 bg-stakeados-gray-700 border-stakeados-gray-600 rounded focus:ring-purple-500"
                    />
                    Include Processed
                  </label>
                </div>
              </div>
            </div>

            {/* Duplicate Groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Detected Duplicates ({duplicateGroups.length})
                </h3>
                {selectedDuplicates.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-stakeados-gray-400 text-sm">
                      {selectedDuplicates.size} selected
                    </span>
                    <button
                      onClick={clearDuplicateSelection}
                      className="px-3 py-1 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white text-sm rounded-gaming transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              {duplicatesLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-500 mx-auto mb-4 animate-spin" />
                  <p className="text-stakeados-gray-400">
                    Detecting duplicates...
                  </p>
                </div>
              ) : duplicateGroups.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-stakeados-gray-400">
                    No duplicates found with current filters
                  </p>
                </div>
              ) : (
                duplicateGroups.map(group => (
                  <div
                    key={group.group_id}
                    className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates.has(group.group_id)}
                          onChange={() =>
                            toggleDuplicateSelection(group.group_id)
                          }
                          className="w-4 h-4 text-purple-600 bg-stakeados-gray-700 border-stakeados-gray-600 rounded focus:ring-purple-500"
                        />
                        <div>
                          <h4 className="text-white font-medium">
                            Duplicate Group (
                            {group.group_statistics.total_items} items)
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span
                              className={cn(
                                'px-2 py-1 text-xs rounded-gaming font-medium',
                                getRiskLevelColor(group.risk_level)
                              )}
                            >
                              {group.risk_level.toUpperCase()} RISK
                            </span>
                            <span className="text-stakeados-gray-400 text-sm">
                              Avg Similarity:{' '}
                              {Math.round(
                                group.group_statistics.avg_similarity * 100
                              )}
                              %
                            </span>
                            <span className="text-stakeados-gray-400 text-sm">
                              Confidence:{' '}
                              {Math.round(
                                group.group_statistics.avg_confidence * 100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            getActionColor(group.recommended_action)
                          )}
                        >
                          {group.recommended_action
                            .replace(/_/g, ' ')
                            .toUpperCase()}
                        </span>
                        <button
                          onClick={() =>
                            resolveDuplicates(
                              group.group_id,
                              group.primary_item.id,
                              group.duplicate_items.map(item => item.id)
                            )
                          }
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-gaming transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Resolve
                        </button>
                      </div>
                    </div>

                    {/* Primary Item */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium text-sm">
                          PRIMARY (KEEP)
                        </span>
                        <span className="text-stakeados-gray-400 text-sm">
                          {group.primary_item.source_name}
                        </span>
                      </div>
                      <div className="bg-stakeados-gray-800 rounded-gaming p-3">
                        <h5 className="text-white font-medium mb-1">
                          {group.primary_item.title}
                        </h5>
                        <p className="text-stakeados-gray-400 text-sm">
                          {group.primary_item.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>

                    {/* Duplicate Items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-red-500 font-medium text-sm">
                          DUPLICATES (DELETE)
                        </span>
                      </div>
                      {group.duplicate_items.map((item, index) => {
                        const details = group.detection_details[index];
                        return (
                          <div
                            key={item.id}
                            className="bg-red-500/5 border border-red-500/20 rounded-gaming p-3"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h6 className="text-white font-medium text-sm">
                                  {item.title}
                                </h6>
                                <p className="text-stakeados-gray-400 text-xs">
                                  {item.source_name} •{' '}
                                  {new Date(
                                    item.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-red-400 text-sm font-medium">
                                  {Math.round(details.similarity * 100)}%
                                  similar
                                </div>
                                <div className="text-stakeados-gray-400 text-xs">
                                  {Math.round(details.confidence * 100)}%
                                  confidence
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {details.reasons.map(reason => (
                                <span
                                  key={reason}
                                  className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-gaming"
                                >
                                  {reason.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Processing Options */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-500" />
                Processing Options
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {Object.entries(processingConfig.processing_options).map(
                    ([key, value]) => (
                      <label key={key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e =>
                            updateConfig('processing_options', {
                              [key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-purple-600 bg-stakeados-gray-700 border-stakeados-gray-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-white capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </label>
                    )
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-stakeados-gray-400 mb-2">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={processingConfig.batch_size}
                      onChange={e =>
                        updateConfig('batch_size', parseInt(e.target.value))
                      }
                      className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-stakeados-gray-400 mb-2">
                      Similarity Threshold
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={processingConfig.similarity_threshold}
                      onChange={e =>
                        updateConfig(
                          'similarity_threshold',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                    <div className="text-center text-white text-sm mt-1">
                      {Math.round(processingConfig.similarity_threshold * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Duplicate Detection Config */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Duplicate Detection Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Title Weight
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={processingConfig.duplicate_detection.title_weight}
                    onChange={e =>
                      updateConfig('duplicate_detection', {
                        title_weight: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="text-center text-white text-sm mt-1">
                    {Math.round(
                      processingConfig.duplicate_detection.title_weight * 100
                    )}
                    %
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Content Weight
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={processingConfig.duplicate_detection.content_weight}
                    onChange={e =>
                      updateConfig('duplicate_detection', {
                        content_weight: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="text-center text-white text-sm mt-1">
                    {Math.round(
                      processingConfig.duplicate_detection.content_weight * 100
                    )}
                    %
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Detection Range (Days)
                  </label>
                  <select
                    value={processingConfig.duplicate_detection.date_range_days}
                    onChange={e =>
                      updateConfig('duplicate_detection', {
                        date_range_days: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Rate Limiting & Performance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Requests per Minute
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={processingConfig.rate_limiting.requests_per_minute}
                    onChange={e =>
                      updateConfig('rate_limiting', {
                        requests_per_minute: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Concurrent Jobs
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={processingConfig.rate_limiting.concurrent_jobs}
                    onChange={e =>
                      updateConfig('rate_limiting', {
                        concurrent_jobs: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-stakeados-gray-400 mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={processingConfig.rate_limiting.retry_attempts}
                    onChange={e =>
                      updateConfig('rate_limiting', {
                        retry_attempts: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-stakeados-gray-700 border border-stakeados-gray-600 rounded-gaming px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Configuration */}
            <div className="flex justify-end">
              <button
                onClick={saveConfig}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-gaming transition-colors"
              >
                <Database className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Queue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  label: 'Pending',
                  value: processingQueue.pending,
                  color: 'text-yellow-500',
                  icon: Clock,
                },
                {
                  label: 'Processing',
                  value: processingQueue.processing,
                  color: 'text-blue-500',
                  icon: Activity,
                },
                {
                  label: 'Completed',
                  value: processingQueue.completed,
                  color: 'text-green-500',
                  icon: CheckCircle,
                },
                {
                  label: 'Failed',
                  value: processingQueue.failed,
                  color: 'text-red-500',
                  icon: XCircle,
                },
                {
                  label: 'Total Items',
                  value: processingQueue.total_items,
                  color: 'text-white',
                  icon: Database,
                },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-4 text-center"
                >
                  <Icon className={cn('w-6 h-6 mx-auto mb-2', color)} />
                  <div className={cn('text-2xl font-bold', color)}>{value}</div>
                  <div className="text-sm text-stakeados-gray-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Queue Management */}
            <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                Processing Queue Management
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Queue Status</p>
                    <p className="text-stakeados-gray-400 text-sm">
                      {processingQueue.processing > 0
                        ? 'Processing in progress'
                        : 'Queue is idle'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors">
                      <Pause className="w-4 h-4" />
                      Pause Queue
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-gaming transition-colors">
                      <Play className="w-4 h-4" />
                      Resume Queue
                    </button>
                  </div>
                </div>

                {processingQueue.estimated_completion && (
                  <div className="bg-stakeados-gray-800 rounded-gaming p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-white font-medium">
                        Estimated Completion
                      </span>
                    </div>
                    <p className="text-stakeados-gray-400">
                      {processingQueue.estimated_completion}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">
                      Queue Actions
                    </h4>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-gaming transition-colors">
                        <Zap className="w-4 h-4" />
                        Process All Pending
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-gaming transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        Retry Failed Items
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-gaming transition-colors">
                        <Square className="w-4 h-4" />
                        Clear Failed Queue
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">
                      Queue Statistics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stakeados-gray-400">
                          Success Rate:
                        </span>
                        <span className="text-green-500">
                          {processingQueue.total_items > 0
                            ? Math.round(
                                (processingQueue.completed /
                                  processingQueue.total_items) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stakeados-gray-400">
                          Failure Rate:
                        </span>
                        <span className="text-red-500">
                          {processingQueue.total_items > 0
                            ? Math.round(
                                (processingQueue.failed /
                                  processingQueue.total_items) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stakeados-gray-400">
                          Queue Utilization:
                        </span>
                        <span className="text-blue-500">
                          {processingQueue.total_items > 0
                            ? Math.round(
                                ((processingQueue.processing +
                                  processingQueue.completed) /
                                  processingQueue.total_items) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
