'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import {
  mintCertificateGasless,
  mintCitizenshipGasless,
  batchMintCertificatesGasless,
  executeSmartTransaction,
  isGaslessAvailable,
} from '@/lib/web3/paymaster';
import type { Address } from 'viem';

interface GaslessTransactionState {
  isLoading: boolean;
  isGaslessAvailable: boolean;
  error: string | null;
  success: string | null;
  lastTxHash: string | null;
  wasGasless: boolean;
}

export function useGaslessTransactions() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<GaslessTransactionState>({
    isLoading: false,
    isGaslessAvailable: false,
    error: null,
    success: null,
    lastTxHash: null,
    wasGasless: false,
  });

  // Check gasless availability
  const checkGaslessAvailability = useCallback(async () => {
    try {
      const available = await isGaslessAvailable();
      setState(prev => ({ ...prev, isGaslessAvailable: available }));
      return available;
    } catch (error) {
      console.error('Error checking gasless availability:', error);
      setState(prev => ({ ...prev, isGaslessAvailable: false }));
      return false;
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Mint certificate with gasless transaction
  const mintCertificate = useCallback(
    async (
      recipient: Address,
      courseId: string,
      courseName: string,
      score: number,
      difficulty: string,
      tokenURI: string
    ) => {
      if (!address) {
        setState(prev => ({ ...prev, error: 'Wallet not connected' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        success: null,
      }));

      try {
        const result = await mintCertificateGasless(
          recipient,
          courseId,
          courseName,
          score,
          difficulty,
          tokenURI
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            success: 'Certificate minted successfully!',
            lastTxHash: result.txHash || null,
            wasGasless: true,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Failed to mint certificate',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [address]
  );

  // Mint citizenship with gasless transaction
  const mintCitizenship = useCallback(
    async (
      recipient: Address,
      points: number,
      isGenesis: boolean,
      ethBalance: bigint,
      transactionCount: number,
      tokenURI: string
    ) => {
      if (!address) {
        setState(prev => ({ ...prev, error: 'Wallet not connected' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        success: null,
      }));

      try {
        const result = await mintCitizenshipGasless(
          recipient,
          points,
          isGenesis,
          ethBalance,
          transactionCount,
          tokenURI
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            success: 'Citizenship NFT minted successfully!',
            lastTxHash: result.txHash || null,
            wasGasless: true,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Failed to mint citizenship',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [address]
  );

  // Batch mint certificates
  const batchMintCertificates = useCallback(
    async (
      recipients: Address[],
      courseId: string,
      courseName: string,
      scores: number[],
      difficulty: string,
      tokenURIs: string[]
    ) => {
      if (!address) {
        setState(prev => ({ ...prev, error: 'Wallet not connected' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        success: null,
      }));

      try {
        const result = await batchMintCertificatesGasless(
          recipients,
          courseId,
          courseName,
          scores,
          difficulty,
          tokenURIs,
          address
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            success: `${recipients.length} certificates minted successfully!`,
            lastTxHash: result.txHash || null,
            wasGasless: true,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Failed to batch mint certificates',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [address]
  );

  // Execute smart transaction with fallback
  const executeTransaction = useCallback(
    async (
      to: Address,
      data: `0x${string}`,
      value?: bigint,
      _gasLimit?: bigint
    ) => {
      if (!address) {
        setState(prev => ({ ...prev, error: 'Wallet not connected' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        success: null,
      }));

      try {
        const result = await executeSmartTransaction(
          { to, data, value },
          address,
          walletClient
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            success: `Transaction executed successfully${result.wasGasless ? ' (gasless)' : ''}!`,
            lastTxHash: result.txHash || null,
            wasGasless: result.wasGasless,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Transaction failed',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [address, walletClient]
  );

  return {
    // State
    ...state,

    // Actions
    mintCertificate,
    mintCitizenship,
    batchMintCertificates,
    executeTransaction,
    checkGaslessAvailability,
    clearMessages,

    // Utilities
    isConnected: !!address,
    currentAddress: address,
  };
}
