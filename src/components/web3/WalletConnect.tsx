'use client';

import React, { useState } from 'react';
import { useWeb3Auth } from '@/lib/web3/hooks';
import { Wallet, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface WalletConnectProps {
  onSuccess?: () => void;
  showBalance?: boolean;
  className?: string;
}

export default function WalletConnect({
  onSuccess,
  showBalance = true,
  className = '',
}: WalletConnectProps) {
  const {
    address,
    isConnected,
    isConnecting,
    isChainSupported,
    balance,
    isBalanceLoading,
    connectCoinbaseWallet,
    connectWalletConnect,
    connectInjected,
    switchToSupportedChain,
    disconnectWallet,
    targetChain,
    linkError,
    isLinking,
  } = useWeb3Auth();

  const [showConnectors, setShowConnectors] = useState(false);

  const handleConnect = (
    connector: 'coinbase' | 'walletconnect' | 'injected'
  ) => {
    switch (connector) {
      case 'coinbase':
        connectCoinbaseWallet();
        break;
      case 'walletconnect':
        connectWalletConnect();
        break;
      case 'injected':
        connectInjected();
        break;
    }
    setShowConnectors(false);
    onSuccess?.();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // If connected but wrong chain
  if (isConnected && !isChainSupported) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-stakeados-yellow" />
          <div>
            <h3 className="font-semibold text-stakeados-yellow">
              Wrong Network
            </h3>
            <p className="text-sm text-stakeados-gray-300">
              Please switch to {targetChain.name}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={switchToSupportedChain}
            className="btn-primary flex-1"
          >
            Switch to {targetChain.name}
          </button>
          <button onClick={disconnectWallet} className="btn-secondary">
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // If connected and correct chain
  if (isConnected && address) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-stakeados-dark" />
            </div>
            <div>
              <h3 className="font-semibold text-stakeados-primary">
                Wallet Connected
              </h3>
              <p className="text-sm text-stakeados-gray-300">
                {formatAddress(address)}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(address)}
            className="p-2 text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
            title="Copy address"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {showBalance && (
          <div className="mb-4 p-3 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex justify-between items-center">
              <span className="text-stakeados-gray-300">Balance:</span>
              <span className="font-semibold text-white">
                {isBalanceLoading ? (
                  <div className="w-16 h-4 bg-stakeados-gray-600 rounded animate-pulse" />
                ) : (
                  `${balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} ${targetChain.nativeCurrency.symbol}`
                )}
              </span>
            </div>
          </div>
        )}

        {linkError && (
          <div className="notification-error mb-4">
            <p className="text-sm">Failed to link wallet: {linkError}</p>
          </div>
        )}

        {isLinking && (
          <div className="flex items-center gap-2 mb-4 text-stakeados-yellow">
            <div className="w-4 h-4 border-2 border-stakeados-yellow border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Linking wallet to profile...</span>
          </div>
        )}

        <button onClick={disconnectWallet} className="btn-secondary w-full">
          Disconnect Wallet
        </button>
      </div>
    );
  }

  // Connection interface
  return (
    <div className={`card-gaming ${className}`}>
      <div className="text-center mb-6">
        <Wallet className="w-12 h-12 text-stakeados-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-neon mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-stakeados-gray-300">
          Connect your wallet to access Web3 features and earn NFT certificates
        </p>
      </div>

      {!showConnectors ? (
        <button
          onClick={() => setShowConnectors(true)}
          disabled={isConnecting}
          className="btn-primary w-full"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
              Connecting...
            </div>
          ) : (
            'Connect Wallet'
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Coinbase Smart Wallet (Primary) */}
          <button
            onClick={() => handleConnect('coinbase')}
            className="w-full p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming border border-stakeados-gray-600 hover:border-stakeados-primary/50 transition-all flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">
                Coinbase Smart Wallet
              </div>
              <div className="text-xs text-stakeados-primary">Recommended</div>
            </div>
          </button>

          {/* WalletConnect */}
          <button
            onClick={() => handleConnect('walletconnect')}
            className="w-full p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming border border-stakeados-gray-600 hover:border-stakeados-primary/50 transition-all flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">WC</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">WalletConnect</div>
              <div className="text-xs text-stakeados-gray-400">
                Mobile wallets
              </div>
            </div>
          </button>

          {/* Injected (MetaMask, etc.) */}
          <button
            onClick={() => handleConnect('injected')}
            className="w-full p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming border border-stakeados-gray-600 hover:border-stakeados-primary/50 transition-all flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">Browser Wallet</div>
              <div className="text-xs text-stakeados-gray-400">
                MetaMask, etc.
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowConnectors(false)}
            className="btn-ghost w-full mt-4"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-stakeados-gray-400">
          By connecting your wallet, you agree to our{' '}
          <a href="/terms" className="text-stakeados-primary hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
