import { AdminErrorCodes, AdminError } from '@/lib/errors/AdminErrorCodes';
import { errorHandler } from '@/lib/errors/ErrorHandler';
import { toast } from 'sonner';

/**
 * Enhanced API error handling utilities
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiCallOptions {
  operation?: string;
  showToast?: boolean;
  retryCount?: number;
  timeout?: number;
  metadata?: Record<string, any>;
}

/**
 * Enhanced fetch wrapper with comprehensive error handling
 */
export async function apiCall<T = any>(
  url: string,
  options: RequestInit & ApiCallOptions = {}
): Promise<T> {
  const {
    operation = 'api_call',
    showToast = true,
    retryCount = 0,
    timeout = 30000,
    metadata = {},
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await handleApiError(response, operation, showToast);
    }

    const data = await response.json();

    // Check for application-level errors
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        errorHandler.handleError(timeoutError, {
          operation,
          url,
          timeout,
          ...metadata,
        });

        if (showToast) {
          toast.error('Request timed out. Please try again.');
        }

        throw timeoutError;
      }

      // Handle network errors
      if (!navigator.onLine) {
        const networkError = new Error('No internet connection');
        errorHandler.handleError(networkError, {
          operation,
          url,
          offline: true,
          ...metadata,
        });

        if (showToast) {
          toast.error('No internet connection. Please check your network.');
        }

        throw networkError;
      }

      // Retry logic for certain errors
      if (retryCount > 0 && shouldRetry(error)) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * (4 - retryCount))
        ); // Exponential backoff
        return apiCall(url, { ...options, retryCount: retryCount - 1 });
      }

      errorHandler.handleError(error, {
        operation,
        url,
        retryCount,
        ...metadata,
      });

      if (showToast) {
        toast.error(error.message || 'An unexpected error occurred');
      }
    }

    throw error;
  }
}

/**
 * Handle API response errors
 */
async function handleApiError(
  response: Response,
  operation: string,
  showToast: boolean
): Promise<void> {
  let errorData: any = {};

  try {
    errorData = await response.json();
  } catch {
    // Response is not JSON
  }

  const adminError: AdminError = {
    code: getErrorCodeFromStatus(response.status),
    message:
      errorData.error ||
      errorData.message ||
      `HTTP ${response.status}: ${response.statusText}`,
    timestamp: new Date(),
    operation,
    details: {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ...errorData,
    },
  };

  const enhancedError = errorHandler.handleError(adminError);

  if (showToast) {
    const message = enhancedError.userFriendlyMessage || enhancedError.message;

    switch (enhancedError.severity) {
      case 'critical':
        toast.error(message, {
          duration: 10000,
          action: enhancedError.recoveryActions?.[0]
            ? {
                label: enhancedError.recoveryActions[0].label,
                onClick: enhancedError.recoveryActions[0].action,
              }
            : undefined,
        });
        break;
      case 'high':
        toast.error(message, { duration: 8000 });
        break;
      case 'medium':
        toast.warning(message, { duration: 5000 });
        break;
      default:
        toast.error(message);
    }
  }

  throw new Error(adminError.message);
}

/**
 * Get appropriate error code from HTTP status
 */
function getErrorCodeFromStatus(status: number): AdminErrorCodes {
  switch (status) {
    case 400:
      return AdminErrorCodes.VALIDATION_ERROR;
    case 401:
      return AdminErrorCodes.AUTHENTICATION_FAILED;
    case 403:
      return AdminErrorCodes.INSUFFICIENT_PERMISSIONS;
    case 404:
      return AdminErrorCodes.ARTICLE_NOT_FOUND;
    case 409:
      return AdminErrorCodes.ARTICLE_SCHEDULE_CONFLICT;
    case 413:
      return AdminErrorCodes.FILE_SIZE_EXCEEDED;
    case 415:
      return AdminErrorCodes.INVALID_FILE_TYPE;
    case 422:
      return AdminErrorCodes.VALIDATION_ERROR;
    case 429:
      return AdminErrorCodes.TIMEOUT_ERROR;
    case 500:
      return AdminErrorCodes.DATABASE_CONNECTION_ERROR;
    case 502:
    case 503:
    case 504:
      return AdminErrorCodes.EXTERNAL_SERVICE_ERROR;
    default:
      return AdminErrorCodes.UNKNOWN_ERROR;
  }
}

