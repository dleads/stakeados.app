import {
  AdminErrorCodes,
  AdminError,
  AdminErrorWithRecovery,
  ErrorRecoveryAction,
} from './AdminErrorCodes';
import { toast } from 'sonner';

/**
 * Comprehensive error handler for admin operations
 * Provides consistent error handling, logging, and user feedback
 */
export class AdminErrorHandler {
  private static instance: AdminErrorHandler;
  private errorLog: AdminError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): AdminErrorHandler {
    if (!AdminErrorHandler.instance) {
      AdminErrorHandler.instance = new AdminErrorHandler();
    }
    return AdminErrorHandler.instance;
  }

  /**
   * Handle an error with comprehensive logging and user feedback
   */
  handleError(
    error: Error | AdminError,
    context?: Record<string, any>
  ): AdminErrorWithRecovery {
    const adminError = this.normalizeError(error, context);
    const errorWithRecovery = this.enhanceErrorWithRecovery(adminError);

    // Log the error
    this.logError(adminError);

    // Send to monitoring service
    this.sendToMonitoring(adminError);

    // Show user-friendly notification
    this.showUserNotification(errorWithRecovery);

    return errorWithRecovery;
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(
    response: Response,
    operation?: string
  ): AdminErrorWithRecovery {
    const error: AdminError = {
      code: this.getErrorCodeFromStatus(response.status),
      message: `API Error: ${response.status} ${response.statusText}`,
      timestamp: new Date(),
      operation,
      context: {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
      },
    };

    return this.handleError(error);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    validationErrors: Record<string, string[]>,
    operation?: string
  ): AdminErrorWithRecovery {
    const error: AdminError = {
      code: AdminErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      timestamp: new Date(),
      operation,
      details: { validationErrors },
    };

    return this.handleError(error);
  }

  /**
   * Create a retry action for failed operations
   */
  createRetryAction(
    operation: () => Promise<void>,
    label = 'Retry'
  ): ErrorRecoveryAction {
    return {
      label,
      type: 'retry',
      action: async () => {
        try {
          await operation();
          toast.success('Operation completed successfully');
        } catch (error) {
          this.handleError(error as Error);
        }
      },
    };
  }

  /**
   * Get error logs for monitoring dashboard
   */
  getErrorLogs(limit = 100): AdminError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const byCode: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let recent = 0;

    this.errorLog.forEach(error => {
      // Count by code
      byCode[error.code] = (byCode[error.code] || 0) + 1;

      // Count recent errors
      if (error.timestamp > oneHourAgo) {
        recent++;
      }
    });

    return {
      total: this.errorLog.length,
      byCode,
      bySeverity,
      recent,
    };
  }

  private normalizeError(
    error: Error | AdminError,
    context?: Record<string, any>
  ): AdminError {
    if ('code' in error && 'timestamp' in error) {
      return error as AdminError;
    }

    // Convert regular Error to AdminError
    return {
      code: AdminErrorCodes.UNKNOWN_ERROR,
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      context,
    };
  }

  private enhanceErrorWithRecovery(error: AdminError): AdminErrorWithRecovery {
    const enhanced: AdminErrorWithRecovery = {
      ...error,
      severity: this.getSeverity(error.code),
      userFriendlyMessage: this.getUserFriendlyMessage(error.code),
      recoveryActions: this.getRecoveryActions(error.code),
    };

    return enhanced;
  }

  private getSeverity(
    code: AdminErrorCodes
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = [
      AdminErrorCodes.DATABASE_CONNECTION_ERROR,
      AdminErrorCodes.AUTHENTICATION_FAILED,
      AdminErrorCodes.BACKUP_FAILED,
    ];

    const highErrors = [
      AdminErrorCodes.INSUFFICIENT_PERMISSIONS,
      AdminErrorCodes.AI_PROCESSING_FAILED,
      AdminErrorCodes.BULK_OPERATION_FAILED,
    ];

    const mediumErrors = [
      AdminErrorCodes.ARTICLE_NOT_FOUND,
      AdminErrorCodes.RSS_FETCH_FAILED,
      AdminErrorCodes.IMAGE_UPLOAD_FAILED,
    ];

    if (criticalErrors.includes(code)) return 'critical';
    if (highErrors.includes(code)) return 'high';
    if (mediumErrors.includes(code)) return 'medium';
    return 'low';
  }

  private getUserFriendlyMessage(code: AdminErrorCodes): string {
    const messages: Record<AdminErrorCodes, string> = {
      [AdminErrorCodes.ARTICLE_NOT_FOUND]:
        "The article you're looking for could not be found.",
      [AdminErrorCodes.INSUFFICIENT_PERMISSIONS]:
        "You don't have permission to perform this action.",
      [AdminErrorCodes.IMAGE_UPLOAD_FAILED]:
        'Failed to upload image. Please try again.',
      [AdminErrorCodes.RSS_FETCH_FAILED]:
        'Unable to fetch RSS feed. Please check the source URL.',
      [AdminErrorCodes.AI_PROCESSING_FAILED]:
        'AI processing encountered an error. Please try again later.',
      [AdminErrorCodes.VALIDATION_ERROR]:
        'Please check your input and try again.',
      [AdminErrorCodes.NETWORK_ERROR]:
        'Network connection error. Please check your internet connection.',
      [AdminErrorCodes.DATABASE_CONNECTION_ERROR]:
        'Database connection error. Please contact support.',
      [AdminErrorCodes.AUTHENTICATION_FAILED]:
        'Authentication failed. Please log in again.',
      [AdminErrorCodes.FILE_SIZE_EXCEEDED]:
        'File size is too large. Please choose a smaller file.',
      [AdminErrorCodes.BULK_OPERATION_FAILED]:
        'Bulk operation failed. Some items may not have been processed.',
      // Add more user-friendly messages as needed
      [AdminErrorCodes.ARTICLE_VALIDATION_ERROR]:
        'Article validation failed. Please check required fields.',
      [AdminErrorCodes.ARTICLE_PERMISSION_DENIED]:
        "You don't have permission to modify this article.",
      [AdminErrorCodes.ARTICLE_SCHEDULE_CONFLICT]:
        'Scheduling conflict detected. Please choose a different time.',
      [AdminErrorCodes.ARTICLE_REVIEW_ERROR]:
        'Error during article review process.',
      [AdminErrorCodes.NEWS_NOT_FOUND]: 'News item not found.',
      [AdminErrorCodes.DUPLICATE_DETECTION_ERROR]:
        'Error detecting duplicates.',
      [AdminErrorCodes.NEWS_SOURCE_INVALID]:
        'Invalid news source configuration.',
      [AdminErrorCodes.CATEGORY_NOT_FOUND]: 'Category not found.',
      [AdminErrorCodes.CATEGORY_HIERARCHY_ERROR]: 'Category hierarchy error.',
      [AdminErrorCodes.TAG_MERGE_FAILED]: 'Failed to merge tags.',
      [AdminErrorCodes.TAG_VALIDATION_ERROR]: 'Tag validation error.',
      [AdminErrorCodes.USER_NOT_FOUND]: 'User not found.',
      [AdminErrorCodes.ROLE_ASSIGNMENT_FAILED]: 'Failed to assign role.',
      [AdminErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type.',
      [AdminErrorCodes.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded.',
      [AdminErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error.',
      [AdminErrorCodes.CONFIGURATION_ERROR]: 'Configuration error.',
      [AdminErrorCodes.ANALYTICS_DATA_ERROR]: 'Analytics data error.',
      [AdminErrorCodes.REPORT_GENERATION_FAILED]: 'Report generation failed.',
      [AdminErrorCodes.METRICS_COLLECTION_ERROR]: 'Metrics collection error.',
      [AdminErrorCodes.BULK_VALIDATION_ERROR]: 'Bulk validation error.',
      [AdminErrorCodes.BULK_TIMEOUT_ERROR]: 'Bulk operation timed out.',
      [AdminErrorCodes.SEARCH_INDEX_ERROR]: 'Search index error.',
      [AdminErrorCodes.FILTER_VALIDATION_ERROR]: 'Filter validation error.',
      [AdminErrorCodes.REALTIME_CONNECTION_ERROR]:
        'Real-time connection error.',
      [AdminErrorCodes.COLLABORATION_CONFLICT]: 'Collaboration conflict.',
      [AdminErrorCodes.TIMEOUT_ERROR]: 'Operation timed out.',
      [AdminErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred.',
    };

    return messages[code] || 'An error occurred. Please try again.';
  }

  private getRecoveryActions(code: AdminErrorCodes): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    // Common retry action for most errors
    if (
      [
        AdminErrorCodes.NETWORK_ERROR,
        AdminErrorCodes.RSS_FETCH_FAILED,
        AdminErrorCodes.AI_PROCESSING_FAILED,
        AdminErrorCodes.IMAGE_UPLOAD_FAILED,
      ].includes(code)
    ) {
      actions.push({
        label: 'Retry',
        type: 'retry',
        action: () => window.location.reload(),
      });
    }

    // Refresh page for certain errors
    if (
      [
        AdminErrorCodes.AUTHENTICATION_FAILED,
        AdminErrorCodes.DATABASE_CONNECTION_ERROR,
      ].includes(code)
    ) {
      actions.push({
        label: 'Refresh Page',
        type: 'refresh',
        action: () => window.location.reload(),
      });
    }

    // Redirect to login for auth errors
    if (code === AdminErrorCodes.AUTHENTICATION_FAILED) {
      actions.push({
        label: 'Go to Login',
        type: 'redirect',
        action: () => {
          window.location.href = '/auth/login';
        },
      });
    }

    return actions;
  }

  private getErrorCodeFromStatus(status: number): AdminErrorCodes {
    switch (status) {
      case 401:
        return AdminErrorCodes.AUTHENTICATION_FAILED;
      case 403:
        return AdminErrorCodes.INSUFFICIENT_PERMISSIONS;
      case 404:
        return AdminErrorCodes.ARTICLE_NOT_FOUND;
      case 422:
        return AdminErrorCodes.VALIDATION_ERROR;
      case 500:
        return AdminErrorCodes.DATABASE_CONNECTION_ERROR;
      case 503:
        return AdminErrorCodes.EXTERNAL_SERVICE_ERROR;
      default:
        return AdminErrorCodes.UNKNOWN_ERROR;
    }
  }

  private logError(error: AdminError): void {
    // Add to local log
    this.errorLog.push(error);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin Error:', error);
    }
  }

  private async sendToMonitoring(error: AdminError): Promise<void> {
    try {
      // Send to monitoring API
      await fetch('/api/admin/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  private showUserNotification(error: AdminErrorWithRecovery): void {
    const message = error.userFriendlyMessage || error.message;

    switch (error.severity) {
      case 'critical':
        toast.error(message, {
          duration: 10000,
          action: error.recoveryActions?.[0]
            ? {
                label: error.recoveryActions[0].label,
                onClick: error.recoveryActions[0].action,
              }
            : undefined,
        });
        break;
      case 'high':
        toast.error(message, {
          duration: 8000,
          action: error.recoveryActions?.[0]
            ? {
                label: error.recoveryActions[0].label,
                onClick: error.recoveryActions[0].action,
              }
            : undefined,
        });
        break;
      case 'medium':
        toast.warning(message, {
          duration: 5000,
        });
        break;
      case 'low':
        toast.info(message, {
          duration: 3000,
        });
        break;
    }
  }
}

// Export singleton instance
export const errorHandler = AdminErrorHandler.getInstance();
