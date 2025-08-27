'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'ghost';
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 text-stakeados-gray-500 flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
        {title}
      </h3>

      <p className="text-stakeados-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'secondary'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined empty states
export function NoCoursesEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={<div className="text-4xl">📚</div>}
      title="No Courses Yet"
      description="You haven't enrolled in any courses yet. Start your Web3 learning journey today!"
      action={{
        label: 'Browse Courses',
        onClick: onBrowse,
      }}
    />
  );
}

export function NoArticlesEmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <EmptyState
      icon={<div className="text-4xl">📝</div>}
      title="No Articles Yet"
      description="You haven't written any articles yet. Share your knowledge with the community!"
      action={{
        label: 'Write Article',
        onClick: onWrite,
      }}
    />
  );
}

export function NoNewsEmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <EmptyState
      icon={<div className="text-4xl">📰</div>}
      title="No News Available"
      description="No news articles are currently available. Check back later for the latest crypto updates."
      action={{
        label: 'Refresh',
        onClick: onRefresh,
      }}
    />
  );
}

export function NoSearchResultsEmptyState({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  return (
    <EmptyState
      icon={<div className="text-4xl">🔍</div>}
      title="No Results Found"
      description={`We couldn't find anything matching "${query}". Try different keywords or browse our categories.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'secondary',
      }}
      secondaryAction={{
        label: 'Browse All',
        onClick: () => (window.location.href = '/courses'),
      }}
    />
  );
}

export function NoAchievementsEmptyState({
  onStartLearning,
}: {
  onStartLearning: () => void;
}) {
  return (
    <EmptyState
      icon={<div className="text-4xl">🏆</div>}
      title="No Achievements Yet"
      description="Start learning and participating to earn your first achievements and unlock rewards!"
      action={{
        label: 'Start Learning',
        onClick: onStartLearning,
      }}
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      icon={<div className="text-4xl">🔔</div>}
      title="No Notifications"
      description="You're all caught up! New notifications will appear here when you have updates."
      className="py-8"
    />
  );
}
