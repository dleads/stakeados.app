'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Link } from '@/lib/utils/navigation';
import type { ErrorBoundaryFallbackProps } from './EnhancedErrorBoundary';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
}

export default function EnhancedSectionErrorFallback({
  error,
  resetErrorBoundary,
  sectionName,
  locale,
  retryCount,
  maxRetries,
}: ErrorBoundaryFallbackProps) {
  const t = useTranslations('homepage.errors');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType,
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener(
        'change',
        updateNetworkStatus
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener(
          'change',
          updateNetworkStatus
        );
      }
    };
  }, []);

  // Determine error type and appropriate message
  const getErrorType = () => {
    const errorMessage = error.message.toLowerCase();

    if (!networkStatus.isOnline) {
      return 'offline';
    } else if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('network')
    ) {
      return 'network';
    } else if (errorMessage.includes('timeout')) {
      return 'timeout';
    } else if (
      errorMessage.includes('404') ||
      errorMessage.includes('not found')
    ) {
      return 'notFound';
    } else if (
      errorMessage.includes('500') ||
      errorMessage.includes('server')
    ) {
      return 'server';
    } else {
      return 'generic';
    }
  };

  const errorType = getErrorType();

  // Handle retry with loading state
  const handleRetry = async () => {
    setIsRetrying(true);

    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    resetErrorBoundary();
    setIsRetrying(false);
  };

  // Get fallback content based on section
  const getFallbackContent = () => {
    const sectionKey = sectionName.toLowerCase().replace(/\s+/g, '');

    switch (sectionKey) {
      case 'featurednews':
        return {
          title: t('fallback.news.title'),
          description: t('fallback.news.description'),
          actionText: t('fallback.news.action'),
          actionHref: locale === 'es' ? '/noticias' : '/news',
        };
      case 'featuredarticles':
        return {
          title: t('fallback.articles.title'),
          description: t('fallback.articles.description'),
          actionText: t('fallback.articles.action'),
          actionHref: locale === 'es' ? '/articulos' : '/articles',
        };
      case 'featuredcourses':
        return {
          title: t('fallback.courses.title'),
          description: t('fallback.courses.description'),
          actionText: t('fallback.courses.action'),
          actionHref: '/courses',
        };
      case 'quicknavigation':
        return {
          title: t('fallback.navigation.title'),
          description: t('fallback.navigation.description'),
          actionText: t('fallback.navigation.action'),
          actionHref: '/',
        };
      default:
        return {
          title: t('fallback.generic.title'),
          description: t('fallback.generic.description'),
          actionText: t('fallback.generic.action'),
          actionHref: '/',
        };
    }
  };

  const fallbackContent = getFallbackContent();
  const canRetry = retryCount < maxRetries;

  return (
    <div className="enhanced-section-error-fallback bg-stakeados-gray-800/90 border border-stakeados-orange/30 rounded-gaming-lg p-4 sm:p-6 text-center">
      <div className="error-content max-w-lg mx-auto">
        {/* Error Icon and Status */}
        <div className="error-icon mb-4">
          {!networkStatus.isOnline ? (
            <WifiOff className="w-10 h-10 sm:w-12 sm:h-12 text-stakeados-orange mx-auto" />
          ) : errorType === 'timeout' ? (
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-stakeados-orange mx-auto" />
          ) : (
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-stakeados-orange mx-auto" />
          )}
        </div>

        {/* Error Title and Description */}
        <div className="error-text mb-6">
          <h3 className="error-title text-lg sm:text-xl font-bold text-stakeados-orange mb-2">
            {t(`errorTypes.${errorType}.title`)}
          </h3>
          <p className="error-description text-sm sm:text-base text-stakeados-gray-300 mb-2 leading-relaxed">
            {t(`errorTypes.${errorType}.description`)}
          </p>
          <p className="error-section text-xs sm:text-sm text-stakeados-gray-400">
            {t('section')}: {sectionName}
          </p>
        </div>

        {/* Network Status Indicator */}
        {!networkStatus.isOnline && (
          <div className="network-status mb-4 p-3 bg-stakeados-gray-900/50 rounded-gaming border border-stakeados-orange/20">
            <div className="flex items-center justify-center gap-2 text-stakeados-orange">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('networkStatus.offline')}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="error-actions flex flex-col sm:flex-row gap-3 mb-4">
          {/* Retry Button */}
          {canRetry && networkStatus.isOnline && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="retry-button flex items-center justify-center gap-2 px-4 py-2 bg-stakeados-orange hover:bg-stakeados-orange/90 disabled:bg-stakeados-orange/50 text-stakeados-dark font-semibold rounded-gaming transition-all duration-300 hover:-translate-y-1 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-orange focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark flex-1 sm:flex-none"
            >
              <RefreshCw
                className={`w-4 h-4 flex-shrink-0 ${isRetrying ? 'animate-spin' : ''}`}
              />
              <span className="text-sm sm:text-base">
                {isRetrying ? t('retrying') : t('retry')}
                {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
              </span>
            </button>
          )}

          {/* Fallback Action Button */}
          <Link
            href={fallbackContent.actionHref}
            className="fallback-action flex items-center justify-center gap-2 px-4 py-2 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-stakeados-gray-300 hover:text-white font-semibold rounded-gaming transition-all duration-300 hover:-translate-y-1 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-primary focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark flex-1 sm:flex-none"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {fallbackContent.actionText}
            </span>
          </Link>
        </div>

        {/* Retry Information */}
        {!canRetry && (
          <div className="retry-info mb-4 p-3 bg-stakeados-gray-900/50 rounded-gaming border border-stakeados-gray-700">
            <p className="text-xs sm:text-sm text-stakeados-gray-400">
              {t('maxRetriesReached')}
            </p>
          </div>
        )}

        {/* Fallback Content */}
        <div className="fallback-content border-t border-stakeados-gray-700 pt-4 mb-4">
          <h4 className="text-sm font-semibold text-stakeados-gray-300 mb-2">
            {fallbackContent.title}
          </h4>
          <p className="text-xs sm:text-sm text-stakeados-gray-400 leading-relaxed">
            {fallbackContent.description}
          </p>
        </div>

        {/* Error Details Toggle */}
        <div className="error-details">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="details-toggle flex items-center justify-center gap-2 mx-auto text-xs text-stakeados-gray-500 hover:text-stakeados-gray-400 transition-colors"
          >
            <span>{t('technicalDetails')}</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showDetails && (
            <div className="details-content mt-3 p-3 bg-stakeados-gray-900/50 rounded-gaming border border-stakeados-gray-700 text-left">
              <div className="text-xs text-stakeados-gray-400 space-y-2">
                <div>
                  <strong className="text-stakeados-gray-300">
                    {t('errorMessage')}:
                  </strong>
                  <br />
                  <code className="text-stakeados-orange break-all">
                    {error.message}
                  </code>
                </div>
                {networkStatus.effectiveType && (
                  <div>
                    <strong className="text-stakeados-gray-300">
                      {t('connectionType')}:
                    </strong>
                    <br />
                    <span>{networkStatus.effectiveType}</span>
                  </div>
                )}
                <div>
                  <strong className="text-stakeados-gray-300">
                    {t('timestamp')}:
                  </strong>
                  <br />
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
