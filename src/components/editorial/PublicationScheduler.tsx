'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  Clock,
  Globe,
  Send,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react';
import { EditorialService } from '@/lib/services/editorialService';
import type { PublicationSchedule } from '@/types/editorial';

interface PublicationSchedulerProps {
  contentId?: string;
  contentType?: 'article' | 'news';
  onScheduled?: (schedule: PublicationSchedule) => void;
  className?: string;
}

export function PublicationScheduler({
  contentId,
  contentType,
  onScheduled,
  className = '',
}: PublicationSchedulerProps) {
  const t = useTranslations('editorial');
  const [schedules, setSchedules] = useState<PublicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_for: '',
    timezone: 'UTC',
    auto_publish: true,
    publish_channels: ['web'] as string[],
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await EditorialService.getPublicationSchedule();
      setSchedules(data);
    } catch (err) {
      console.error('Error loading publication schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentId || !contentType) {
      setError('Content ID and type are required');
      return;
    }

    try {
      const schedule = await EditorialService.schedulePublication({
        content_id: contentId,
        content_type: contentType,
        scheduled_for: formData.scheduled_for,
        timezone: formData.timezone,
        status: 'scheduled',
        auto_publish: formData.auto_publish,
        publish_channels: formData.publish_channels,
        metadata: {},
      });

      onScheduled?.(schedule);
      setShowCreateForm(false);
      setFormData({
        scheduled_for: '',
        timezone: 'UTC',
        auto_publish: true,
        publish_channels: ['web'],
      });
      await loadSchedules();
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create schedule'
      );
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    try {
      await EditorialService.cancelScheduledPublication(scheduleId);
      await loadSchedules();
    } catch (err) {
      console.error('Error cancelling schedule:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'published':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'published':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <Pause className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = (scheduledFor: string, status: string) => {
    return status === 'scheduled' && new Date(scheduledFor) < new Date();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
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
            {t('publication.scheduler_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('publication.scheduler_subtitle')}
          </p>
        </div>
        {contentId && contentType && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('publication.schedule_publication')}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Create Schedule Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('publication.schedule_new')}
          </h3>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('publication.scheduled_date')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_for}
                  onChange={e =>
                    setFormData({ ...formData, scheduled_for: e.target.value })
                  }
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('publication.timezone')}
                </label>
                <select
                  value={formData.timezone}
                  onChange={e =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Madrid">Madrid</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('publication.publish_channels')}
              </label>
              <div className="space-y-2">
                {['web', 'newsletter', 'social'].map(channel => (
                  <label key={channel} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.publish_channels.includes(channel)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            publish_channels: [
                              ...formData.publish_channels,
                              channel,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            publish_channels: formData.publish_channels.filter(
                              c => c !== channel
                            ),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {t(`publication.channel.${channel}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.auto_publish}
                  onChange={e =>
                    setFormData({ ...formData, auto_publish: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('publication.auto_publish')}
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('publication.auto_publish_help')}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('publication.cancel')}
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                {t('publication.schedule')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scheduled Publications */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('publication.no_schedules')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('publication.no_schedules_description')}
            </p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div
              key={schedule.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 border transition-all hover:shadow-md ${
                isOverdue(schedule.scheduled_for, schedule.status)
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {schedule.content?.title ||
                        `${schedule.content_type} #${schedule.content_id.slice(0, 8)}`}
                    </h3>
                    <span
                      className={`flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(schedule.status)}`}
                    >
                      {getStatusIcon(schedule.status)}
                      <span className="ml-1">
                        {t(`publication.status.${schedule.status}`)}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(schedule.scheduled_for).toLocaleString()} (
                        {schedule.timezone})
                      </span>
                      {isOverdue(schedule.scheduled_for, schedule.status) && (
                        <AlertTriangle className="h-4 w-4 ml-1 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      <span>{schedule.publish_channels.join(', ')}</span>
                    </div>
                    {schedule.auto_publish && (
                      <div className="flex items-center">
                        <Play className="h-4 w-4 mr-1" />
                        <span>{t('publication.auto_publish')}</span>
                      </div>
                    )}
                  </div>

                  {schedule.publisher && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('publication.scheduled_by')}: {schedule.publisher.name}
                    </p>
                  )}

                  {schedule.published_at && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      {t('publication.published_at')}:{' '}
                      {new Date(schedule.published_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {schedule.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleCancelSchedule(schedule.id)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                        title={t('publication.cancel_schedule')}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={t('publication.edit_schedule')}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
