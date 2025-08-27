'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import {
  Link2,
  Unlink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Wallet,
} from 'lucide-react';

interface WalletLinkManagerProps {
  className?: string;
  showTitle?: boolean;
}

export default function WalletLinkManager({
  className = '',
  showTitle = true,
}: WalletLinkManagerProps) {
  const { address, isConnected } = useAccount();
  const { user } = useAuthContext();
  const {
    isLinking,
    isUnlinking,
    isVerifying,
    error,
    success,
    isWalletLinked,
    hasLinkedWallet,
    linkWallet,
    unlinkWallet,
    clearMessages,
    linkedWalletAddress,
  } = useWalletAuth();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // If user is not authenticated
  if (!user) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-stakeados-yellow mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Authentication Required
          </h3>
          <p className="text-stakeados-gray-400">
            Please sign in to manage wallet connections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-neon mb-2">
            Wallet Connection
          </h3>
          <p className="text-stakeados-gray-300">
            Link your wallet to access Web3 features and earn NFT certificates
          </p>
        </div>
      )}

      {/* Messages */}
      {(error || success) && (
        <div className="mb-6">
          {error && (
            <div className="notification-error mb-3">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-red hover:text-stakeados-red/80 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="notification-success mb-3">
              <div className="flex items-center justify-between">
                <span>{success}</span>
                <button
                  onClick={clearMessages}
                  className="text-stakeados-primary hover:text-stakeados-primary/80 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Wallet Status */}
      <div className="space-y-4">
        {/* Connected Wallet */}
        {isConnected && address && (
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-stakeados-blue" />
              <span className="font-semibold text-white">Connected Wallet</span>
            </div>
            <div className="text-sm text-stakeados-gray-300">
              {formatAddress(address)}
            </div>
          </div>
        )}

        {/* Linked Wallet */}
        {hasLinkedWallet && linkedWalletAddress && (
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-5 h-5 text-stakeados-primary" />
              <span className="font-semibold text-white">Linked Wallet</span>
              {isWalletLinked && (
                <CheckCircle className="w-4 h-4 text-stakeados-primary" />
              )}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              {formatAddress(linkedWalletAddress)}
            </div>
            {isWalletLinked && (
              <div className="text-xs text-stakeados-primary mt-1">
                ✓ Currently connected wallet matches linked wallet
              </div>
            )}
          </div>
        )}

        {/* No Wallet Connected */}
        {!isConnected && (
          <div className="p-4 bg-stakeados-gray-800 rounded-gaming border border-stakeados-gray-600">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-stakeados-yellow" />
              <span className="font-semibold text-stakeados-yellow">
                No Wallet Connected
              </span>
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Connect your wallet to link it to your profile
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {isConnected && address && (
          <>
            {!isWalletLinked && (
              <button
                onClick={() => linkWallet()}
                disabled={isLinking || isVerifying}
                className="btn-primary w-full"
              >
                {isLinking || isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isVerifying
                      ? 'Verifying Signature...'
                      : 'Linking Wallet...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Link Current Wallet
                  </div>
                )}
              </button>
            )}

            {isWalletLinked && (
              <button
                onClick={unlinkWallet}
                disabled={isUnlinking}
                className="btn-secondary w-full"
              >
                {isUnlinking ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Unlinking Wallet...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Unlink className="w-4 h-4" />
                    Unlink Wallet
                  </div>
                )}
              </button>
            )}
          </>
        )}

        {/* Help Text */}
        <div className="text-xs text-stakeados-gray-400 text-center">
          {isConnected && address
            ? isWalletLinked
              ? 'Your wallet is linked and verified. You can now access Web3 features.'
              : hasLinkedWallet
                ? 'You have a different wallet linked. Connect the linked wallet or link this one.'
                : 'Link your wallet to access Web3 features and earn NFT certificates.'
            : 'Connect a wallet first to link it to your profile.'}
        </div>
      </div>
    </div>
  );
}
