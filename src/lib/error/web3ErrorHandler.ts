// Web3-specific error handling

import { StakeadosError, ERROR_CODES, handleError } from './errorHandler';
import type { Address } from 'viem';

export interface Web3ErrorContext {
  action: 'connect' | 'transaction' | 'contract_call' | 'sign_message';
  walletType?: string;
  chainId?: number;
  contractAddress?: Address;
  transactionHash?: string;
  userAddress?: Address;
}

// Web3 error types
export const WEB3_ERROR_CODES = {
  USER_REJECTED: 'USER_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONTRACT_EXECUTION_REVERTED: 'CONTRACT_EXECUTION_REVERTED',
  INVALID_PARAMS: 'INVALID_PARAMS',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  UNSUPPORTED_CHAIN: 'UNSUPPORTED_CHAIN',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
} as const;

export class Web3ErrorHandler {
  static handleWalletError(
    error: Error,
    context: Web3ErrorContext
  ): StakeadosError {
    const message = error.message.toLowerCase();

    // User rejected transaction
    if (message.includes('user rejected') || message.includes('user denied')) {
      return new StakeadosError(
        'Transaction was cancelled by user',
        WEB3_ERROR_CODES.USER_REJECTED,
        context,
        true
      );
    }

    // Insufficient funds
    if (
      message.includes('insufficient funds') ||
      message.includes('insufficient balance')
    ) {
      return new StakeadosError(
        'Insufficient funds to complete this transaction',
        WEB3_ERROR_CODES.INSUFFICIENT_FUNDS,
        context,
        true
      );
    }

    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return new StakeadosError(
        'Network connection error. Please check your internet connection.',
        WEB3_ERROR_CODES.NETWORK_ERROR,
        context,
        true
      );
    }

    // Contract execution reverted
    if (message.includes('execution reverted') || message.includes('revert')) {
      return new StakeadosError(
        'Transaction failed. Please check the transaction details and try again.',
        WEB3_ERROR_CODES.CONTRACT_EXECUTION_REVERTED,
        context,
        true
      );
    }

    // Unsupported chain
    if (message.includes('chain') || message.includes('network')) {
      return new StakeadosError(
        'Please switch to the correct network (Base) and try again.',
        WEB3_ERROR_CODES.UNSUPPORTED_CHAIN,
        context,
        true
      );
    }

    // Generic Web3 error
    return new StakeadosError(
      'Web3 operation failed. Please try again.',
      ERROR_CODES.WALLET_ERROR,
      context,
      true
    );
  }

  static handleTransactionError(
    error: Error,
    context: Web3ErrorContext
  ): StakeadosError {
    const message = error.message.toLowerCase();

    // Transaction timeout
    if (message.includes('timeout') || message.includes('timed out')) {
      return new StakeadosError(
        'Transaction timed out. It may still be processing.',
        WEB3_ERROR_CODES.TRANSACTION_TIMEOUT,
        context,
        true
      );
    }

    // Gas estimation failed
    if (message.includes('gas') && message.includes('estimation')) {
      return new StakeadosError(
        'Unable to estimate gas for this transaction. Please try again.',
        WEB3_ERROR_CODES.INVALID_PARAMS,
        context,
        true
      );
    }

    return Web3ErrorHandler.handleWalletError(error, context);
  }

  static handleContractError(
    error: Error,
    context: Web3ErrorContext
  ): StakeadosError {
    const message = error.message.toLowerCase();

    // Contract not found
    if (message.includes('contract') && message.includes('not found')) {
      return new StakeadosError(
        'Smart contract not found. Please check the contract address.',
        ERROR_CODES.NOT_FOUND,
        context,
        false
      );
    }

    // Invalid function call
    if (message.includes('function') && message.includes('not found')) {
      return new StakeadosError(
        'Invalid contract function call.',
        WEB3_ERROR_CODES.INVALID_PARAMS,
        context,
        false
      );
    }

    return Web3ErrorHandler.handleTransactionError(error, context);
  }

  // Recovery suggestions for Web3 errors
  static getRecoverySuggestions(error: StakeadosError): string[] {
    switch (error.code) {
      case WEB3_ERROR_CODES.USER_REJECTED:
        return [
          'Try the transaction again',
          'Make sure you approve the transaction in your wallet',
        ];

      case WEB3_ERROR_CODES.INSUFFICIENT_FUNDS:
        return [
          'Add more ETH to your wallet',
          'Try a smaller transaction amount',
          'Check if you have enough gas fees',
        ];

      case WEB3_ERROR_CODES.NETWORK_ERROR:
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Switch to a different network and back',
        ];

      case WEB3_ERROR_CODES.UNSUPPORTED_CHAIN:
        return [
          'Switch to Base network in your wallet',
          'Add Base network to your wallet if not present',
          'Refresh the page after switching networks',
        ];

      case WEB3_ERROR_CODES.TRANSACTION_TIMEOUT:
        return [
          'Check your wallet for pending transactions',
          'Wait a few minutes and try again',
          'Increase gas price for faster processing',
        ];

      default:
        return [
          'Try the action again',
          'Refresh the page',
          'Contact support if the problem persists',
        ];
    }
  }
}

// Convenience functions for Web3 error handling
export function handleWeb3Error(
  error: Error,
  action: Web3ErrorContext['action'],
  additionalContext?: Partial<Web3ErrorContext>
): StakeadosError {
  const context: Web3ErrorContext = {
    action,
    ...additionalContext,
  };

  let stakeadosError: StakeadosError;

  switch (action) {
    case 'transaction':
      stakeadosError = Web3ErrorHandler.handleTransactionError(error, context);
      break;
    case 'contract_call':
      stakeadosError = Web3ErrorHandler.handleContractError(error, context);
      break;
    default:
      stakeadosError = Web3ErrorHandler.handleWalletError(error, context);
  }

  handleError(stakeadosError, context);
  return stakeadosError;
}

export function getWeb3RecoverySuggestions(error: StakeadosError): string[] {
  return Web3ErrorHandler.getRecoverySuggestions(error);
}

// Web3 operation wrapper with error handling
export async function withWeb3ErrorHandling<T>(
  operation: () => Promise<T>,
  action: Web3ErrorContext['action'],
  context?: Partial<Web3ErrorContext>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleWeb3Error(error as Error, action, context);
  }
}
