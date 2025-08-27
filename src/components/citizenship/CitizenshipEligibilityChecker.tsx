'use client';

import React from 'react';
import { useCitizenshipEligibility } from '@/hooks/useCitizenshipEligibility';
import { CheckCircle, XCircle, Clock, Zap, Award } from 'lucide-react';

interface CitizenshipEligibilityCheckerProps {
  className?: string;
  showMintButton?: boolean;
  compact?: boolean;
}

export default function CitizenshipEligibilityChecker({
  className = '',
  showMintButton = true,
}: CitizenshipEligibilityCheckerProps) {
  const {
    isEligible,
    requirements,
    hasCitizenship,
    citizenship,
    isMinting,
    error,
    success,
    overallProgress,
    mintCitizenshipNFT,
    clearMessages,
    canMint,
    isConnected,
    isAuthenticated,
  } = useCitizenshipEligibility();

  if (!isAuthenticated) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in to check your citizenship eligibility
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-stakeados-gray-400">
            Connect your wallet to check Web3 requirements
          </p>
        </div>
      </div>
    );
  }

  if (hasCitizenship && citizenship) {
    return (
      <div className={`card-highlight ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-stakeados-dark" />
          </div>
          <h2 className="text-2xl font-bold text-stakeados-primary mb-2">
            Citizenship Active
          </h2>
          <p className="text-stakeados-gray-300 mb-4">
            You are a verified citizen of the Stakeados community
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
              <div className="font-semibold text-stakeados-primary">
                {citizenship.data.tier.toUpperCase()}
              </div>
              <div className="text-xs text-stakeados-gray-400">
                Citizenship Tier
              </div>
            </div>
            <div className="p-3 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
              <div className="font-semibold text-stakeados-blue">
                {citizenship.data.pointsAtMint}
              </div>
              <div className="text-xs text-stakeados-gray-400">
                Points at Mint
              </div>
            </div>
            <div className="p-3 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
              <div className="font-semibold text-stakeados-yellow">
                #{citizenship.tokenId}
              </div>
              <div className="text-xs text-stakeados-gray-400">Token ID</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-6 h-6 text-stakeados-primary" />
          <h3 className="text-xl font-bold text-neon">
            Citizenship Eligibility
          </h3>
        </div>
        <p className="text-stakeados-gray-300">
          Meet these requirements to earn your Citizenship NFT
        </p>
      </div>

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

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-white">Overall Progress</span>
          <span className="text-stakeados-primary font-bold">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4 mb-6">
        {requirements.map(requirement => (
          <div
            key={requirement.id}
            className="p-4 bg-stakeados-gray-800 rounded-gaming"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {requirement.met ? (
                  <CheckCircle className="w-6 h-6 text-stakeados-primary" />
                ) : (
                  <XCircle className="w-6 h-6 text-stakeados-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{requirement.icon}</span>
                  <h4 className="font-semibold text-white">
                    {requirement.name}
                  </h4>
                </div>

                <p className="text-stakeados-gray-300 text-sm mb-3">
                  {requirement.description}
                </p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-stakeados-gray-400 text-sm">
                    Required: {requirement.required}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      requirement.met
                        ? 'text-stakeados-primary'
                        : 'text-stakeados-gray-300'
                    }`}
                  >
                    Current: {requirement.current}
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      requirement.met
                        ? 'bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light'
                        : 'bg-stakeados-gray-600'
                    }`}
                    style={{ width: `${requirement.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Eligibility Status */}
      <div
        className={`p-4 rounded-gaming border-2 mb-6 ${
          isEligible
            ? 'bg-stakeados-primary/10 border-stakeados-primary'
            : 'bg-stakeados-gray-800 border-stakeados-gray-600'
        }`}
      >
        <div className="flex items-center gap-3">
          {isEligible ? (
            <CheckCircle className="w-6 h-6 text-stakeados-primary" />
          ) : (
            <Clock className="w-6 h-6 text-stakeados-gray-400" />
          )}
          <div>
            <div
              className={`font-semibold ${
                isEligible
                  ? 'text-stakeados-primary'
                  : 'text-stakeados-gray-300'
              }`}
            >
              {isEligible
                ? 'Eligible for Citizenship NFT!'
                : 'Not Yet Eligible'}
            </div>
            <div className="text-sm text-stakeados-gray-400">
              {isEligible
                ? 'You meet all requirements and can mint your citizenship NFT'
                : 'Complete the requirements above to become eligible'}
            </div>
          </div>
        </div>
      </div>

      {/* Mint Button */}
      {showMintButton && canMint && (
        <button
          onClick={mintCitizenshipNFT}
          disabled={isMinting}
          className="btn-primary w-full"
        >
          {isMinting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
              Minting Citizenship NFT...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              Mint Citizenship NFT
            </div>
          )}
        </button>
      )}

      {/* Benefits Preview */}
      <div className="mt-6 p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
        <h4 className="font-semibold text-stakeados-blue mb-3">
          🎉 Citizenship Benefits
        </h4>
        <ul className="text-sm text-stakeados-gray-300 space-y-1">
          <li>• Permanent citizenship status and recognition</li>
          <li>• Access to exclusive citizen-only content</li>
          <li>• Governance participation rights</li>
          <li>• Priority access to new features</li>
          <li>• Special citizenship badge and tier status</li>
          <li>• Future revenue sharing opportunities</li>
        </ul>
      </div>
    </div>
  );
}
