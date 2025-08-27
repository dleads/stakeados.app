import { H } from '@highlight-run/next/client';

// Highlight configuration
export const HIGHLIGHT_CONFIG = {
  projectId: '',
  enabled: false,
  environment: 'development',
} as const;

// Initialize Highlight
export function initializeHighlight(): void {
  if (!HIGHLIGHT_CONFIG.enabled || typeof window === 'undefined') {
    return;
  }

  H.init(HIGHLIGHT_CONFIG.projectId, {
    environment: HIGHLIGHT_CONFIG.environment,
    // Mantener opciones compatibles únicamente
  });
}

// Identify user for session tracking
export function identifyUser(
  userId: string,
  userEmail: string,
  metadata?: Record<string, any>
): void {
  if (!HIGHLIGHT_CONFIG.enabled) return;

  H.identify(userId, {
    email: userEmail,
    environment: HIGHLIGHT_CONFIG.environment,
    ...metadata,
  });
}

// Track custom events
export function trackHighlightEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  if (!HIGHLIGHT_CONFIG.enabled) return;

  H.track(eventName, properties);
}

// Track errors
export function trackError(error: Error, context?: Record<string, any>): void {
  if (!HIGHLIGHT_CONFIG.enabled) return;

  H.consumeError(error, context ? JSON.stringify(context) : undefined);
}

// Track user feedback
export function trackFeedback(
  feedback: string,
  rating?: number,
  metadata?: Record<string, any>
): void {
  if (!HIGHLIGHT_CONFIG.enabled) return;

  H.track('user_feedback', {
    feedback,
    rating,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// Stakeados-specific Highlight tracking
export const StakeadosHighlight = {
  // User journey tracking
  userJourney: {
    signUp: (method: string) => {
      trackHighlightEvent('user_signup', { method });
    },

    firstCourse: (courseId: string) => {
      trackHighlightEvent('first_course_start', { course_id: courseId });
    },

    firstCompletion: (courseId: string, score: number) => {
      trackHighlightEvent('first_course_complete', {
        course_id: courseId,
        score,
      });
    },

    walletConnect: (walletType: string) => {
      trackHighlightEvent('wallet_connected', { wallet_type: walletType });
    },

    genesisJoin: () => {
      trackHighlightEvent('genesis_joined');
    },
  },

  // Feature usage tracking
  featureUsage: {
    searchUsed: (query: string, resultsCount: number) => {
      trackHighlightEvent('search_used', {
        query: query.length > 0 ? 'has_query' : 'empty_query',
        results_count: resultsCount,
      });
    },

    filterApplied: (filterType: string, filterValue: string) => {
      trackHighlightEvent('filter_applied', {
        filter_type: filterType,
        filter_value: filterValue,
      });
    },

    articleRead: (articleId: string, readTime: number) => {
      trackHighlightEvent('article_read', {
        article_id: articleId,
        read_time_seconds: readTime,
      });
    },
  },

  // Error tracking
  errors: {
    web3Error: (error: Error, action: string) => {
      trackError(error, {
        error_type: 'web3_error',
        action,
        timestamp: new Date().toISOString(),
      });
    },

    apiError: (error: Error, endpoint: string) => {
      trackError(error, {
        error_type: 'api_error',
        endpoint,
        timestamp: new Date().toISOString(),
      });
    },

    uiError: (error: Error, component: string) => {
      trackError(error, {
        error_type: 'ui_error',
        component,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Performance tracking
  performance: {
    pageLoad: (page: string, loadTime: number) => {
      trackHighlightEvent('page_load_performance', {
        page,
        load_time_ms: loadTime,
      });
    },

    apiResponse: (endpoint: string, responseTime: number, success: boolean) => {
      trackHighlightEvent('api_performance', {
        endpoint,
        response_time_ms: responseTime,
        success,
      });
    },

    web3Transaction: (type: string, duration: number, gasless: boolean) => {
      trackHighlightEvent('web3_transaction_performance', {
        transaction_type: type,
        duration_ms: duration,
        gasless,
      });
    },
  },
};

// Session recording controls
export function startRecording(): void {
  if (!HIGHLIGHT_CONFIG.enabled) return;
  H.start();
}

export function stopRecording(): void {
  if (!HIGHLIGHT_CONFIG.enabled) return;
  H.stop();
}

// Privacy controls
export function enableStrictPrivacy(): void {
  // No-op: esta versión del SDK no expone un método público para privacidad estricta
}

export function disableStrictPrivacy(): void {
  // No-op: esta versión del SDK no expone un método público para revertir privacidad estricta
}
