// API-specific error handling with retry logic

import { StakeadosError, ERROR_CODES, withRetry } from './errorHandler';

export interface ApiErrorContext {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode?: number;
  requestId?: string;
  userId?: string;
}

export class ApiErrorHandler {
  static handleApiError(
    error: Error,
    context: ApiErrorContext
  ): StakeadosError {
    const { statusCode } = context;

    // Handle specific HTTP status codes
    switch (statusCode) {
      case 400:
        return new StakeadosError(
          'Invalid request. Please check your input and try again.',
          ERROR_CODES.VALIDATION_ERROR,
          context,
          true
        );

      case 401:
        return new StakeadosError(
          'Authentication required. Please sign in and try again.',
          ERROR_CODES.UNAUTHORIZED,
          context,
          true
        );

      case 403:
        return new StakeadosError(
          'You do not have permission to perform this action.',
          ERROR_CODES.UNAUTHORIZED,
          context,
          false
        );

      case 404:
        return new StakeadosError(
          'The requested resource was not found.',
          ERROR_CODES.NOT_FOUND,
          context,
          false
        );

      case 409:
        return new StakeadosError(
          'This resource already exists or conflicts with existing data.',
          ERROR_CODES.DUPLICATE_ERROR,
          context,
          true
        );

      case 429:
        return new StakeadosError(
          'Too many requests. Please wait a moment and try again.',
          ERROR_CODES.RATE_LIMITED,
          context,
          true
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new StakeadosError(
          'Server error. Please try again in a few moments.',
          ERROR_CODES.SERVICE_UNAVAILABLE,
          context,
          true
        );

      default:
        // Handle network errors
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return new StakeadosError(
            'Network error. Please check your connection and try again.',
            ERROR_CODES.NETWORK_ERROR,
            context,
            true
          );
        }

        return new StakeadosError(
          'An unexpected error occurred. Please try again.',
          ERROR_CODES.API_ERROR,
          context,
          true
        );
    }
  }

  // Determine if request should be retried
  static shouldRetry(
    error: StakeadosError,
    attempt: number,
    maxRetries: number
  ): boolean {
    if (attempt >= maxRetries) return false;
    if (!error.recoverable) return false;

    // Retry on specific error codes
    const retryableCodes = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      ERROR_CODES.TIMEOUT_ERROR,
    ];

    return retryableCodes.includes(error.code as any);
  }

  // Get retry delay based on attempt
  static getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter

    return Math.min(exponentialDelay + jitter, maxDelay);
  }
}

// Enhanced fetch wrapper with error handling and retries
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  context?: Partial<ApiErrorContext>
): Promise<T> {
  const fullContext: ApiErrorContext = {
    endpoint: url,
    method: (options.method as any) || 'GET',
    ...context,
  };

  return withRetry(
    async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        const contextWithStatus = {
          ...fullContext,
          statusCode: response.status,
        };

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Use status text if JSON parsing fails
            errorMessage = response.statusText || errorMessage;
          }

          const error = new Error(errorMessage);
          throw ApiErrorHandler.handleApiError(error, contextWithStatus);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return (await response.text()) as T;
        }
      } catch (error) {
        if (error instanceof StakeadosError) {
          throw error;
        }

        throw ApiErrorHandler.handleApiError(error as Error, fullContext);
      }
    },
    3, // maxRetries
    1000, // baseDelay
    fullContext
  );
}

// Supabase error handler
export function handleSupabaseError(
  error: any,
  context?: Partial<ApiErrorContext>
): StakeadosError {
  const supabaseContext: ApiErrorContext = {
    endpoint: 'supabase',
    method: 'POST',
    ...context,
  };

  // Handle Supabase-specific errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return new StakeadosError(
          'No data found for this request.',
          ERROR_CODES.NOT_FOUND,
          supabaseContext,
          false
        );

      case '23505':
        return new StakeadosError(
          'This data already exists.',
          ERROR_CODES.DUPLICATE_ERROR,
          supabaseContext,
          true
        );

      case '42501':
        return new StakeadosError(
          'You do not have permission to perform this action.',
          ERROR_CODES.UNAUTHORIZED,
          supabaseContext,
          false
        );

      default:
        return new StakeadosError(
          error.message || 'Database operation failed.',
          ERROR_CODES.API_ERROR,
          supabaseContext,
          true
        );
    }
  }

  return ApiErrorHandler.handleApiError(error, supabaseContext);
}
