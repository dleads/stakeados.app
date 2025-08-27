'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import {
  BookOpen,
  Newspaper,
  GraduationCap,
  Users,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import type { Locale } from '@/types/content';

interface QuickNavigationSectionProps {
  locale: Locale;
  className?: string;
}

interface PlatformStats {
  totalArticles: number;
  totalNews: number;
  totalCourses: number;
  activeUsers: number;
}

export default function QuickNavigationSection({
  locale,
  className = '',
}: QuickNavigationSectionProps) {
  const t = useTranslations();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/homepage');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        // Set fallback stats
        setStats({
          totalArticles: 0,
          totalNews: 0,
          totalCourses: 0,
          activeUsers: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Navigation cards configuration
  const navigationCards = [
    {
      titleKey: 'homepage.sections.quickNavigation.cards.articles.title',
      descriptionKey:
        'homepage.sections.quickNavigation.cards.articles.description',
      statsLabelKey:
        'homepage.sections.quickNavigation.cards.articles.statsLabel',
      href: locale === 'es' ? '/articulos' : '/articles',
      icon: BookOpen,
      color: 'stakeados-primary',
      glowColor: 'rgba(0, 255, 136, 0.4)',
      statIndex: 0,
    },
    {
      titleKey: 'homepage.sections.quickNavigation.cards.news.title',
      descriptionKey:
        'homepage.sections.quickNavigation.cards.news.description',
      statsLabelKey: 'homepage.sections.quickNavigation.cards.news.statsLabel',
      href: locale === 'es' ? '/noticias' : '/news',
      icon: Newspaper,
      color: 'stakeados-blue',
      glowColor: 'rgba(0, 170, 255, 0.4)',
      statIndex: 1,
    },
    {
      titleKey: 'homepage.sections.quickNavigation.cards.courses.title',
      descriptionKey:
        'homepage.sections.quickNavigation.cards.courses.description',
      statsLabelKey:
        'homepage.sections.quickNavigation.cards.courses.statsLabel',
      href: locale === 'es' ? '/cursos' : '/courses',
      icon: GraduationCap,
      color: 'stakeados-purple',
      glowColor: 'rgba(170, 0, 255, 0.4)',
      statIndex: 2,
    },
    {
      titleKey: 'homepage.sections.quickNavigation.cards.community.title',
      descriptionKey:
        'homepage.sections.quickNavigation.cards.community.description',
      statsLabelKey:
        'homepage.sections.quickNavigation.cards.community.statsLabel',
      href: locale === 'es' ? '/comunidad' : '/community',
      icon: Users,
      color: 'stakeados-orange',
      glowColor: 'rgba(255, 102, 0, 0.4)',
      statIndex: 3,
    },
  ];

  const getStatValue = (index: number): string => {
    if (!stats) return '0';

    const values = [
      stats.totalArticles,
      stats.totalNews,
      stats.totalCourses,
      stats.activeUsers,
    ];

    return values[index]?.toLocaleString(locale) || '0';
  };

  return (
    <section
      className={`quick-navigation-section ${className}`}
      aria-label="Platform Navigation"
    >
      {/* Section Header */}
      <div className="section-header text-center mb-12">
        <div className="section-title-group flex items-center justify-center gap-3 mb-4">
          <div className="section-icon">
            <TrendingUp className="w-8 h-8 text-stakeados-primary" />
          </div>
          <h2 className="section-title text-3xl font-bold text-white">
            {t('homepage.sections.quickNavigation.title')}
          </h2>
        </div>
        <p className="section-subtitle text-stakeados-gray-300 max-w-2xl mx-auto">
          {t('homepage.sections.quickNavigation.subtitle')}
        </p>
      </div>

      {/* Navigation Cards Grid with mobile optimization */}
      <div className="navigation-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {navigationCards.map(card => {
          const IconComponent = card.icon;
          const statValue = getStatValue(card.statIndex);

          return (
            <Link
              key={card.titleKey}
              href={`/${locale}${card.href}`}
              className="navigation-card group relative overflow-hidden touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-primary focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark rounded-gaming-lg"
              style={{ minHeight: '48px' }} // Ensure minimum touch target (increased for better mobile UX)
            >
              {/* Card Background with Gaming Aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-br from-stakeados-gray-800/90 to-stakeados-gray-900/90 backdrop-blur-sm rounded-gaming-lg border border-stakeados-gray-700 group-hover:border-opacity-60 transition-all duration-300" />

              {/* Hover Glow Effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-gaming-lg blur-xl"
                style={{
                  background: `radial-gradient(circle at center, ${card.glowColor} 0%, transparent 70%)`,
                  transform: 'scale(1.1)',
                }}
              />

              {/* Card Content with mobile optimization */}
              <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
                {/* Icon and Title - Mobile optimized layout */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div
                      className={`icon-wrapper p-2 sm:p-3 rounded-gaming bg-${card.color}/10 border border-${card.color}/20 group-hover:bg-${card.color}/20 group-hover:border-${card.color}/40 transition-all duration-300 flex-shrink-0`}
                    >
                      <IconComponent
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-${card.color} group-hover:scale-110 transition-transform duration-300`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`card-title text-base sm:text-lg font-bold text-white group-hover:text-${card.color} transition-colors duration-300 truncate`}
                      >
                        {t(card.titleKey)}
                      </h3>
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-stakeados-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-2" />
                </div>

                {/* Description with mobile optimization */}
                <p className="card-description text-stakeados-gray-300 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-grow line-clamp-2 sm:line-clamp-3">
                  {t(card.descriptionKey)}
                </p>

                {/* Statistics with mobile layout */}
                <div className="card-stats">
                  <div className="stat-display">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-stakeados-gray-400 flex-shrink-0" />
                        <span className="text-stakeados-gray-400 text-xs sm:text-sm truncate">
                          {t('homepage.errors.loading')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span
                          className={`stat-number text-lg sm:text-xl font-bold text-${card.color} group-hover:text-glow transition-all duration-300`}
                        >
                          {statValue}
                        </span>
                        <span className="stat-label text-stakeados-gray-400 text-xs sm:text-sm truncate">
                          {t(card.statsLabelKey)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gaming-themed decorative elements */}
              <div className="absolute top-2 right-2 w-1 h-1 bg-stakeados-primary/40 rounded-full animate-pulse" />
              <div
                className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-stakeados-blue/30 rounded-full animate-pulse"
                style={{ animationDelay: '1s' }}
              />

              {/* Corner accents */}
              <div
                className={`absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-${card.color}/20 rounded-tl-gaming opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div
                className={`absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-${card.color}/20 rounded-br-gaming opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
            </Link>
          );
        })}
      </div>

      {/* Gaming-themed decorative elements */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-stakeados-primary/30 rounded-full animate-pulse" />
      <div
        className="absolute top-12 right-12 w-1 h-1 bg-stakeados-blue/40 rounded-full animate-pulse"
        style={{ animationDelay: '0.5s' }}
      />
      <div
        className="absolute bottom-8 left-16 w-1.5 h-1.5 bg-stakeados-purple/20 rounded-full animate-pulse"
        style={{ animationDelay: '1.5s' }}
      />
    </section>
  );
}