/**
 * Determine if an error should trigger a retry
 */
function shouldRetry(error: Error): boolean {
  const retryableErrors = [
    'NetworkError',
    'TimeoutError',
    'fetch failed',
    'Failed to fetch',
  ];

  return retryableErrors.some(
    retryableError =>
      error.message.includes(retryableError) ||
      error.name.includes(retryableError)
  );
}

/**
 * Specialized API call functions for common operations
 */

export async function apiGet<T = any>(
  url: string,
  options: Omit<ApiCallOptions, 'method'> = {}
): Promise<T> {
  return apiCall<T>(url, { ...options, method: 'GET' });
}

export async function apiPost<T = any>(
  url: string,
  data?: any,
  options: Omit<ApiCallOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiCall<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut<T = any>(
  url: string,
  data?: any,
  options: Omit<ApiCallOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiCall<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T = any>(
  url: string,
  options: Omit<ApiCallOptions, 'method'> = {}
): Promise<T> {
  return apiCall<T>(url, { ...options, method: 'DELETE' });
}

export async function apiPatch<T = any>(
  url: string,
  data?: any,
  options: Omit<ApiCallOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiCall<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * File upload with progress and error handling
 */
export async function apiUpload<T = any>(
  url: string,
  file: File,
  options: ApiCallOptions & {
    onProgress?: (progress: number) => void;
    fieldName?: string;
  } = {}
): Promise<T> {
  const {
    operation = 'file_upload',
    onProgress,
    fieldName = 'file',
    ...apiOptions
  } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append(fieldName, file);

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          const error = new Error(
            `Upload failed: ${xhr.status} ${xhr.statusText}`
          );
          errorHandler.handleError(error, {
            operation,
            url,
            status: xhr.status,
            statusText: xhr.statusText,
            fileName: file.name,
            fileSize: file.size,
          });
          reject(error);
        }
      } catch (error) {
        errorHandler.handleError(error as Error, {
          operation,
          url,
          fileName: file.name,
          fileSize: file.size,
        });
        reject(error);
      }
    });

    xhr.addEventListener('error', () => {
      const error = new Error('Upload failed due to network error');
      errorHandler.handleError(error, {
        operation,
        url,
        fileName: file.name,
        fileSize: file.size,
        networkError: true,
      });
      reject(error);
    });

    xhr.addEventListener('timeout', () => {
      const error = new Error('Upload timed out');
      errorHandler.handleError(error, {
        operation,
        url,
        fileName: file.name,
        fileSize: file.size,
        timeout: true,
      });
      reject(error);
    });

    xhr.open('POST', url);
    xhr.timeout = apiOptions.timeout || 60000; // 60 second timeout for uploads
    xhr.send(formData);
  });
}

/**
 * Batch API calls with error handling
 */
export async function apiBatch<T = any>(
  calls: Array<() => Promise<T>>,
  options: {
    concurrency?: number;
    failFast?: boolean;
    operation?: string;
  } = {}
): Promise<Array<T | Error>> {
  const {
    concurrency = 5,
    failFast = false,
    operation = 'batch_operation',
  } = options;

  const results: Array<T | Error> = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];

    const promise = (async () => {
      try {
        const result = await call();
        results[i] = result;
      } catch (error) {
        const enhancedError = errorHandler.handleError(error as Error, {
          operation,
          batchIndex: i,
          totalBatch: calls.length,
        });

        results[i] = enhancedError as Error;

        if (failFast) {
          throw error;
        }
      }
    })();

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
