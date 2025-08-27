'use client';

import { useState, useCallback } from 'react';
import { StakeadosError, errorHandler } from '@/lib/error/errorHandler';
import { getWeb3RecoverySuggestions } from '@/lib/error/web3ErrorHandler';

interface ErrorRecoveryState {
  error: StakeadosError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  recoverySuggestions: string[];
  showDetails: boolean;
}

export function useErrorRecovery() {
  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRecovering: false,
    recoveryAttempts: 0,
    recoverySuggestions: [],
    showDetails: false,
  });

  // Handle error with recovery options
  const handleError = useCallback((error: Error, context?: any) => {
    const stakeadosError =
      error instanceof StakeadosError
        ? error
        : new StakeadosError(error.message, 'UNKNOWN_ERROR', context);

    // Get recovery suggestions
    const suggestions = getRecoverySuggestions(stakeadosError);

    setState({
      error: stakeadosError,
      isRecovering: false,
      recoveryAttempts: 0,
      recoverySuggestions: suggestions,
      showDetails: false,
    });

    // Report to error handler
    errorHandler.handleError(stakeadosError, context);
  }, []);

  // Attempt recovery
  const attemptRecovery = useCallback(
    async (recoveryFn?: () => Promise<void> | void) => {
      if (!state.error || !state.error.recoverable) return;

      setState(prev => ({
        ...prev,
        isRecovering: true,
        recoveryAttempts: prev.recoveryAttempts + 1,
      }));

      try {
        if (recoveryFn) {
          await recoveryFn();
        }

        // Clear error on successful recovery
        setState(prev => ({
          ...prev,
          error: null,
          isRecovering: false,
        }));
      } catch (recoveryError) {
        setState(prev => ({
          ...prev,
          isRecovering: false,
        }));

        // Handle recovery failure
        handleError(recoveryError as Error, {
          originalError: state.error?.code,
          recoveryAttempt: state.recoveryAttempts + 1,
        });
      }
    },
    [state.error, state.recoveryAttempts, handleError]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState({
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
      recoverySuggestions: [],
      showDetails: false,
    });
  }, []);

  // Toggle error details
  const toggleDetails = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDetails: !prev.showDetails,
    }));
  }, []);

  // Get user-friendly error message
  const getUserFriendlyMessage = useCallback(() => {
    if (!state.error) return '';
    return errorHandler.getUserFriendlyMessage(state.error);
  }, [state.error]);

  // Check if error is recoverable
  const isRecoverable = useCallback(() => {
    if (!state.error) return false;
    return errorHandler.isRecoverable(state.error);
  }, [state.error]);

  return {
    ...state,
    handleError,
    attemptRecovery,
    clearError,
    toggleDetails,
    getUserFriendlyMessage,
    isRecoverable,
  };
}

// Get recovery suggestions for different error types
function getRecoverySuggestions(error: StakeadosError): string[] {
  // Web3 errors have specific suggestions
  if (error.context.action) {
    return getWeb3RecoverySuggestions(error);
  }

  // Generic suggestions based on error code
  switch (error.code) {
    case 'NETWORK_ERROR':
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
      ];

    case 'UNAUTHORIZED':
      return [
        'Sign in to your account',
        'Check if your session has expired',
        'Contact support if you believe this is an error',
      ];

    case 'NOT_FOUND':
      return [
        'Check the URL for typos',
        'Go back to the previous page',
        "Use the search function to find what you're looking for",
      ];

    case 'RATE_LIMITED':
      return [
        'Wait a few minutes before trying again',
        'Reduce the frequency of your requests',
        'Contact support if you need higher limits',
      ];

    default:
      return [
        'Try the action again',
        'Refresh the page',
        'Contact support if the problem persists',
      ];
  }
}
