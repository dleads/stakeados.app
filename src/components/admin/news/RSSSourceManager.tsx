'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Rss,
  Plus,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Globe,
  Activity,
  Loader2,
  Search,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  Zap,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NewsSource {
  id: string;
  name: string;
  description?: string;
  url: string;
  source_type: 'rss' | 'api' | 'scraper';
  api_key?: string;
  api_endpoint?: string;
  headers?: Record<string, string>;
  categories: string[];
  language: 'es' | 'en';
  fetch_interval: number;
  is_active: boolean;
  priority: number;
  quality_score: number;
  max_failures: number;
  last_fetched_at?: string;
  last_successful_fetch_at?: string;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
  health_status?: 'healthy' | 'warning' | 'error' | 'timeout' | 'unknown';
  articles_today?: number;
}

export interface SourceCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export interface SourceTestResult {
  success: boolean;
  status: 'healthy' | 'warning' | 'error' | 'timeout';
  response_time: number;
  articles_fetched: number;
  error_message?: string;
  http_status_code?: number;
  metadata?: Record<string, any>;
}

interface RSSSourceManagerProps {
  sources: NewsSource[];
  categories: SourceCategory[];
  onCreateSource: (
    source: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onUpdateSource: (id: string, updates: Partial<NewsSource>) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onTestSource: (id: string) => Promise<SourceTestResult>;
  onToggleSource: (id: string) => Promise<void>;
  onFetchNow: (id: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function RSSSourceManager({
  sources,
  categories,
  onCreateSource,
  onUpdateSource,
  onDeleteSource,
  onTestSource,
  onToggleSource,
  onFetchNow,
  loading = false,
  error = null,
}: RSSSourceManagerProps) {
  const t = useTranslations('admin.news.sources');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'rss' | 'api' | 'scraper'
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive' | 'healthy' | 'error'
  >('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'priority' | 'quality_score' | 'last_fetched_at'
  >('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, SourceTestResult>
  >({});

  // Filter and sort sources
  const filteredSources = sources
    .filter(source => {
      const matchesSearch =
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === 'all' || source.source_type === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && source.is_active) ||
        (filterStatus === 'inactive' && !source.is_active) ||
        (filterStatus === 'healthy' && source.health_status === 'healthy') ||
        (filterStatus === 'error' && source.health_status === 'error');

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const getComparable = (val: any, key: typeof sortBy) => {
        if (key === 'name')
          return (val as string | undefined)?.toLowerCase() ?? '';
        if (key === 'last_fetched_at')
          return val ? new Date(val as string).getTime() : 0;
        return (val as number | undefined) ?? 0; // priority, quality_score
      };

      const aValue = getComparable(a[sortBy], sortBy);
      const bValue = getComparable(b[sortBy], sortBy);

      if (aValue === bValue) return 0;
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleTestSource = async (sourceId: string) => {
    setTestingSource(sourceId);
    try {
      const result = await onTestSource(sourceId);
      setTestResults(prev => ({ ...prev, [sourceId]: result }));
    } catch (error) {
      console.error('Error testing source:', error);
    } finally {
      setTestingSource(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-stakeados-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Rss className="w-6 h-6 text-stakeados-primary" />
            {t('title')}
          </h2>
          <p className="text-stakeados-gray-400 mt-1">{t('subtitle')}</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary-dark text-stakeados-dark rounded-gaming transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addSource')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stakeados-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
          >
            <option value="all">{t('filters.allTypes')}</option>
            <option value="rss">RSS</option>
            <option value="api">API</option>
            <option value="scraper">Scraper</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
          >
            <option value="all">{t('filters.allStatus')}</option>
            <option value="active">{t('filters.active')}</option>
            <option value="inactive">{t('filters.inactive')}</option>
            <option value="healthy">{t('filters.healthy')}</option>
            <option value="error">{t('filters.error')}</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
          >
            <option value="priority-desc">{t('sort.priorityDesc')}</option>
            <option value="name-asc">{t('sort.nameAsc')}</option>
            <option value="quality_score-desc">{t('sort.qualityDesc')}</option>
            <option value="last_fetched_at-desc">
              {t('sort.lastFetchDesc')}
            </option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-gaming p-4">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSources.map(source => (
          <SourceCard
            key={source.id}
            source={source}
            categories={categories}
            testResult={testResults[source.id]}
            isTesting={testingSource === source.id}
            onEdit={() => setEditingSource(source)}
            onDelete={() => onDeleteSource(source.id)}
            onTest={() => handleTestSource(source.id)}
            onToggle={() => onToggleSource(source.id)}
            onFetchNow={() => onFetchNow(source.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredSources.length === 0 && (
        <div className="text-center py-12">
          <Rss className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? t('noSourcesFound')
              : t('noSources')}
          </h3>
          <p className="text-stakeados-gray-400 mb-4">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? t('tryDifferentFilters')
              : t('addFirstSource')}
          </p>
          {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary-dark text-stakeados-dark rounded-gaming transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('addSource')}
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSource) && (
        <SourceModal
          source={editingSource}
          categories={categories}
          onSave={async sourceData => {
            if (editingSource) {
              await onUpdateSource(editingSource.id, sourceData);
              setEditingSource(null);
            } else {
              await onCreateSource(sourceData);
              setShowCreateModal(false);
            }
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingSource(null);
          }}
        />
      )}
    </div>
  );
}

interface SourceCardProps {
  source: NewsSource;
  categories: SourceCategory[];
  testResult?: SourceTestResult;
  isTesting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggle: () => void;
  onFetchNow: () => void;
}

function SourceCard({
  source,
  categories,
  testResult,
  isTesting,
  onEdit,
  onDelete,
  onTest,
  onToggle,
  onFetchNow,
}: SourceCardProps) {
  const t = useTranslations('admin.news.sources');
  const [showActions, setShowActions] = useState(false);

  const getCategoryInfo = (categoryName: string) => {
    return categories.find(cat => cat.name === categoryName);
  };

  const getHealthStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'timeout':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatLastFetch = (dateString?: string) => {
    if (!dateString) return t('never');

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return <Rss className="w-4 h-4" />;
      case 'api':
        return <Zap className="w-4 h-4" />;
      case 'scraper':
        return <Globe className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={cn(
        'bg-gaming-card border rounded-gaming p-4 transition-all duration-200',
        source.is_active
          ? 'border-stakeados-gray-600 hover:border-stakeados-primary/50'
          : 'border-stakeados-gray-700 opacity-75'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getSourceTypeIcon(source.source_type)}
            <h3 className="font-semibold text-white truncate">{source.name}</h3>
            <div
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                source.is_active
                  ? 'text-green-400 bg-green-400/10 border-green-400/20'
                  : 'text-gray-400 bg-gray-400/10 border-gray-400/20'
              )}
            >
              {source.is_active ? t('status.active') : t('status.inactive')}
            </div>
          </div>

          {source.description && (
            <p className="text-sm text-stakeados-gray-400 mb-2 line-clamp-2">
              {source.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-stakeados-gray-400">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{source.url}</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-stakeados-gray-700 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-stakeados-gray-400" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onEdit();
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-stakeados-gray-700 flex items-center gap-2"
              >
                <Edit className="w-3 h-3" />
                {t('actions.edit')}
              </button>

              <button
                onClick={() => {
                  onToggle();
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-stakeados-gray-700 flex items-center gap-2"
              >
                {source.is_active ? (
                  <>
                    <XCircle className="w-3 h-3" />
                    {t('actions.deactivate')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    {t('actions.activate')}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onFetchNow();
                  setShowActions(false);
                }}
                disabled={!source.is_active}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-stakeados-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3 h-3" />
                {t('actions.fetchNow')}
              </button>

              <hr className="border-stakeados-gray-600" />

              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" />
                {t('actions.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Health Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {source.health_status && getHealthStatusIcon(source.health_status)}
          <span
            className={cn(
              'text-sm font-medium',
              getHealthStatusColor(source.health_status).split(' ')[0]
            )}
          >
            {source.health_status
              ? t(`health.${source.health_status}`)
              : t('health.unknown')}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-stakeados-gray-400">
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            <span>{source.quality_score}/10</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>{source.articles_today || 0}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      {source.categories.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {source.categories.slice(0, 3).map(categoryName => {
              const category = getCategoryInfo(categoryName);
              return (
                <span
                  key={categoryName}
                  className="px-2 py-1 text-xs rounded-full border"
                  style={{
                    color: category?.color || '#00FF88',
                    backgroundColor: `${category?.color || '#00FF88'}20`,
                    borderColor: `${category?.color || '#00FF88'}40`,
                  }}
                >
                  {categoryName}
                </span>
              );
            })}
            {source.categories.length > 3 && (
              <span className="px-2 py-1 text-xs rounded-full border border-stakeados-gray-600 text-stakeados-gray-400">
                +{source.categories.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
        <div>
          <span className="text-stakeados-gray-400">{t('stats.priority')}</span>
          <div className="font-medium text-white">{source.priority}/10</div>
        </div>
        <div>
          <span className="text-stakeados-gray-400">{t('stats.interval')}</span>
          <div className="font-medium text-white">
            {source.fetch_interval >= 3600
              ? `${Math.floor(source.fetch_interval / 3600)}h`
              : `${Math.floor(source.fetch_interval / 60)}m`}
          </div>
        </div>
        <div>
          <span className="text-stakeados-gray-400">{t('stats.failures')}</span>
          <div
            className={cn(
              'font-medium',
              source.consecutive_failures > 0 ? 'text-red-400' : 'text-white'
            )}
          >
            {source.consecutive_failures}/{source.max_failures}
          </div>
        </div>
        <div>
          <span className="text-stakeados-gray-400">
            {t('stats.lastFetch')}
          </span>
          <div className="font-medium text-white">
            {formatLastFetch(source.last_fetched_at)}
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={cn(
            'p-2 rounded border text-xs mb-3',
            testResult.success
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span>
              {testResult.success ? t('test.success') : t('test.failed')}
            </span>
            <span>{testResult.response_time}ms</span>
          </div>
          {testResult.error_message && (
            <div className="mt-1 text-xs opacity-75">
              {testResult.error_message}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onTest}
          disabled={isTesting}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors disabled:opacity-50"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TestTube className="w-4 h-4" />
          )}
          {isTesting ? t('actions.testing') : t('actions.test')}
        </button>

        <button
          onClick={onEdit}
          className="px-3 py-2 bg-stakeados-primary/20 hover:bg-stakeados-primary/30 text-stakeados-primary rounded-gaming transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface SourceModalProps {
  source?: NewsSource | null;
  categories: SourceCategory[];
  onSave: (
    source: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onCancel: () => void;
}

function SourceModal({
  source,
  categories,
  onSave,
  onCancel,
}: SourceModalProps) {
  const t = useTranslations('admin.news.sources');
  const [formData, setFormData] = useState({
    name: source?.name || '',
    description: source?.description || '',
    url: source?.url || '',
    source_type: source?.source_type || ('rss' as const),
    api_key: source?.api_key || '',
    api_endpoint: source?.api_endpoint || '',
    headers: source?.headers || {},
    categories: source?.categories || [],
    language: source?.language || ('en' as const),
    fetch_interval: source?.fetch_interval || 3600,
    is_active: source?.is_active ?? true,
    priority: source?.priority || 5,
    quality_score: source?.quality_score || 5.0,
    max_failures: source?.max_failures || 5,
    consecutive_failures: source?.consecutive_failures || 0,
  });

  const [customHeaders, setCustomHeaders] = useState<
    Array<{ key: string; value: string }>
  >(() => {
    if (source?.headers) {
      return Object.entries(source.headers).map(([key, value]) => ({
        key,
        value,
      }));
    }
    return [{ key: '', value: '' }];
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    source?.categories || []
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

    if (!formData.url.trim()) {
      newErrors.url = t('validation.urlRequired');
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = t('validation.urlInvalid');
      }
    }

    if (formData.source_type === 'api' && !formData.api_endpoint?.trim()) {
      newErrors.api_endpoint = t('validation.apiEndpointRequired');
    }

    if (formData.fetch_interval < 300) {
      newErrors.fetch_interval = t('validation.intervalTooShort');
    }

    if (formData.priority < 1 || formData.priority > 10) {
      newErrors.priority = t('validation.priorityRange');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Convert custom headers array to object
      const headers = customHeaders
        .filter(h => h.key.trim() && h.value.trim())
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

      await onSave({
        ...formData,
        headers,
        categories: selectedCategories,
      });
    } catch (error) {
      console.error('Error saving source:', error);
    } finally {
      setSaving(false);
    }
  };

  const addHeaderField = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const removeHeaderField = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateHeaderField = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-stakeados-gray-900 border border-stakeados-gray-600 rounded-gaming max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {source ? t('modal.editTitle') : t('modal.createTitle')}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            >
              <XCircle className="w-5 h-5 text-stakeados-gray-400" />
            </button>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t('modal.basicInfo')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={cn(
                    'w-full px-3 py-2 bg-stakeados-gray-800 border rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary',
                    errors.name ? 'border-red-500' : 'border-stakeados-gray-600'
                  )}
                  placeholder={t('modal.namePlaceholder')}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.sourceType')}
                </label>
                <select
                  value={formData.source_type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      source_type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
                >
                  <option value="rss">RSS Feed</option>
                  <option value="api">API Endpoint</option>
                  <option value="scraper">Web Scraper</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                {t('modal.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary resize-none"
                placeholder={t('modal.descriptionPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                {formData.source_type === 'rss'
                  ? t('modal.rssUrl')
                  : t('modal.url')}{' '}
                *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={e =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className={cn(
                  'w-full px-3 py-2 bg-stakeados-gray-800 border rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary',
                  errors.url ? 'border-red-500' : 'border-stakeados-gray-600'
                )}
                placeholder={
                  formData.source_type === 'rss'
                    ? 'https://example.com/rss.xml'
                    : 'https://api.example.com/news'
                }
              />
              {errors.url && (
                <p className="text-red-400 text-sm mt-1">{errors.url}</p>
              )}
            </div>
          </div>

          {/* API Configuration */}
          {formData.source_type === 'api' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {t('modal.apiConfig')}
              </h3>

              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.apiEndpoint')} *
                </label>
                <input
                  type="url"
                  value={formData.api_endpoint}
                  onChange={e =>
                    setFormData({ ...formData, api_endpoint: e.target.value })
                  }
                  className={cn(
                    'w-full px-3 py-2 bg-stakeados-gray-800 border rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary',
                    errors.api_endpoint
                      ? 'border-red-500'
                      : 'border-stakeados-gray-600'
                  )}
                  placeholder="https://api.example.com/v1/articles"
                />
                {errors.api_endpoint && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.api_endpoint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.apiKey')}
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={e =>
                    setFormData({ ...formData, api_key: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
                  placeholder={t('modal.apiKeyPlaceholder')}
                />
              </div>
            </div>
          )}

          {/* Custom Headers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {t('modal.customHeaders')}
              </h3>
              <button
                type="button"
                onClick={addHeaderField}
                className="flex items-center gap-2 px-3 py-1 bg-stakeados-primary/20 hover:bg-stakeados-primary/30 text-stakeados-primary rounded-gaming transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('modal.addHeader')}
              </button>
            </div>

            <div className="space-y-2">
              {customHeaders.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={e =>
                      updateHeaderField(index, 'key', e.target.value)
                    }
                    placeholder={t('modal.headerKey')}
                    className="flex-1 px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={e =>
                      updateHeaderField(index, 'value', e.target.value)
                    }
                    placeholder={t('modal.headerValue')}
                    className="flex-1 px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white placeholder-stakeados-gray-400 focus:outline-none focus:border-stakeados-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeaderField(index)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-gaming transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t('modal.categories')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.name)}
                  className={cn(
                    'p-2 rounded-gaming border text-sm transition-colors text-left',
                    selectedCategories.includes(category.name)
                      ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                      : 'border-stakeados-gray-600 bg-stakeados-gray-800 text-stakeados-gray-300 hover:border-stakeados-gray-500'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t('modal.configuration')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.language')}
                </label>
                <select
                  value={formData.language}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      language: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.priority')} (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 1,
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 bg-stakeados-gray-800 border rounded-gaming text-white focus:outline-none focus:border-stakeados-primary',
                    errors.priority
                      ? 'border-red-500'
                      : 'border-stakeados-gray-600'
                  )}
                />
                {errors.priority && (
                  <p className="text-red-400 text-sm mt-1">{errors.priority}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.qualityScore')} (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.quality_score}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      quality_score: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.fetchInterval')} ({t('modal.seconds')})
                </label>
                <select
                  value={formData.fetch_interval}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      fetch_interval: parseInt(e.target.value),
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 bg-stakeados-gray-800 border rounded-gaming text-white focus:outline-none focus:border-stakeados-primary',
                    errors.fetch_interval
                      ? 'border-red-500'
                      : 'border-stakeados-gray-600'
                  )}
                >
                  <option value={300}>5 {t('modal.minutes')}</option>
                  <option value={900}>15 {t('modal.minutes')}</option>
                  <option value={1800}>30 {t('modal.minutes')}</option>
                  <option value={3600}>1 {t('modal.hour')}</option>
                  <option value={7200}>2 {t('modal.hours')}</option>
                  <option value={14400}>4 {t('modal.hours')}</option>
                  <option value={21600}>6 {t('modal.hours')}</option>
                  <option value={43200}>12 {t('modal.hours')}</option>
                  <option value={86400}>24 {t('modal.hours')}</option>
                </select>
                {errors.fetch_interval && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.fetch_interval}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stakeados-gray-300 mb-2">
                  {t('modal.maxFailures')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.max_failures}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      max_failures: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full px-3 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 rounded-gaming text-white focus:outline-none focus:border-stakeados-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary focus:ring-2"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-stakeados-gray-300"
              >
                {t('modal.activeSource')}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stakeados-gray-600">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors"
            >
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary-dark text-stakeados-dark rounded-gaming transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {source ? t('modal.update') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
