'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';
import {
  Star,
  Crown,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Award,
} from 'lucide-react';

interface GenesisClaimInterfaceProps {
  className?: string;
}

export default function GenesisClaimInterface({
  className = '',
}: GenesisClaimInterfaceProps) {
  const { user, profile, updateProfile, isGenesisHolder } = useAuthContext();
  const { address, isConnected } = useAccount();

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<
    'idle' | 'verifying' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState(1);

  // Mock Genesis verification - in production this would check actual NFT ownership
  const verifyGenesisOwnership = async (
    walletAddress: string
  ): Promise<boolean> => {
    // Simulate API call to verify Genesis NFT ownership
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock verification - in production, check actual NFT contract
    const mockGenesisHolders = [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
      '0x8ba1f109551bD432803012645Hac136c5c8b4d8b',
      // Add more mock addresses for testing
    ];

    return mockGenesisHolders.includes(walletAddress) || Math.random() > 0.7; // 30% chance for demo
  };

  const handleClaim = async () => {
    if (!user || !address) return;

    setIsClaiming(true);
    setClaimStatus('verifying');
    setError(null);
    setVerificationStep(1);

    try {
      // Step 1: Verify wallet connection
      setVerificationStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Check Genesis NFT ownership
      setVerificationStep(2);
      const isGenesisOwner = await verifyGenesisOwnership(address);

      if (!isGenesisOwner) {
        throw new Error('No Genesis NFT found in connected wallet');
      }

      // Step 3: Update profile
      setVerificationStep(3);
      await updateProfile({
        is_genesis: true,
        total_points: (profile?.total_points || 0) + 30, // Genesis bonus points
      });

      setClaimStatus('success');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to claim Genesis status'
      );
      setClaimStatus('error');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isGenesisHolder) {
    return (
      <div className={`card-highlight ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-stakeados-yellow to-stakeados-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-stakeados-dark" />
          </div>
          <h2 className="text-2xl font-bold text-stakeados-yellow mb-2">
            Genesis Status Active
          </h2>
          <p className="text-stakeados-gray-300 mb-6">
            You are a founding member of the Stakeados community
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
              <Star className="w-6 h-6 text-stakeados-yellow mx-auto mb-2" />
              <div className="font-semibold text-stakeados-yellow">
                Early Access
              </div>
              <div className="text-xs text-stakeados-gray-400">
                New features first
              </div>
            </div>
            <div className="p-4 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
              <Award className="w-6 h-6 text-stakeados-primary mx-auto mb-2" />
              <div className="font-semibold text-stakeados-primary">
                Special Badge
              </div>
              <div className="text-xs text-stakeados-gray-400">
                Founder recognition
              </div>
            </div>
            <div className="p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
              <Shield className="w-6 h-6 text-stakeados-blue mx-auto mb-2" />
              <div className="font-semibold text-stakeados-blue">
                Exclusive Content
              </div>
              <div className="text-xs text-stakeados-gray-400">
                Genesis-only access
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-stakeados-yellow to-stakeados-orange rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-stakeados-dark" />
        </div>
        <h2 className="text-3xl font-bold text-neon mb-2">
          Claim Genesis Status
        </h2>
        <p className="text-stakeados-gray-300">
          Verify your Genesis NFT ownership to unlock exclusive benefits
        </p>
      </div>

      {/* Requirements */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-stakeados-primary mb-4">
          Requirements
        </h3>
        <div className="space-y-3">
          <div
            className={`flex items-center gap-3 p-3 rounded-gaming ${
              user
                ? 'bg-stakeados-primary/10 border border-stakeados-primary/30'
                : 'bg-stakeados-gray-800'
            }`}
          >
            {user ? (
              <CheckCircle className="w-5 h-5 text-stakeados-primary" />
            ) : (
              <XCircle className="w-5 h-5 text-stakeados-gray-400" />
            )}
            <span
              className={
                user ? 'text-stakeados-primary' : 'text-stakeados-gray-400'
              }
            >
              Stakeados account connected
            </span>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-gaming ${
              isConnected
                ? 'bg-stakeados-primary/10 border border-stakeados-primary/30'
                : 'bg-stakeados-gray-800'
            }`}
          >
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-stakeados-primary" />
            ) : (
              <XCircle className="w-5 h-5 text-stakeados-gray-400" />
            )}
            <span
              className={
                isConnected
                  ? 'text-stakeados-primary'
                  : 'text-stakeados-gray-400'
              }
            >
              Wallet connected
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-stakeados-gray-800 rounded-gaming">
            <Crown className="w-5 h-5 text-stakeados-yellow" />
            <span className="text-stakeados-gray-300">
              Genesis NFT in connected wallet
            </span>
          </div>
        </div>
      </div>

      {/* Claim Process */}
      {claimStatus === 'idle' && (
        <div className="space-y-6">
          <button
            onClick={handleClaim}
            disabled={!user || !isConnected || isClaiming}
            className="btn-primary w-full"
          >
            <Crown className="w-4 h-4 mr-2" />
            Verify Genesis Ownership
          </button>

          <div className="text-center text-sm text-stakeados-gray-400">
            This will verify your Genesis NFT ownership and activate your
            founder benefits
          </div>
        </div>
      )}

      {/* Verification Process */}
      {claimStatus === 'verifying' && (
        <div className="space-y-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-stakeados-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Verifying Genesis Status
            </h3>
            <p className="text-stakeados-gray-300">
              Please wait while we verify your ownership...
            </p>
          </div>

          <div className="space-y-3">
            <div
              className={`flex items-center gap-3 p-3 rounded-gaming ${
                verificationStep >= 1
                  ? 'bg-stakeados-primary/10 border border-stakeados-primary/30'
                  : 'bg-stakeados-gray-800'
              }`}
            >
              {verificationStep > 1 ? (
                <CheckCircle className="w-5 h-5 text-stakeados-primary" />
              ) : verificationStep === 1 ? (
                <Loader2 className="w-5 h-5 text-stakeados-primary animate-spin" />
              ) : (
                <div className="w-5 h-5 border-2 border-stakeados-gray-600 rounded-full" />
              )}
              <span
                className={
                  verificationStep >= 1
                    ? 'text-stakeados-primary'
                    : 'text-stakeados-gray-400'
                }
              >
                Checking wallet connection
              </span>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-gaming ${
                verificationStep >= 2
                  ? 'bg-stakeados-primary/10 border border-stakeados-primary/30'
                  : 'bg-stakeados-gray-800'
              }`}
            >
              {verificationStep > 2 ? (
                <CheckCircle className="w-5 h-5 text-stakeados-primary" />
              ) : verificationStep === 2 ? (
                <Loader2 className="w-5 h-5 text-stakeados-primary animate-spin" />
              ) : (
                <div className="w-5 h-5 border-2 border-stakeados-gray-600 rounded-full" />
              )}
              <span
                className={
                  verificationStep >= 2
                    ? 'text-stakeados-primary'
                    : 'text-stakeados-gray-400'
                }
              >
                Verifying Genesis NFT ownership
              </span>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-gaming ${
                verificationStep >= 3
                  ? 'bg-stakeados-primary/10 border border-stakeados-primary/30'
                  : 'bg-stakeados-gray-800'
              }`}
            >
              {verificationStep === 3 ? (
                <Loader2 className="w-5 h-5 text-stakeados-primary animate-spin" />
              ) : (
                <div className="w-5 h-5 border-2 border-stakeados-gray-600 rounded-full" />
              )}
              <span
                className={
                  verificationStep >= 3
                    ? 'text-stakeados-primary'
                    : 'text-stakeados-gray-400'
                }
              >
                Activating Genesis benefits
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {claimStatus === 'success' && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-stakeados-primary rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-stakeados-dark" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-stakeados-primary mb-2">
              Welcome, Genesis Founder!
            </h3>
            <p className="text-stakeados-gray-300">
              Your Genesis status has been activated. You now have access to
              exclusive founder benefits.
            </p>
          </div>

          <div className="p-4 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
            <div className="text-stakeados-primary font-semibold mb-2">
              🎉 Genesis Benefits Unlocked:
            </div>
            <ul className="text-sm text-stakeados-gray-300 space-y-1">
              <li>• +30 bonus points added to your account</li>
              <li>• Early access to new features and courses</li>
              <li>• Exclusive Genesis badge and recognition</li>
              <li>• Access to Genesis-only content and discussions</li>
              <li>• Priority support and feedback channels</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Continue to Dashboard
          </button>
        </div>
      )}

      {/* Error State */}
      {claimStatus === 'error' && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-stakeados-red/20 border border-stakeados-red/30 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-stakeados-red" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stakeados-red mb-2">
              Verification Failed
            </h3>
            <p className="text-stakeados-gray-300 mb-4">
              {error || 'Unable to verify Genesis NFT ownership'}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setClaimStatus('idle');
                setError(null);
                setVerificationStep(1);
              }}
              className="btn-primary w-full"
            >
              Try Again
            </button>

            <div className="p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming text-left">
              <h4 className="font-semibold text-stakeados-blue mb-2">
                Troubleshooting:
              </h4>
              <ul className="text-sm text-stakeados-gray-300 space-y-1">
                <li>• Ensure your Genesis NFT is in the connected wallet</li>
                <li>
                  • Try switching to a different wallet if you have multiple
                </li>
                <li>
                  • Check that your wallet is connected to the correct network
                </li>
                <li>• Contact support if you believe this is an error</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Genesis Benefits Preview */}
      {claimStatus === 'idle' && (
        <div className="mt-8 p-4 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
          <h4 className="font-semibold text-stakeados-yellow mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Genesis Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-stakeados-yellow" />
              <span className="text-stakeados-gray-300">
                Early access to new features
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-stakeados-yellow" />
              <span className="text-stakeados-gray-300">
                Exclusive founder badge
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-stakeados-yellow" />
              <span className="text-stakeados-gray-300">
                Genesis-only content
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-stakeados-yellow" />
              <span className="text-stakeados-gray-300">Priority support</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
