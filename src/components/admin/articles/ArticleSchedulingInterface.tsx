'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  parseISO,
  isBefore,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface ArticleScheduleData {
  scheduled_at: string;
  timezone: string;
  recurring_pattern?: string;
  auto_publish: boolean;
  publish_channels: string[];
  notes?: string;
}

interface ExistingSchedule {
  id: string;
  scheduled_at: string;
  timezone: string;
  recurring_pattern?: string;
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
  created_at: string;
}

interface ArticleSchedulingInterfaceProps {
  initialData?: Partial<ArticleScheduleData>;
  existingSchedules?: ExistingSchedule[];
  onSchedule: (data: ArticleScheduleData) => Promise<void>;
  onCancel?: (scheduleId: string) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

const RECURRING_PATTERNS = [
  { value: '', label: 'No repetition' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom pattern' },
];

const PUBLISH_CHANNELS = [
  {
    value: 'web',
    label: 'Website',
    description: 'Publish on the main website',
  },
  {
    value: 'newsletter',
    label: 'Newsletter',
    description: 'Include in newsletter',
  },
  {
    value: 'social',
    label: 'Social Media',
    description: 'Share on social platforms',
  },
  { value: 'rss', label: 'RSS Feed', description: 'Add to RSS feed' },
];

export function ArticleSchedulingInterface({
  initialData,
  existingSchedules = [],
  onSchedule,
  onCancel,
  onClose,
  loading = false,
}: ArticleSchedulingInterfaceProps) {
  const t = useTranslations('admin.articles.scheduling');

  const [scheduleData, setScheduleData] = useState<ArticleScheduleData>({
    scheduled_at: '',
    timezone: 'UTC',
    recurring_pattern: '',
    auto_publish: true,
    publish_channels: ['web'],
    notes: '',
    ...initialData,
  });

  const [customPattern, setCustomPattern] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

  // Set default date to tomorrow at 9 AM
  useEffect(() => {
    if (!scheduleData.scheduled_at) {
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduleData(prev => ({
        ...prev,
        scheduled_at: format(tomorrow, "yyyy-MM-dd'T'HH:mm"),
      }));
    }
  }, [scheduleData.scheduled_at]);

  // Generate preview dates for recurring patterns
  useEffect(() => {
    if (scheduleData.scheduled_at && scheduleData.recurring_pattern) {
      generatePreviewDates();
    } else {
      setPreviewDates([]);
    }
  }, [
    scheduleData.scheduled_at,
    scheduleData.recurring_pattern,
    customPattern,
  ]);

  const generatePreviewDates = () => {
    if (!scheduleData.scheduled_at) return;

    const startDate = parseISO(scheduleData.scheduled_at);
    const dates: Date[] = [startDate];

    let nextDate = startDate;
    const maxPreview = 5; // Show next 5 occurrences

    for (let i = 0; i < maxPreview; i++) {
      switch (scheduleData.recurring_pattern) {
        case 'daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          nextDate = addDays(nextDate, 7);
          break;
        case 'biweekly':
          nextDate = addDays(nextDate, 14);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'custom':
          // Parse custom pattern (e.g., "every 3 days", "every 2 weeks")
          if (customPattern.includes('day')) {
            const days = parseInt(customPattern.match(/\d+/)?.[0] || '1');
            nextDate = addDays(nextDate, days);
          } else if (customPattern.includes('week')) {
            const weeks = parseInt(customPattern.match(/\d+/)?.[0] || '1');
            nextDate = addWeeks(nextDate, weeks);
          } else {
            return; // Invalid custom pattern
          }
          break;
        default:
          return;
      }
      dates.push(nextDate);
    }

    setPreviewDates(dates);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!scheduleData.scheduled_at) {
      errors.scheduled_at = t('errors.dateRequired');
    } else {
      const scheduledDate = parseISO(scheduleData.scheduled_at);
      if (isBefore(scheduledDate, new Date())) {
        errors.scheduled_at = t('errors.dateInPast');
      }
    }

    if (!scheduleData.timezone) {
      errors.timezone = t('errors.timezoneRequired');
    }

    if (scheduleData.publish_channels.length === 0) {
      errors.publish_channels = t('errors.channelsRequired');
    }

    if (scheduleData.recurring_pattern === 'custom' && !customPattern) {
      errors.custom_pattern = t('errors.customPatternRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let finalData = { ...scheduleData };

      if (scheduleData.recurring_pattern === 'custom') {
        finalData.recurring_pattern = customPattern;
      }

      await onSchedule(finalData);
    } catch (error) {
      console.error('Failed to schedule article:', error);
    }
  };

  const handleQuickSchedule = (hours: number) => {
    const quickDate = addDays(new Date(), hours / 24);
    setScheduleData(prev => ({
      ...prev,
      scheduled_at: format(quickDate, "yyyy-MM-dd'T'HH:mm"),
    }));
  };

  const activeSchedule = existingSchedules.find(s => s.status === 'scheduled');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeSchedule ? t('updateSchedule') : t('schedulePublication')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('scheduleDescription')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Schedule Warning */}
          {activeSchedule && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {t('existingSchedule')}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {t('existingScheduleDescription', {
                      date: format(
                        parseISO(activeSchedule.scheduled_at),
                        'PPpp',
                        { locale: es }
                      ),
                    })}
                  </p>
                  {onCancel && (
                    <button
                      onClick={() => onCancel(activeSchedule.id)}
                      className="text-sm text-yellow-800 dark:text-yellow-200 underline hover:no-underline mt-2"
                    >
                      {t('cancelExisting')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Schedule Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('quickSchedule')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { hours: 1, label: t('in1Hour') },
                { hours: 6, label: t('in6Hours') },
                { hours: 24, label: t('tomorrow') },
                { hours: 168, label: t('nextWeek') },
              ].map(({ hours, label }) => (
                <button
                  key={hours}
                  onClick={() => handleQuickSchedule(hours)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                {t('publishDateTime')}
              </label>
              <input
                type="datetime-local"
                value={scheduleData.scheduled_at}
                onChange={e =>
                  setScheduleData(prev => ({
                    ...prev,
                    scheduled_at: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  validationErrors.scheduled_at
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {validationErrors.scheduled_at && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.scheduled_at}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                {t('timezone')}
              </label>
              <select
                value={scheduleData.timezone}
                onChange={e =>
                  setScheduleData(prev => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  validationErrors.timezone
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {validationErrors.timezone && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.timezone}
                </p>
              )}
            </div>
          </div>

          {/* Recurring Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <ArrowPathIcon className="h-4 w-4 inline mr-1" />
              {t('recurringPattern')}
            </label>
            <select
              value={scheduleData.recurring_pattern}
              onChange={e =>
                setScheduleData(prev => ({
                  ...prev,
                  recurring_pattern: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {RECURRING_PATTERNS.map(pattern => (
                <option key={pattern.value} value={pattern.value}>
                  {pattern.label}
                </option>
              ))}
            </select>

            {scheduleData.recurring_pattern === 'custom' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customPattern}
                  onChange={e => setCustomPattern(e.target.value)}
                  placeholder={t('customPatternPlaceholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    validationErrors.custom_pattern
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {validationErrors.custom_pattern && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.custom_pattern}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('customPatternHelp')}
                </p>
              </div>
            )}

            {/* Preview recurring dates */}
            {previewDates.length > 1 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  {t('upcomingPublications')}
                </h4>
                <div className="space-y-1">
                  {previewDates.slice(0, 5).map((date, index) => (
                    <div
                      key={index}
                      className="text-sm text-blue-700 dark:text-blue-300"
                    >
                      {format(date, 'PPpp', { locale: es })}
                    </div>
                  ))}
                  {previewDates.length > 5 && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {t('andMore', { count: previewDates.length - 5 })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Publish Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('publishChannels')}
            </label>
            <div className="space-y-2">
              {PUBLISH_CHANNELS.map(channel => (
                <label key={channel.value} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={scheduleData.publish_channels.includes(
                      channel.value
                    )}
                    onChange={e => {
                      if (e.target.checked) {
                        setScheduleData(prev => ({
                          ...prev,
                          publish_channels: [
                            ...prev.publish_channels,
                            channel.value,
                          ],
                        }));
                      } else {
                        setScheduleData(prev => ({
                          ...prev,
                          publish_channels: prev.publish_channels.filter(
                            c => c !== channel.value
                          ),
                        }));
                      }
                    }}
                    className="mt-1 rounded"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {channel.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {channel.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {validationErrors.publish_channels && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.publish_channels}
              </p>
            )}
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              {showAdvanced ? t('hideAdvanced') : t('showAdvanced')}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Auto Publish */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleData.auto_publish}
                    onChange={e =>
                      setScheduleData(prev => ({
                        ...prev,
                        auto_publish: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('autoPublish')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('autoPublishDescription')}
                    </div>
                  </div>
                </label>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('notes')}
                  </label>
                  <textarea
                    value={scheduleData.notes || ''}
                    onChange={e =>
                      setScheduleData(prev => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={t('notesPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                {t('scheduling')}
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {activeSchedule
                  ? t('updateSchedule')
                  : t('schedulePublication')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
