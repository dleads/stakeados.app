'use client';

import React from 'react';
import { useCitizenshipEligibility } from '@/hooks/useCitizenshipEligibility';
import {
  Award,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface CitizenshipProgressVisualizationProps {
  className?: string;
  showDetails?: boolean;
}

export default function CitizenshipProgressVisualization({
  className = '',
  showDetails = true,
}: CitizenshipProgressVisualizationProps) {
  const {
    requirements,
    overallProgress,
    isEligible,
    hasCitizenship,
    getNextMilestone,
    isAuthenticated,
    isConnected,
  } = useCitizenshipEligibility();

  const nextMilestone = getNextMilestone();

  if (!isAuthenticated || !isConnected) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stakeados-gray-300 mb-2">
            Connect to View Progress
          </h3>
          <p className="text-stakeados-gray-400">
            Sign in and connect your wallet to track citizenship progress
          </p>
        </div>
      </div>
    );
  }

  if (hasCitizenship) {
    return (
      <div className={`card-highlight ${className}`}>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-stakeados-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-stakeados-dark" />
          </div>
          <h3 className="text-xl font-bold text-stakeados-primary mb-2">
            Citizenship Achieved!
          </h3>
          <p className="text-stakeados-gray-300">
            You are now a verified citizen of Stakeados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-gaming ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-stakeados-primary" />
        <div>
          <h3 className="text-xl font-bold text-neon">Citizenship Progress</h3>
          <p className="text-stakeados-gray-300">
            Track your path to citizenship
          </p>
        </div>
      </div>

      {/* Overall Progress Circle */}
      <div className="text-center mb-8">
        <div className="relative w-32 h-32 mx-auto mb-4">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-stakeados-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallProgress / 100)}`}
              className={`transition-all duration-1000 ${
                isEligible ? 'text-stakeados-primary' : 'text-stakeados-blue'
              }`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  isEligible ? 'text-stakeados-primary' : 'text-white'
                }`}
              >
                {Math.round(overallProgress)}%
              </div>
              <div className="text-xs text-stakeados-gray-400">Complete</div>
            </div>
          </div>
        </div>

        <div
          className={`text-lg font-semibold ${
            isEligible ? 'text-stakeados-primary' : 'text-white'
          }`}
        >
          {isEligible
            ? 'Ready for Citizenship!'
            : 'Building Towards Citizenship'}
        </div>
      </div>

      {/* Requirements Progress */}
      {showDetails && (
        <div className="space-y-4 mb-6">
          {requirements.map(requirement => (
            <div key={requirement.id} className="flex items-center gap-4">
              <div className="text-2xl">{requirement.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white text-sm">
                    {requirement.name}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      requirement.met
                        ? 'text-stakeados-primary'
                        : 'text-stakeados-gray-400'
                    }`}
                  >
                    {Math.round(requirement.progress)}%
                  </span>
                </div>
                <div className="progress-bar h-2">
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
              {requirement.met && (
                <CheckCircle className="w-5 h-5 text-stakeados-primary" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Milestone */}
      {nextMilestone && !isEligible && (
        <div className="p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-stakeados-blue" />
            <h4 className="font-semibold text-stakeados-blue">
              Next Milestone
            </h4>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">{nextMilestone.name}</div>
              <div className="text-sm text-stakeados-gray-400">
                {nextMilestone.current} / {nextMilestone.required}
              </div>
            </div>
            <div className="text-right">
              <div className="text-stakeados-blue font-bold">
                {Math.round(nextMilestone.progress)}%
              </div>
              <div className="text-xs text-stakeados-gray-400">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Suggestions */}
      {!isEligible && (
        <div className="space-y-3">
          <h4 className="font-semibold text-stakeados-primary">
            🚀 How to Progress:
          </h4>
          <div className="space-y-2 text-sm text-stakeados-gray-300">
            {requirements
              .filter(req => !req.met)
              .map(requirement => (
                <div key={requirement.id} className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-stakeados-primary" />
                  <span>
                    {requirement.id === 'points' &&
                      'Complete courses and participate in community'}
                    {requirement.id === 'eth_balance' &&
                      'Add more ETH to your wallet'}
                    {requirement.id === 'transactions' &&
                      'Make more on-chain transactions'}
                    {requirement.id === 'courses' &&
                      'Complete your first course'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Eligibility Status */}
      <div
        className={`mt-6 p-4 rounded-gaming border ${
          isEligible
            ? 'bg-stakeados-primary/10 border-stakeados-primary'
            : 'bg-stakeados-gray-800 border-stakeados-gray-600'
        }`}
      >
        <div className="flex items-center gap-3">
          {isEligible ? (
            <Zap className="w-5 h-5 text-stakeados-primary" />
          ) : (
            <Clock className="w-5 h-5 text-stakeados-gray-400" />
          )}
          <div className="text-sm">
            <div
              className={`font-semibold ${
                isEligible
                  ? 'text-stakeados-primary'
                  : 'text-stakeados-gray-300'
              }`}
            >
              {isEligible
                ? 'Eligible for Citizenship NFT'
                : 'Keep Building Your Profile'}
            </div>
            <div className="text-stakeados-gray-400">
              {isEligible
                ? 'You can now mint your citizenship NFT!'
                : `${Math.round(100 - overallProgress)}% remaining to reach eligibility`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
