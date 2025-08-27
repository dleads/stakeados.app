'use client';

import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { getCurrentChain, isSupportedChain } from './config';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { verifyAndLinkWallet, unlinkWallet } from './auth';

// Custom hook for Web3 connection with Supabase integration
export function useWeb3Auth() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { user, updateProfile } = useAuthContext();

  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Get balance for connected wallet
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  // Check if current chain is supported
  const isChainSupported = isSupportedChain(chainId);
  const targetChain = getCurrentChain();

  // Link wallet address to user profile
  const linkWalletToProfile = useCallback(async () => {
    if (!address || !user || isLinking) return;

    setIsLinking(true);
    setLinkError(null);

    try {
      const result = await verifyAndLinkWallet(
        user.id,
        address,
        'auto-link', // Simplified for auto-linking
        'auto-link'
      );

      if (result.success) {
        // Update local profile state
        await updateProfile({ wallet_address: address.toLowerCase() });
      } else {
        throw new Error(result.error || 'Failed to link wallet');
      }
    } catch (error) {
      console.error('Error linking wallet to profile:', error);
      setLinkError(
        error instanceof Error ? error.message : 'Failed to link wallet'
      );
    } finally {
      setIsLinking(false);
    }
  }, [address, user, updateProfile]);

  // Auto-link wallet when connected and user is authenticated
  useEffect(() => {
    if (isConnected && address && user && !isLinking) {
      linkWalletToProfile();
    }
  }, [isConnected, address, user, linkWalletToProfile, isLinking]);

  // Connect to Coinbase Smart Wallet (primary option)
  const connectCoinbaseWallet = useCallback(() => {
    const coinbaseConnector = connectors.find(
      connector => connector.id === 'coinbaseWalletSDK'
    );

    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  }, [connect, connectors]);

  // Connect to WalletConnect
  const connectWalletConnect = useCallback(() => {
    const walletConnectConnector = connectors.find(
      connector => connector.id === 'walletConnect'
    );

    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  }, [connect, connectors]);

  // Connect to injected wallet (MetaMask, etc.)
  const connectInjected = useCallback(() => {
    const injectedConnector = connectors.find(
      connector => connector.id === 'injected'
    );

    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  }, [connect, connectors]);

  // Switch to supported chain
  const switchToSupportedChain = useCallback(() => {
    if (switchChain) {
      switchChain({ chainId: targetChain.id });
    }
  }, [switchChain, targetChain.id]);

  // Disconnect wallet and unlink from profile
  const disconnectWallet = useCallback(async () => {
    disconnect();

    if (user) {
      try {
        const result = await unlinkWallet(user.id);
        if (result.success) {
          await updateProfile({ wallet_address: null });
        }
      } catch (error) {
        console.error('Error unlinking wallet from profile:', error);
      }
    }
  }, [disconnect, user, updateProfile]);

  return {
    // Connection state
    address,
    isConnected,
    isConnecting: isConnecting || isPending,
    isDisconnected,

    // Chain information
    chainId,
    isChainSupported,
    targetChain,

    // Balance information
    balance,
    isBalanceLoading,

    // Profile linking
    isLinking,
    linkError,
    linkWalletToProfile,

    // Connection methods
    connectCoinbaseWallet,
    connectWalletConnect,
    connectInjected,

    // Chain switching
    switchToSupportedChain,

    // Disconnection
    disconnectWallet,

    // Available connectors
    connectors,
  };
}

// Hook for checking Web3 requirements for citizenship
export function useWeb3Requirements() {
  const { address, balance, isConnected } = useWeb3Auth();
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user meets ETH balance requirement
  const hasRequiredBalance =
    balance &&
    parseFloat(balance.formatted) >=
      parseFloat(
        getCurrentChain().nativeCurrency.symbol === 'ETH' ? '0.001' : '0'
      );

  // Check if user meets minimum transaction requirement
  const hasMinTransactions = transactionCount >= 2;

  // Check overall Web3 eligibility
  const isWeb3Eligible =
    isConnected && hasRequiredBalance && hasMinTransactions;

  // Fetch transaction count (simplified - in production, use proper RPC calls)
  useEffect(() => {
    if (address && isConnected) {
      setIsLoading(true);
      // This is a placeholder - implement actual transaction count fetching
      // using viem or ethers to call eth_getTransactionCount
      setTimeout(() => {
        setTransactionCount(Math.floor(Math.random() * 10)); // Mock data
        setIsLoading(false);
      }, 1000);
    }
  }, [address, isConnected]);

  return {
    address,
    balance,
    transactionCount,
    hasRequiredBalance,
    hasMinTransactions,
    isWeb3Eligible,
    isLoading,
    requirements: {
      minBalance: '0.001 ETH',
      minTransactions: 2,
    },
  };
}
