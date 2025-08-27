// Rate limiting implementation for API routes

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class MemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  increment(
    key: string,
    windowMs: number
  ): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = { count: 1, resetTime };
    } else {
      this.store[key].count++;
    }

    return this.store[key];
  }

  get(key: string): { count: number; resetTime: number } | null {
    const entry = this.store[key];
    if (!entry || entry.resetTime < Date.now()) {
      return null;
    }
    return entry;
  }

  reset(key: string): void {
    delete this.store[key];
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

// Global rate limit store
const rateLimitStore = new MemoryRateLimitStore();

// Rate limit middleware for API routes
export function createRateLimit(config: RateLimitConfig) {
  return (
    identifier: string
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    error?: string;
  } => {
    const result = rateLimitStore.increment(identifier, config.windowMs);

    const allowed = result.count <= config.max;
    const remaining = Math.max(0, config.max - result.count);

    return {
      allowed,
      remaining,
      resetTime: result.resetTime,
      error: allowed ? undefined : config.message,
    };
  };
}

// Predefined rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later',
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Upload limit exceeded, please try again later',
});

export const web3RateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: 'Too many Web3 operations, please try again later',
});

// Get client identifier (IP + User Agent hash)
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0]
    : request.headers.get('x-real-ip') || 'unknown';

  const userAgent = request.headers.get('user-agent') || '';
  const userAgentHash = btoa(userAgent).substring(0, 10);

  return `${ip}:${userAgentHash}`;
}

// Rate limit headers
export function getRateLimitHeaders(
  result: ReturnType<ReturnType<typeof createRateLimit>>
) {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

// Cleanup function
export function cleanupRateLimit(): void {
  rateLimitStore.destroy();
}
