'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Newspaper,
  BookOpen,
  Navigation,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Link } from '@/lib/utils/navigation';
import type { Locale } from '@/types/content';

interface EmptyStateHandlerProps {
  type: 'news' | 'articles' | 'courses' | 'navigation' | 'generic';
  locale: Locale;
  className?: string;
  showCreateAction?: boolean;
}

export default function EmptyStateHandler({
  type,
  locale,
  className = '',
  showCreateAction = false,
}: EmptyStateHandlerProps) {
  const t = useTranslations('homepage.emptyStates');

  const getEmptyStateConfig = () => {
    switch (type) {
      case 'news':
        return {
          icon: Newspaper,
          title: t('news.title'),
          description: t('news.description'),
          primaryAction: {
            text: t('news.primaryAction'),
            href: locale === 'es' ? '/noticias' : '/news',
          },
          secondaryAction: showCreateAction
            ? {
                text: t('news.secondaryAction'),
                href: '/admin/news',
              }
            : undefined,
        };
      case 'articles':
        return {
          icon: FileText,
          title: t('articles.title'),
          description: t('articles.description'),
          primaryAction: {
            text: t('articles.primaryAction'),
            href: locale === 'es' ? '/articulos' : '/articles',
          },
          secondaryAction: showCreateAction
            ? {
                text: t('articles.secondaryAction'),
                href: '/articles/create',
              }
            : undefined,
        };
      case 'courses':
        return {
          icon: BookOpen,
          title: t('courses.title'),
          description: t('courses.description'),
          primaryAction: {
            text: t('courses.primaryAction'),
            href: '/courses',
          },
          secondaryAction: showCreateAction
            ? {
                text: t('courses.secondaryAction'),
                href: '/courses/create',
              }
            : undefined,
        };
      case 'navigation':
        return {
          icon: Navigation,
          title: t('navigation.title'),
          description: t('navigation.description'),
          primaryAction: {
            text: t('navigation.primaryAction'),
            href: '/',
          },
        };
      default:
        return {
          icon: FileText,
          title: t('generic.title'),
          description: t('generic.description'),
          primaryAction: {
            text: t('generic.primaryAction'),
            href: '/',
          },
        };
    }
  };

  const config = getEmptyStateConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`empty-state-handler bg-stakeados-gray-800/50 border border-stakeados-gray-700/50 rounded-gaming-lg p-6 sm:p-8 text-center ${className}`}
    >
      <div className="empty-state-content max-w-md mx-auto">
        {/* Icon */}
        <div className="empty-state-icon mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stakeados-gray-700/50 rounded-full">
            <IconComponent className="w-8 h-8 text-stakeados-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="empty-state-text mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-stakeados-gray-300 mb-3">
            {config.title}
          </h3>
          <p className="text-sm sm:text-base text-stakeados-gray-400 leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Actions */}
        <div className="empty-state-actions flex flex-col sm:flex-row gap-3 justify-center">
          {/* Primary Action */}
          <Link
            href={config.primaryAction.href}
            className="primary-action flex items-center justify-center gap-2 px-4 py-2 bg-stakeados-primary hover:bg-stakeados-primary/90 text-stakeados-dark font-semibold rounded-gaming transition-all duration-300 hover:-translate-y-1 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-primary focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {config.primaryAction.text}
            </span>
          </Link>

          {/* Secondary Action */}
          {config.secondaryAction && (
            <Link
              href={config.secondaryAction.href}
              className="secondary-action flex items-center justify-center gap-2 px-4 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-stakeados-gray-300 hover:text-white font-semibold rounded-gaming transition-all duration-300 hover:-translate-y-1 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm sm:text-base">
                {config.secondaryAction.text}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
