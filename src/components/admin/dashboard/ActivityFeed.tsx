'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Newspaper,
  Users,
  Settings,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import type {
  ActivityItem,
  ActivityPriority,
  ActivityType,
} from '@/types/adminDashboard';

function timeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  let value = Math.floor((Date.now() - ts) / 1000);
  const table: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let unit: Intl.RelativeTimeFormatUnit = 'second';
  for (const [k, u] of table) {
    if (value < k) {
      unit = u;
      break;
    }
    value = Math.floor(value / k);
  }
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  return rtf.format(-value, unit);
}

const getPriorityColor = (p: ActivityPriority) =>
  p === 'critical'
    ? 'border-red-500 bg-red-500/10'
    : p === 'high'
      ? 'border-orange-500 bg-orange-500/10'
      : p === 'medium'
        ? 'border-yellow-500 bg-yellow-500/10'
        : 'border-gray-600 bg-gray-800';

const getTypeIcon = (t: ActivityType) =>
  t === 'article'
    ? FileText
    : t === 'news'
      ? Newspaper
      : t === 'user'
        ? Users
        : t === 'system'
          ? Settings
          : t === 'error'
            ? AlertTriangle
            : Bell;

export function ActivityFeed({
  activities,
  loading,
  onItemClick,
  enableFilters = true,
  filterTypes,
  filterPriorities,
  enableInfiniteScroll = false,
  onLoadMore,
  hasMore,
}: {
  activities: ActivityItem[];
  loading?: boolean;
  onItemClick?: (item: ActivityItem) => void;
  enableFilters?: boolean;
  filterTypes?: ActivityType[];
  filterPriorities?: ActivityPriority[];
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void | Promise<void>;
  hasMore?: boolean;
}) {
  const filtered = useMemo(
    () =>
      activities.filter(
        a =>
          (!filterTypes?.length || filterTypes.includes(a.type)) &&
          (!filterPriorities?.length || filterPriorities.includes(a.priority))
      ),
    [activities, filterTypes, filterPriorities]
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      async entries => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          await onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [enableInfiniteScroll, onLoadMore, hasMore]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Actividad reciente</h3>
        {enableFilters && (
          <div className="text-xs text-gray-400">
            {filtered.length} de {activities.length}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filtered.map(activity => {
              const Icon = getTypeIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className={`border-l-4 pl-4 py-3 cursor-pointer hover:bg-gray-700/50 rounded-r ${getPriorityColor(activity.priority)}`}
                  onClick={() => onItemClick?.(activity)}
                  role={onItemClick ? 'button' : undefined}
                  aria-label={activity.title}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.title}</p>
                      <p className="text-gray-400 text-sm">
                        {activity.description}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {timeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {enableInfiniteScroll && <div ref={sentinelRef} />}
          </div>

          {!enableInfiniteScroll && hasMore && onLoadMore && (
            <div className="mt-4 flex justify-center">
              <button
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
                onClick={() => onLoadMore()}
              >
                Cargar más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
