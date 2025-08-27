'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  analytics,
  initializeAnalytics,
  identifyAnalyticsUser,
  trackAnalyticsEvent,
  trackAnalyticsError,
  trackAnalyticsPageView,
  StakeadosAnalytics,
  StakeadosHighlight,
  StakeadosWeb3Analytics,
} from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();
  const { user, profile } = useAuthContext();

  // Initialize analytics on mount
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackAnalyticsPageView(window.location.href, document.title);
    }
  }, [pathname]);

  // Identify user when authenticated
  useEffect(() => {
    if (user && profile) {
      identifyAnalyticsUser(user.id, user.email || '', {
        display_name: profile.display_name,
        is_genesis: profile.is_genesis,
        total_points: profile.total_points,
        wallet_address: profile.wallet_address,
      });
    }
  }, [user, profile]);

  // Analytics tracking functions
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      trackAnalyticsEvent(eventName, properties);
    },
    []
  );

  const trackError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      trackAnalyticsError(error, context);
    },
    []
  );

  // Stakeados-specific tracking functions
  const trackUserSignUp = useCallback((method: 'email' | 'wallet') => {
    StakeadosAnalytics.userSignUp(method);
    StakeadosHighlight.userJourney.signUp(method);
  }, []);

  const trackUserSignIn = useCallback((method: 'email' | 'wallet') => {
    StakeadosAnalytics.userSignIn(method);
  }, []);

  const trackCourseStart = useCallback(
    (courseId: string, courseName: string, difficulty: string) => {
      StakeadosAnalytics.courseStart(courseId, courseName, difficulty);

      // Track first course separately
      if (profile?.total_points === 0) {
        StakeadosHighlight.userJourney.firstCourse(courseId);
      }
    },
    [profile?.total_points]
  );

  const trackCourseComplete = useCallback(
    (
      courseId: string,
      courseName: string,
      score: number,
      difficulty: string
    ) => {
      StakeadosAnalytics.courseComplete(
        courseId,
        courseName,
        score,
        difficulty
      );

      // Track first completion separately
      if (profile?.total_points && profile.total_points <= 15) {
        StakeadosHighlight.userJourney.firstCompletion(courseId, score);
      }
    },
    [profile?.total_points]
  );

  const trackWalletConnect = useCallback(
    (walletType: string, chainId: number, userAddress: string) => {
      StakeadosAnalytics.walletConnect(walletType, chainId);
      StakeadosHighlight.userJourney.walletConnect(walletType);
      StakeadosWeb3Analytics.walletConnected(walletType, userAddress, chainId);
    },
    []
  );

  const trackNFTMint = useCallback(
    (
      type: 'certificate' | 'citizenship',
      contractAddress: string,
      tokenId: string,
      gasless: boolean,
      additionalData?: Record<string, any>
    ) => {
      StakeadosAnalytics.nftMint(type, contractAddress, gasless);

      if (type === 'certificate') {
        StakeadosWeb3Analytics.certificateMinted(
          contractAddress,
          tokenId,
          user?.id || '',
          additionalData?.courseId || '',
          gasless
        );
      } else {
        StakeadosWeb3Analytics.citizenshipMinted(
          contractAddress,
          tokenId,
          user?.id || '',
          additionalData?.tier || 'bronze',
          gasless
        );
      }
    },
    [user?.id]
  );

  const trackAchievementUnlock = useCallback(
    (achievementId: string, achievementName: string, rarity: string) => {
      StakeadosAnalytics.achievementUnlock(
        achievementId,
        achievementName,
        rarity
      );
    },
    []
  );

  const trackArticlePublish = useCallback(
    (articleId: string, category: string) => {
      StakeadosAnalytics.articlePublish(articleId, category);
    },
    []
  );

  const trackGenesisClaimStart = useCallback(() => {
    StakeadosAnalytics.genesisClaimStart();
  }, []);

  const trackGenesisClaimComplete = useCallback((walletAddress: string) => {
    StakeadosAnalytics.genesisClaimComplete(walletAddress);
    StakeadosHighlight.userJourney.genesisJoin();
  }, []);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    StakeadosAnalytics.search(query, resultsCount);
    StakeadosHighlight.featureUsage.searchUsed(query, resultsCount);
  }, []);

  const trackFeatureUsage = useCallback(
    (feature: string, details?: Record<string, any>) => {
      trackEvent('feature_usage', {
        category: 'Feature',
        label: feature,
        custom_parameters: details,
      });
    },
    [trackEvent]
  );

  const trackPerformance = useCallback(
    (metricName: string, value: number, unit: string = 'ms') => {
      trackEvent('performance_metric', {
        category: 'Performance',
        label: metricName,
        value,
        custom_parameters: {
          metric_name: metricName,
          metric_value: value,
          unit,
        },
      });
    },
    [trackEvent]
  );

  // Get analytics status
  const getAnalyticsStatus = useCallback(() => {
    return analytics.getStatus();
  }, []);

  return {
    // Core functions
    trackEvent,
    trackError,
    trackPageView: trackAnalyticsPageView,

    // User events
    trackUserSignUp,
    trackUserSignIn,

    // Course events
    trackCourseStart,
    trackCourseComplete,

    // Web3 events
    trackWalletConnect,
    trackNFTMint,

    // Community events
    trackAchievementUnlock,
    trackArticlePublish,

    // Genesis events
    trackGenesisClaimStart,
    trackGenesisClaimComplete,

    // Feature usage
    trackSearch,
    trackFeatureUsage,
    trackPerformance,

    // Utilities
    getAnalyticsStatus,

    // Status
    isInitialized: analytics.getStatus().initialized,
  };
}
