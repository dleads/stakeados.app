'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  signVerificationMessage,
  verifyAndLinkWallet,
  unlinkWallet,
  checkWalletAvailability,
  authenticateWithWallet,
} from '@/lib/web3/auth';
import type { Address } from 'viem';

interface WalletAuthState {
  isLinking: boolean;
  isUnlinking: boolean;
  isVerifying: boolean;
  error: string | null;
  success: string | null;
}

export function useWalletAuth() {
  const { address } = useAccount();
  const { user, profile, updateProfile } = useAuthContext();

  const [state, setState] = useState<WalletAuthState>({
    isLinking: false,
    isUnlinking: false,
    isVerifying: false,
    error: null,
    success: null,
  });

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Link wallet to current user profile
  const linkWallet = useCallback(
    async (walletAddress?: Address) => {
      if (!user) {
        setState(prev => ({
          ...prev,
          error: 'User must be authenticated to link wallet',
        }));
        return { success: false };
      }

      const targetAddress = walletAddress || address;
      if (!targetAddress) {
        setState(prev => ({ ...prev, error: 'No wallet address provided' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isLinking: true,
        error: null,
        success: null,
      }));

      try {
        // Check if wallet is available
        const availability = await checkWalletAvailability(
          targetAddress,
          user.id
        );
        if (!availability.available) {
          setState(prev => ({
            ...prev,
            isLinking: false,
            error: 'This wallet is already linked to another account',
          }));
          return { success: false };
        }

        // Sign verification message
        setState(prev => ({ ...prev, isVerifying: true }));
        const { signature, message } =
          await signVerificationMessage(targetAddress);

        // Verify and link wallet
        const result = await verifyAndLinkWallet(
          user.id,
          targetAddress,
          signature,
          message
        );

        if (result.success) {
          // Update local profile state
          await updateProfile({ wallet_address: targetAddress.toLowerCase() });

          setState(prev => ({
            ...prev,
            isLinking: false,
            isVerifying: false,
            success: 'Wallet linked successfully!',
          }));
          return { success: true };
        } else {
          setState(prev => ({
            ...prev,
            isLinking: false,
            isVerifying: false,
            error: result.error || 'Failed to link wallet',
          }));
          return { success: false };
        }
      } catch (error) {
        console.error('Error linking wallet:', error);
        setState(prev => ({
          ...prev,
          isLinking: false,
          isVerifying: false,
          error:
            error instanceof Error ? error.message : 'Failed to link wallet',
        }));
        return { success: false };
      }
    },
    [user, address, updateProfile]
  );

  // Unlink wallet from current user profile
  const unlinkWalletFromProfile = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'User must be authenticated to unlink wallet',
      }));
      return { success: false };
    }

    setState(prev => ({
      ...prev,
      isUnlinking: true,
      error: null,
      success: null,
    }));

    try {
      const result = await unlinkWallet(user.id);

      if (result.success) {
        // Update local profile state
        await updateProfile({ wallet_address: null });

        setState(prev => ({
          ...prev,
          isUnlinking: false,
          success: 'Wallet unlinked successfully!',
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isUnlinking: false,
          error: result.error || 'Failed to unlink wallet',
        }));
        return { success: false };
      }
    } catch (error) {
      console.error('Error unlinking wallet:', error);
      setState(prev => ({
        ...prev,
        isUnlinking: false,
        error:
          error instanceof Error ? error.message : 'Failed to unlink wallet',
      }));
      return { success: false };
    }
  }, [user, updateProfile]);

  // Authenticate user with wallet (for wallet-first login)
  const authenticateWallet = useCallback(
    async (walletAddress?: Address) => {
      const targetAddress = walletAddress || address;
      if (!targetAddress) {
        setState(prev => ({ ...prev, error: 'No wallet address provided' }));
        return { success: false };
      }

      setState(prev => ({
        ...prev,
        isVerifying: true,
        error: null,
        success: null,
      }));

      try {
        const result = await authenticateWithWallet(targetAddress);

        setState(prev => ({ ...prev, isVerifying: false }));

        if (result.success && result.user) {
          setState(prev => ({
            ...prev,
            success: 'Wallet authenticated successfully!',
          }));
          return { success: true, user: result.user };
        } else if (result.requiresSignUp) {
          setState(prev => ({
            ...prev,
            error:
              'This wallet is not linked to any account. Please sign up first.',
          }));
          return { success: false, requiresSignUp: true };
        } else {
          setState(prev => ({
            ...prev,
            error: result.error || 'Wallet authentication failed',
          }));
          return { success: false };
        }
      } catch (error) {
        console.error('Error authenticating wallet:', error);
        setState(prev => ({
          ...prev,
          isVerifying: false,
          error:
            error instanceof Error
              ? error.message
              : 'Wallet authentication failed',
        }));
        return { success: false };
      }
    },
    [address]
  );

  // Check if current wallet is linked to current user
  const isWalletLinked =
    profile?.wallet_address?.toLowerCase() === address?.toLowerCase();

  // Check if user has any wallet linked
  const hasLinkedWallet = !!profile?.wallet_address;

  return {
    // State
    ...state,
    isWalletLinked,
    hasLinkedWallet,

    // Actions
    linkWallet,
    unlinkWallet: unlinkWalletFromProfile,
    authenticateWallet,
    clearMessages,

    // Current wallet info
    currentWalletAddress: address,
    linkedWalletAddress: profile?.wallet_address,
  };
}
