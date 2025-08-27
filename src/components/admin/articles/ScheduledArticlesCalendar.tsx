'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  isAfter,
  isBefore,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduledArticle {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  scheduled_at: string;
  timezone: string;
  recurring_pattern?: string;
  auto_publish: boolean;
  publish_channels: string[];
  author: {
    display_name: string;
    username: string;
  };
  category?: {
    name: string;
    color?: string;
  };
  schedule_status: 'scheduled' | 'published' | 'cancelled' | 'failed';
}

interface ScheduledArticlesCalendarProps {
  articles: ScheduledArticle[];
  loading: boolean;
  onEditSchedule: (articleId: string) => void;
  onCancelSchedule: (articleId: string) => void;
  onViewArticle: (articleId: string) => void;
  onStatusChange?: (
    articleId: string,
    status: ScheduledArticle['status']
  ) => Promise<void>;
}

export function ScheduledArticlesCalendar({
  articles,
  loading,
  onEditSchedule,
  onCancelSchedule,
  onViewArticle,
  onStatusChange,
}: ScheduledArticlesCalendarProps) {
  const t = useTranslations('admin.articles.calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<
    'all' | 'scheduled' | 'published' | 'failed'
  >('scheduled');

  // Filter articles based on view mode
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      switch (viewMode) {
        case 'scheduled':
          return (
            article.schedule_status === 'scheduled' &&
            isAfter(parseISO(article.scheduled_at), new Date())
          );
        case 'published':
          return article.schedule_status === 'published';
        case 'failed':
          return article.schedule_status === 'failed';
        default:
          return true;
      }
    });
  }, [articles, viewMode]);

  // Group articles by date
  const articlesByDate = useMemo(() => {
    const grouped = new Map<string, ScheduledArticle[]>();

    filteredArticles.forEach(article => {
      const dateKey = format(parseISO(article.scheduled_at), 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(article);
    });

    // Sort articles within each date by scheduled time
    grouped.forEach(articles => {
      articles.sort(
        (a, b) =>
          parseISO(a.scheduled_at).getTime() -
          parseISO(b.scheduled_at).getTime()
      );
    });

    return grouped;
  }, [filteredArticles]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        articles: articlesByDate.get(dateKey) || [],
      };
    });
  }, [currentDate, articlesByDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(
      selectedDate && isSameDay(selectedDate, date) ? null : date
    );
  };

  const getScheduleStatusColor = (
    status: ScheduledArticle['schedule_status']
  ) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getScheduleStatusIcon = (
    status: ScheduledArticle['schedule_status']
  ) => {
    switch (status) {
      case 'scheduled':
        return ClockIcon;
      case 'published':
        return CheckCircleIcon;
      case 'failed':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const isOverdue = (article: ScheduledArticle) => {
    return (
      article.schedule_status === 'scheduled' &&
      isBefore(parseISO(article.scheduled_at), new Date())
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-7 gap-1 mb-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedDateArticles = selectedDate
    ? articlesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>

          <div className="flex items-center space-x-1">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: t('viewModes.all') },
            { key: 'scheduled', label: t('viewModes.scheduled') },
            { key: 'published', label: t('viewModes.published') },
            { key: 'failed', label: t('viewModes.failed') },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(day.date)}
                className={`
                  min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors
                  ${
                    day.isCurrentMonth
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                  }
                  ${
                    selectedDate && isSameDay(selectedDate, day.date)
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }
                  ${
                    isToday(day.date)
                      ? 'ring-1 ring-blue-300 dark:ring-blue-700'
                      : ''
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isToday(day.date)
                        ? 'text-blue-600 dark:text-blue-400'
                        : day.isCurrentMonth
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {format(day.date, 'd')}
                  </span>

                  {day.articles.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
                      {day.articles.length}
                    </span>
                  )}
                </div>

                {/* Article indicators */}
                <div className="space-y-1">
                  {day.articles.slice(0, 3).map(article => {
                    const StatusIcon = getScheduleStatusIcon(
                      article.schedule_status
                    );
                    const isOverdueArticle = isOverdue(article);

                    return (
                      <div
                        key={article.id}
                        className={`text-xs p-1.5 rounded truncate ${getScheduleStatusColor(article.schedule_status)} ${
                          isOverdueArticle ? 'ring-1 ring-red-400' : ''
                        }`}
                        title={`${article.title} - ${format(parseISO(article.scheduled_at), 'HH:mm')}`}
                      >
                        <div className="flex items-center">
                          <StatusIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{article.title}</span>
                          {isOverdueArticle && (
                            <ExclamationTriangleIcon className="h-3 w-3 ml-1 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs opacity-75 mt-0.5">
                          {format(parseISO(article.scheduled_at), 'HH:mm')}
                          {article.recurring_pattern && (
                            <span className="ml-1">🔄</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {day.articles.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{day.articles.length - 3} {t('more')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {selectedDate
                ? format(selectedDate, 'dd MMMM yyyy', { locale: es })
                : t('selectDate')}
            </h3>

            {selectedDate && selectedDateArticles.length > 0 ? (
              <div className="space-y-3">
                {selectedDateArticles.map(article => {
                  const StatusIcon = getScheduleStatusIcon(
                    article.schedule_status
                  );
                  const isOverdueArticle = isOverdue(article);

                  return (
                    <div
                      key={article.id}
                      className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        isOverdueArticle
                          ? 'border-red-300 dark:border-red-700'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {article.title}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getScheduleStatusColor(article.schedule_status)}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`scheduleStatus.${article.schedule_status}`)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div>
                          <ClockIcon className="h-3 w-3 inline mr-1" />
                          {format(parseISO(article.scheduled_at), 'HH:mm')} (
                          {article.timezone})
                        </div>
                        <div>
                          {t('by')} {article.author.display_name}
                        </div>
                        {article.recurring_pattern && (
                          <div className="text-blue-600 dark:text-blue-400">
                            🔄{' '}
                            {t(
                              `recurringPatterns.${article.recurring_pattern}`
                            )}
                          </div>
                        )}
                        {isOverdueArticle && (
                          <div className="text-red-600 dark:text-red-400 font-medium">
                            ⚠️ {t('overdue')}
                          </div>
                        )}
                      </div>

                      {article.category && (
                        <div className="mt-2">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: article.category.color
                                ? `${article.category.color}20`
                                : undefined,
                              color: article.category.color || undefined,
                            }}
                          >
                            {article.category.name}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onViewArticle(article.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {t('actions.view')}
                          </button>

                          {article.schedule_status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => onEditSchedule(article.id)}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 flex items-center"
                              >
                                <PencilIcon className="h-3 w-3 mr-1" />
                                {t('actions.editSchedule')}
                              </button>

                              <button
                                onClick={() => onCancelSchedule(article.id)}
                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 flex items-center"
                              >
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                {t('actions.cancel')}
                              </button>
                            </>
                          )}
                        </div>

                        {onStatusChange && (
                          <select
                            value={article.status}
                            onChange={e =>
                              onStatusChange(
                                article.id,
                                e.target.value as ScheduledArticle['status']
                              )
                            }
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="draft">{t('status.draft')}</option>
                            <option value="review">{t('status.review')}</option>
                            <option value="published">
                              {t('status.published')}
                            </option>
                            <option value="archived">
                              {t('status.archived')}
                            </option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t('noScheduledArticles')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('noScheduledArticlesDescription')}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t('selectDateToView')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('selectDateToViewScheduled')}
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('legend.title')}
            </h4>

            <div className="space-y-2">
              {[
                { status: 'scheduled' as const, icon: ClockIcon },
                { status: 'published' as const, icon: CheckCircleIcon },
                { status: 'failed' as const, icon: ExclamationTriangleIcon },
              ].map(({ status, icon: Icon }) => (
                <div key={status} className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScheduleStatusColor(status)}`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {t(`scheduleStatus.${status}`)}
                  </span>
                </div>
              ))}

              <div className="flex items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  🔄 = {t('legend.recurring')}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ = {t('legend.overdue')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
