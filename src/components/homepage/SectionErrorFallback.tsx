'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SectionErrorFallbackProps {
  resetErrorBoundary: () => void;
  sectionName: string;
}

export default function SectionErrorFallback({
  resetErrorBoundary,
  sectionName,
}: SectionErrorFallbackProps) {
  const t = useTranslations('homepage.errors');

  return (
    <div className="section-error-fallback bg-stakeados-gray-800/90 border border-stakeados-orange/30 rounded-gaming-lg p-4 sm:p-6 text-center">
      <div className="error-content max-w-md mx-auto">
        <div className="error-icon mb-4">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-stakeados-orange mx-auto" />
        </div>

        <div className="error-text mb-6">
          <h3 className="error-title text-lg sm:text-xl font-bold text-stakeados-orange mb-2">
            {t('title')}
          </h3>
          <p className="error-description text-sm sm:text-base text-stakeados-gray-300 mb-2 leading-relaxed">
            {t('description')}
          </p>
          <p className="error-section text-xs sm:text-sm text-stakeados-gray-400">
            Section: {sectionName}
          </p>
        </div>

        <div className="error-actions mb-4">
          <button
            onClick={resetErrorBoundary}
            className="retry-button flex items-center justify-center gap-2 px-4 py-2 bg-stakeados-orange hover:bg-stakeados-orange/90 text-stakeados-dark font-semibold rounded-gaming transition-all duration-300 hover:-translate-y-1 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-orange focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark mx-auto"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">{t('retry')}</span>
          </button>
        </div>

        <div className="error-fallback-message border-t border-stakeados-gray-700 pt-4">
          <p className="text-xs sm:text-sm text-stakeados-gray-400 leading-relaxed">
            {t('fallback')}
          </p>
        </div>
      </div>
    </div>
  );
}
