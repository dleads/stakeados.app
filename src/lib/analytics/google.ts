// Google Analytics 4 configuration
export const GA_CONFIG = {
  measurementId: '',
  enabled: false,
} as const;

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export function initializeGA(): void {
  if (!GA_CONFIG.enabled || typeof window === 'undefined') {
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_CONFIG.measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }

  gtag('js', new Date());
  gtag('config', GA_CONFIG.measurementId, {
    page_title: document.title,
    page_location: window.location.href,
  });

  // Make gtag globally available
  (window as any).gtag = gtag;
}

// Track page views
export function trackPageView(url: string, title?: string): void {
  if (!GA_CONFIG.enabled || typeof window === 'undefined') {
    return;
  }

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', GA_CONFIG.measurementId, {
      page_title: title || document.title,
      page_location: url,
    });
  }
}

// Track custom events
export function trackEvent(
  eventName: string,
  parameters?: {
    category?: string;
    label?: string;
    value?: number;
    custom_parameters?: Record<string, any>;
  }
): void {
  if (!GA_CONFIG.enabled || typeof window === 'undefined') {
    return;
  }

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', eventName, {
      event_category: parameters?.category,
      event_label: parameters?.label,
      value: parameters?.value,
      ...parameters?.custom_parameters,
    });
  }
}

// Stakeados-specific event tracking
export const StakeadosAnalytics = {
  // User events
  userSignUp: (method: 'email' | 'wallet') => {
    trackEvent('sign_up', {
      category: 'User',
      label: method,
      custom_parameters: { method },
    });
  },

  userSignIn: (method: 'email' | 'wallet') => {
    trackEvent('login', {
      category: 'User',
      label: method,
      custom_parameters: { method },
    });
  },

  // Course events
  courseStart: (courseId: string, courseName: string, difficulty: string) => {
    trackEvent('course_start', {
      category: 'Education',
      label: courseName,
      custom_parameters: {
        course_id: courseId,
        course_name: courseName,
        difficulty,
      },
    });
  },

  courseComplete: (
    courseId: string,
    courseName: string,
    score: number,
    difficulty: string
  ) => {
    trackEvent('course_complete', {
      category: 'Education',
      label: courseName,
      value: score,
      custom_parameters: {
        course_id: courseId,
        course_name: courseName,
        score,
        difficulty,
      },
    });
  },

  // Web3 events
  walletConnect: (walletType: string, chainId: number) => {
    trackEvent('wallet_connect', {
      category: 'Web3',
      label: walletType,
      custom_parameters: {
        wallet_type: walletType,
        chain_id: chainId,
      },
    });
  },

  nftMint: (
    type: 'certificate' | 'citizenship',
    contractAddress: string,
    gasless: boolean
  ) => {
    trackEvent('nft_mint', {
      category: 'Web3',
      label: type,
      custom_parameters: {
        nft_type: type,
        contract_address: contractAddress,
        gasless,
      },
    });
  },

  // Community events
  articlePublish: (articleId: string, category: string) => {
    trackEvent('article_publish', {
      category: 'Community',
      label: category,
      custom_parameters: {
        article_id: articleId,
        category,
      },
    });
  },

  achievementUnlock: (
    achievementId: string,
    achievementName: string,
    rarity: string
  ) => {
    trackEvent('achievement_unlock', {
      category: 'Gamification',
      label: achievementName,
      custom_parameters: {
        achievement_id: achievementId,
        achievement_name: achievementName,
        rarity,
      },
    });
  },

  // Genesis events
  genesisClaimStart: () => {
    trackEvent('genesis_claim_start', {
      category: 'Genesis',
      label: 'claim_initiated',
    });
  },

  genesisClaimComplete: (walletAddress: string) => {
    trackEvent('genesis_claim_complete', {
      category: 'Genesis',
      label: 'claim_successful',
      custom_parameters: {
        wallet_address: walletAddress,
      },
    });
  },

  // Search events
  search: (query: string, resultsCount: number) => {
    trackEvent('search', {
      category: 'Navigation',
      label: query,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        results_count: resultsCount,
      },
    });
  },

  // Error events
  error: (errorType: string, errorMessage: string, page: string) => {
    trackEvent('exception', {
      category: 'Error',
      label: errorType,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage,
        page,
        fatal: false,
      },
    });
  },
};

// Enhanced ecommerce tracking for future monetization
export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string,
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>
): void {
  if (!GA_CONFIG.enabled) return;

  trackEvent('purchase', {
    custom_parameters: {
      transaction_id: transactionId,
      value,
      currency,
      items,
    },
  });
}

// User engagement tracking
export function trackEngagement(
  engagementType: 'scroll' | 'click' | 'video_play' | 'file_download',
  details?: Record<string, any>
): void {
  trackEvent('engagement', {
    category: 'Engagement',
    label: engagementType,
    custom_parameters: {
      engagement_type: engagementType,
      ...details,
    },
  });
}

// Performance tracking
export function trackPerformance(
  metricName: string,
  value: number,
  unit: string = 'ms'
): void {
  trackEvent('performance', {
    category: 'Performance',
    label: metricName,
    value,
    custom_parameters: {
      metric_name: metricName,
      metric_value: value,
      unit,
    },
  });
}
