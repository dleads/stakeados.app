// Centralized error handling system

import { trackAnalyticsError } from '@/lib/analytics';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class StakeadosError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'StakeadosError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;
  }
}

// Error types
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Web3 errors
  WALLET_ERROR: 'WALLET_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

  // Data errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private isProcessing = false;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle error with context
  handleError(error: Error, context: ErrorContext = {}): void {
    // Add to queue for processing
    this.errorQueue.push({ error, context });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', error, context);
    }
  }

  // Process error queue
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const { error, context } = this.errorQueue.shift()!;
        await this.processError(error, context);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual error
  private async processError(
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    try {
      // Send to analytics
      trackAnalyticsError(error, {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      });

      // Send to external error reporting service (Sentry, etc.)
      // await this.sendToErrorReporting(error, context);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Create user-friendly error message
  getUserFriendlyMessage(error: Error): string {
    if (error instanceof StakeadosError) {
      switch (error.code) {
        case ERROR_CODES.NETWORK_ERROR:
          return 'Unable to connect to our servers. Please check your internet connection.';
        case ERROR_CODES.WALLET_ERROR:
          return 'There was an issue with your wallet connection. Please try reconnecting.';
        case ERROR_CODES.TRANSACTION_FAILED:
          return 'The transaction failed. Please try again or check your wallet.';
        case ERROR_CODES.INSUFFICIENT_FUNDS:
          return 'Insufficient funds to complete this transaction.';
        case ERROR_CODES.UNAUTHORIZED:
          return 'You need to sign in to access this feature.';
        case ERROR_CODES.NOT_FOUND:
          return 'The requested content could not be found.';
        case ERROR_CODES.RATE_LIMITED:
          return 'Too many requests. Please wait a moment and try again.';
        default:
          return error.message;
      }
    }

    // Handle common error patterns
    if (error.message.includes('fetch')) {
      return 'Unable to load data. Please check your connection and try again.';
    }

    if (error.message.includes('wallet')) {
      return 'Wallet connection issue. Please check your wallet and try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  // Check if error is recoverable
  isRecoverable(error: Error): boolean {
    if (error instanceof StakeadosError) {
      return error.recoverable;
    }

    // Network errors are usually recoverable
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }

    // Wallet errors are usually recoverable
    if (
      error.message.includes('wallet') ||
      error.message.includes('transaction')
    ) {
      return true;
    }

    return false;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export function handleError(error: Error, context?: ErrorContext): void {
  errorHandler.handleError(error, context);
}

export function createError(
  message: string,
  code: string,
  context?: ErrorContext,
  recoverable?: boolean
): StakeadosError {
  return new StakeadosError(message, code, context, recoverable);
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error as Error, context);
    return null;
  }
}

// Retry wrapper with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context?: ErrorContext
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        handleError(lastError, context);
        throw lastError;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
