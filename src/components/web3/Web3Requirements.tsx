'use client';

import React from 'react';
import { useCitizenshipEligibility } from '@/hooks/useCitizenshipEligibility';
import { CheckCircle, XCircle, Loader2, Coins, Activity } from 'lucide-react';

interface Web3RequirementsProps {
  showTitle?: boolean;
  className?: string;
}

export default function Web3Requirements({
  showTitle = true,
  className = '',
}: Web3RequirementsProps) {
  const {
    requirements,
    isLoading,
    isEligible,
    hasCitizenship,
    isConnected,
    isAuthenticated,
  } = useCitizenshipEligibility();

  if (!isAuthenticated || !isConnected) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Connection Required
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in and connect your wallet to check requirements
          </p>
        </div>
      </div>
    );
  }

  const ethRequirement = requirements.find(r => r.id === 'eth_balance');
  const txRequirement = requirements.find(r => r.id === 'transactions');
  return (
    <div className={`card-gaming ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-neon mb-2">
            Web3 Requirements
          </h3>
          <p className="text-stakeados-gray-300">
            Web3 activity requirements for citizenship eligibility
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* ETH Balance Requirement */}
        {ethRequirement && (
          <div className="flex items-center gap-4 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex-shrink-0">
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-stakeados-gray-400 animate-spin" />
              ) : ethRequirement.met ? (
                <CheckCircle className="w-6 h-6 text-stakeados-primary" />
              ) : (
                <XCircle className="w-6 h-6 text-stakeados-red" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-stakeados-gray-400" />
                <span className="font-semibold text-white">
                  Minimum ETH Balance
                </span>
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Required: {ethRequirement.required}
              </div>
              <div className="text-sm">
                Current:
                <span
                  className={
                    ethRequirement.met
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-red'
                  }
                >
                  {ethRequirement.current}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Count Requirement */}
        {txRequirement && (
          <div className="flex items-center gap-4 p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="flex-shrink-0">
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-stakeados-gray-400 animate-spin" />
              ) : txRequirement.met ? (
                <CheckCircle className="w-6 h-6 text-stakeados-primary" />
              ) : (
                <XCircle className="w-6 h-6 text-stakeados-red" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-stakeados-gray-400" />
                <span className="font-semibold text-white">
                  Contract Interactions
                </span>
              </div>
              <div className="text-sm text-stakeados-gray-300">
                Required: {txRequirement.required} transactions
              </div>
              <div className="text-sm">
                Current:
                <span
                  className={
                    txRequirement.met
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-red'
                  }
                >
                  {txRequirement.current} transactions
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Overall Status */}
        <div
          className={`p-4 rounded-gaming border-2 ${
            isEligible && !hasCitizenship
              ? 'bg-stakeados-primary/10 border-stakeados-primary'
              : 'bg-stakeados-gray-800 border-stakeados-gray-600'
          }`}
        >
          <div className="flex items-center gap-3">
            {isEligible && !hasCitizenship ? (
              <CheckCircle className="w-6 h-6 text-stakeados-primary" />
            ) : hasCitizenship ? (
              <CheckCircle className="w-6 h-6 text-stakeados-primary" />
            ) : (
              <XCircle className="w-6 h-6 text-stakeados-gray-400" />
            )}
            <div>
              <div
                className={`font-semibold ${
                  (isEligible && !hasCitizenship) || hasCitizenship
                    ? 'text-stakeados-primary'
                    : 'text-stakeados-gray-300'
                }`}
              >
                {hasCitizenship
                  ? 'Citizenship Active'
                  : isEligible
                    ? 'Eligible for Citizenship NFT'
                    : 'Not Yet Eligible'}
              </div>
              <div className="text-sm text-stakeados-gray-400">
                {hasCitizenship
                  ? 'You are already a citizen'
                  : isEligible
                    ? 'You meet all requirements!'
                    : 'Complete the requirements above to become eligible'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEligible && !hasCitizenship && (
        <div className="mt-6">
          <button className="btn-primary w-full">Claim Citizenship NFT</button>
        </div>
      )}
    </div>
  );
}
