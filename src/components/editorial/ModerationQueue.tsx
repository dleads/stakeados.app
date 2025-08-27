'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { EditorialService } from '@/lib/services/editorialService';
import type { ModerationQueueItem, ModerationFilters } from '@/types/editorial';

interface ModerationQueueProps {
  className?: string;
}

export function ModerationQueue({ className = '' }: ModerationQueueProps) {
  const t = useTranslations('editorial');
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ModerationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  useEffect(() => {
    loadModerationQueue();
  }, [filters]);

  const loadModerationQueue = async () => {
    try {
      setLoading(true);
      const data = await EditorialService.getModerationQueue(filters);
      setItems(data);
    } catch (err) {
      console.error('Error loading moderation queue:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load moderation queue'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimItem = async (itemId: string) => {
    try {
      setProcessingItem(itemId);
      // In a real app, we'd get the current user ID
      await EditorialService.claimModerationItem(itemId, 'current-user-id');
      await loadModerationQueue();
    } catch (err) {
      console.error('Error claiming moderation item:', err);
    } finally {
      setProcessingItem(null);
    }
  };

  const handleModerationAction = async (
    itemId: string,
    action: 'approved' | 'rejected' | 'escalated',
    reason?: string
  ) => {
    try {
      setProcessingItem(itemId);
      await EditorialService.updateModerationItem(itemId, {
        status: action,
        moderation_result: {
          action:
            action === 'approved'
              ? 'approve'
              : action === 'rejected'
                ? 'reject'
                : 'escalate',
          reason,
          automated: false,
        },
      });
      await loadModerationQueue();
    } catch (err) {
      console.error('Error processing moderation action:', err);
    } finally {
      setProcessingItem(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'ai_flagged':
        return <AlertTriangle className="h-4 w-4" />;
      case 'user_reported':
        return <Flag className="h-4 w-4" />;
      case 'manual_review':
        return <Eye className="h-4 w-4" />;
      case 'policy_violation':
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('moderation.queue_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('moderation.queue_subtitle', { count: items.length })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('moderation.filters')}
          </button>
          <button
            onClick={loadModerationQueue}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('moderation.refresh')}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.status || ''}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value || undefined })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('moderation.all_statuses')}</option>
              <option value="pending">{t('moderation.status.pending')}</option>
              <option value="in_review">
                {t('moderation.status.in_review')}
              </option>
              <option value="approved">
                {t('moderation.status.approved')}
              </option>
              <option value="rejected">
                {t('moderation.status.rejected')}
              </option>
              <option value="escalated">
                {t('moderation.status.escalated')}
              </option>
            </select>

            <select
              value={filters.priority || ''}
              onChange={e =>
                setFilters({
                  ...filters,
                  priority: e.target.value || undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('moderation.all_priorities')}</option>
              <option value="urgent">{t('moderation.priority.urgent')}</option>
              <option value="high">{t('moderation.priority.high')}</option>
              <option value="medium">{t('moderation.priority.medium')}</option>
              <option value="low">{t('moderation.priority.low')}</option>
            </select>

            <select
              value={filters.reason || ''}
              onChange={e =>
                setFilters({ ...filters, reason: e.target.value || undefined })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('moderation.all_reasons')}</option>
              <option value="ai_flagged">
                {t('moderation.reason.ai_flagged')}
              </option>
              <option value="user_reported">
                {t('moderation.reason.user_reported')}
              </option>
              <option value="manual_review">
                {t('moderation.reason.manual_review')}
              </option>
              <option value="policy_violation">
                {t('moderation.reason.policy_violation')}
              </option>
            </select>

            <select
              value={filters.content_type || ''}
              onChange={e =>
                setFilters({
                  ...filters,
                  content_type: e.target.value || undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('moderation.all_content_types')}</option>
              <option value="article">
                {t('moderation.content_type.article')}
              </option>
              <option value="news">{t('moderation.content_type.news')}</option>
              <option value="proposal">
                {t('moderation.content_type.proposal')}
              </option>
              <option value="comment">
                {t('moderation.content_type.comment')}
              </option>
            </select>

            <button
              onClick={() => setFilters({})}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('moderation.clear_filters')}
            </button>
          </div>
        </div>
      )}

      {/* Moderation Queue */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('moderation.queue_empty')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('moderation.queue_empty_description')}
            </p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getReasonIcon(item.reason)}
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {item.content?.title ||
                          `${item.content_type} #${item.content_id.slice(0, 8)}`}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}
                    >
                      {t(`moderation.priority.${item.priority}`)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {t(`moderation.status.${item.status}`)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <span className="capitalize">
                        {t(`moderation.reason.${item.reason}`)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="capitalize">
                        {t(`moderation.content_type.${item.content_type}`)}
                      </span>
                    </div>
                    {item.user_reports > 0 && (
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 mr-1" />
                        <span>
                          {t('moderation.user_reports', {
                            count: item.user_reports,
                          })}
                        </span>
                      </div>
                    )}
                    {item.ai_confidence && (
                      <div className="flex items-center">
                        <span>
                          {t('moderation.ai_confidence')}:{' '}
                          {Math.round(item.ai_confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {item.ai_flags && item.ai_flags.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('moderation.ai_flags')}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.ai_flags.map((flag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.content?.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {item.content.excerpt}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      {t('moderation.created')}:{' '}
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    {item.moderator && (
                      <>
                        <span className="mx-2">•</span>
                        <User className="h-4 w-4 mr-1" />
                        <span>
                          {t('moderation.assigned_to')}: {item.moderator.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleClaimItem(item.id)}
                      disabled={processingItem === item.id}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {processingItem === item.id
                        ? t('moderation.claiming')
                        : t('moderation.claim')}
                    </button>
                  )}

                  {item.status === 'in_review' && (
                    <>
                      <button
                        onClick={() =>
                          handleModerationAction(item.id, 'approved')
                        }
                        disabled={processingItem === item.id}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleModerationAction(item.id, 'rejected')
                        }
                        disabled={processingItem === item.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleModerationAction(item.id, 'escalated')
                        }
                        disabled={processingItem === item.id}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {item.moderation_result.reason && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('moderation.decision_reason')}:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.moderation_result.reason}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
