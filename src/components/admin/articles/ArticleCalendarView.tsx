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
  ArchiveBoxIcon,
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
} from 'date-fns';
import { es } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  author: {
    display_name: string;
    username: string;
  };
  category?: {
    name: string;
    color?: string;
  };
}

interface ArticleCalendarViewProps {
  articles: Article[];
  loading: boolean;
  onStatusChange: (
    articleId: string,
    status: Article['status']
  ) => Promise<void>;
}

// TODO: Use CalendarDay interface when implementing calendar view
// interface CalendarDay {
//   date: Date
//   isCurrentMonth: boolean
//   articles: Article[]
// }

export function ArticleCalendarView({
  articles,
  loading,
  onStatusChange,
}: ArticleCalendarViewProps) {
  const t = useTranslations('admin.articles.calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'published' | 'scheduled' | 'all'>(
    'all'
  );

  // Group articles by date
  const articlesByDate = useMemo(() => {
    const grouped = new Map<string, Article[]>();

    articles.forEach(article => {
      let dateKey: string;

      if (viewMode === 'published' && article.published_at) {
        dateKey = format(parseISO(article.published_at), 'yyyy-MM-dd');
      } else if (
        viewMode === 'scheduled' &&
        article.status === 'published' &&
        article.published_at
      ) {
        const publishDate = parseISO(article.published_at);
        if (publishDate > new Date()) {
          dateKey = format(publishDate, 'yyyy-MM-dd');
        } else {
          return; // Skip already published articles
        }
      } else {
        dateKey = format(parseISO(article.created_at), 'yyyy-MM-dd');
      }

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(article);
    });

    return grouped;
  }, [articles, viewMode]);

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

  const getStatusColor = (status: Article['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'review':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: Article['status']) => {
    switch (status) {
      case 'draft':
        return ClockIcon;
      case 'review':
        return ExclamationTriangleIcon;
      case 'published':
        return CheckCircleIcon;
      case 'archived':
        return ArchiveBoxIcon;
      default:
        return ClockIcon;
    }
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
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'all'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('viewModes.all')}
          </button>
          <button
            onClick={() => setViewMode('published')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'published'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('viewModes.published')}
          </button>
          <button
            onClick={() => setViewMode('scheduled')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'scheduled'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('viewModes.scheduled')}
          </button>
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
                  min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors
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
                <div className="flex items-center justify-between mb-1">
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
                    const StatusIcon = getStatusIcon(article.status);
                    return (
                      <div
                        key={article.id}
                        className={`text-xs p-1 rounded truncate ${getStatusColor(article.status)}`}
                        title={article.title}
                      >
                        <div className="flex items-center">
                          <StatusIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{article.title}</span>
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
                  const StatusIcon = getStatusIcon(article.status);
                  return (
                    <div
                      key={article.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {article.title}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(article.status)}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`status.${article.status}`)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('by')} {article.author.display_name}
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
                        <button
                          onClick={() =>
                            (window.location.href = `/admin/articles/${article.id}/edit`)
                          }
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          {t('actions.edit')}
                        </button>

                        <select
                          value={article.status}
                          onChange={e =>
                            onStatusChange(
                              article.id,
                              e.target.value as Article['status']
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
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t('noArticlesOnDate')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('noArticlesOnDateDescription')}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t('selectDateToView')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('selectDateToViewDescription')}
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
                { status: 'draft' as const, icon: ClockIcon },
                { status: 'review' as const, icon: ExclamationTriangleIcon },
                { status: 'published' as const, icon: CheckCircleIcon },
                { status: 'archived' as const, icon: ArchiveBoxIcon },
              ].map(({ status, icon: Icon }) => (
                <div key={status} className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {t(`status.${status}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
