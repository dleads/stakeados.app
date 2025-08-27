'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { X, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import WalletConnect from '@/components/web3/WalletConnect';

interface WalletAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletAuthModalProps) {
  const { address } = useAccount();
  const { authenticateWallet, isVerifying, error, success } = useWalletAuth();
  const [step, setStep] = useState<'connect' | 'authenticate'>('connect');

  if (!isOpen) return null;

  const handleWalletConnected = () => {
    setStep('authenticate');
  };

  const handleAuthenticate = async () => {
    if (!address) return;

    const result = await authenticateWallet(address);
    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-20 w-8 h-8 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-full flex items-center justify-center text-stakeados-gray-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="card-gaming">
          {step === 'connect' ? (
            // Step 1: Connect Wallet
            <div>
              <div className="text-center mb-6">
                <Wallet className="w-12 h-12 text-stakeados-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-neon mb-2">
                  Connect with Wallet
                </h2>
                <p className="text-stakeados-gray-300">
                  Connect your wallet to sign in to your Stakeados account
                </p>
              </div>

              <WalletConnect
                onSuccess={handleWalletConnected}
                showBalance={false}
                className="!bg-transparent !border-0 !p-0"
              />
            </div>
          ) : (
            // Step 2: Authenticate
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-stakeados-dark" />
                </div>
                <h2 className="text-2xl font-bold text-neon mb-2">
                  Authenticate Wallet
                </h2>
                <p className="text-stakeados-gray-300 mb-4">
                  Wallet connected successfully! Now authenticate to access your
                  account.
                </p>

                {address && (
                  <div className="p-3 bg-stakeados-gray-800 rounded-gaming mb-4">
                    <div className="text-sm text-stakeados-gray-300">
                      Connected Wallet:
                    </div>
                    <div className="font-mono text-stakeados-primary">
                      {formatAddress(address)}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="notification-error mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="notification-success mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{success}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleAuthenticate}
                  disabled={isVerifying || !address}
                  className="btn-primary w-full"
                >
                  {isVerifying ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </div>
                  ) : (
                    'Authenticate with Wallet'
                  )}
                </button>

                <button
                  onClick={() => setStep('connect')}
                  className="btn-ghost w-full"
                >
                  Use Different Wallet
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-stakeados-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={onClose}
                    className="text-stakeados-primary hover:underline"
                  >
                    Sign up first
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
