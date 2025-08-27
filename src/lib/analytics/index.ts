// Main analytics exports and initialization

import {
  GA_CONFIG,
  initializeGA,
  trackPageView as gaTrackPageView,
  trackEvent as gaTrackEvent,
  StakeadosAnalytics,
} from './google';

import {
  HIGHLIGHT_CONFIG,
  initializeHighlight,
  identifyUser as hlIdentifyUser,
  trackHighlightEvent as hlTrackHighlightEvent,
  trackError as hlTrackError,
} from './highlight';

import { COINBASE_CONFIG } from './coinbase';

export {
  initializeGA,
  trackPageView,
  trackEvent,
  StakeadosAnalytics,
  trackPurchase,
  trackEngagement,
  trackPerformance,
  GA_CONFIG,
} from './google';

export {
  initializeHighlight,
  identifyUser,
  trackHighlightEvent,
  trackError,
  trackFeedback,
  StakeadosHighlight,
  startRecording,
  stopRecording,
  enableStrictPrivacy,
  disableStrictPrivacy,
  HIGHLIGHT_CONFIG,
} from './highlight';

export {
  trackWeb3Transaction,
  trackWalletConnection,
  trackNFTMint,
  getWeb3Analytics,
  trackBaseNetworkUsage,
  StakeadosWeb3Analytics,
  COINBASE_CONFIG,
} from './coinbase';

export type { Web3Transaction, Web3Analytics } from './coinbase';

// Combined analytics service
export class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized = false;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Initialize all analytics services
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Initialize Google Analytics
      if (GA_CONFIG.enabled) {
        initializeGA();
        console.log('✅ Google Analytics initialized');
      }

      // Initialize Highlight
      if (HIGHLIGHT_CONFIG.enabled) {
        initializeHighlight();
        console.log('✅ Highlight initialized');
      }

      this.initialized = true;
      console.log('🚀 Analytics services initialized');
    } catch (error) {
      console.error('❌ Error initializing analytics:', error);
    }
  }

  // Track user identification across all services
  identifyUser(
    userId: string,
    userEmail: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.initialized) return;

    try {
      // Highlight user identification
      if (HIGHLIGHT_CONFIG.enabled) {
        hlIdentifyUser(userId, userEmail, metadata);
      }

      // Google Analytics user properties
      if (GA_CONFIG.enabled && (window as any).gtag) {
        (window as any).gtag('config', GA_CONFIG.measurementId, {
          user_id: userId,
          custom_map: metadata,
        });
      }
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  }

  // Track events across all services
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      // Google Analytics
      if (GA_CONFIG.enabled) {
        gaTrackEvent(eventName, {
          category: properties?.category,
          label: properties?.label,
          value: properties?.value,
          custom_parameters: properties,
        });
      }

      // Highlight
      if (HIGHLIGHT_CONFIG.enabled) {
        hlTrackHighlightEvent(eventName, properties);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Track errors across all services
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      // Google Analytics exception tracking
      if (GA_CONFIG.enabled) {
        StakeadosAnalytics.error(
          context?.errorType || 'unknown',
          error.message,
          context?.page || window.location.pathname
        );
      }

      // Highlight error tracking
      if (HIGHLIGHT_CONFIG.enabled) {
        hlTrackError(error, context);
      }
    } catch (trackingError) {
      console.error('Error tracking error:', trackingError);
    }
  }

  // Track page views
  trackPageView(url: string, title?: string): void {
    if (!this.initialized) return;

    try {
      if (GA_CONFIG.enabled) {
        gaTrackPageView(url, title);
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Get analytics status
  getStatus(): {
    initialized: boolean;
    services: {
      googleAnalytics: boolean;
      highlight: boolean;
      coinbase: boolean;
    };
  } {
    return {
      initialized: this.initialized,
      services: {
        googleAnalytics: GA_CONFIG.enabled,
        highlight: HIGHLIGHT_CONFIG.enabled,
        coinbase: COINBASE_CONFIG.enabled,
      },
    };
  }
}

// Global analytics instance
export const analytics = AnalyticsService.getInstance();

// Convenience functions
export function initializeAnalytics(): void {
  analytics.initialize();
}

export function identifyAnalyticsUser(
  userId: string,
  userEmail: string,
  metadata?: Record<string, any>
): void {
  analytics.identifyUser(userId, userEmail, metadata);
}

export function trackAnalyticsEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  analytics.trackEvent(eventName, properties);
}

export function trackAnalyticsError(
  error: Error,
  context?: Record<string, any>
): void {
  analytics.trackError(error, context);
}

export function trackAnalyticsPageView(url: string, title?: string): void {
  analytics.trackPageView(url, title);
}
