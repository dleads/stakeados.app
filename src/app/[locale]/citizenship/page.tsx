'use client';

import React, { useState } from 'react';
import CitizenshipEligibilityChecker from '@/components/citizenship/CitizenshipEligibilityChecker';
import CitizenshipProgressVisualization from '@/components/citizenship/CitizenshipProgressVisualization';
import CitizenshipTierSystem from '@/components/citizenship/CitizenshipTierSystem';
import { Award, Target, Shield, TrendingUp, Users, Star } from 'lucide-react';

export default function CitizenshipPage() {
  const [activeTab, setActiveTab] = useState<
    'eligibility' | 'progress' | 'tiers'
  >('eligibility');

  return (
    <div className="min-h-screen bg-gradient-gaming py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Award className="w-12 h-12 text-stakeados-primary" />
              <h1 className="text-4xl md:text-6xl font-bold text-neon">
                Citizenship NFT
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-stakeados-gray-300 max-w-3xl mx-auto leading-relaxed">
              Earn your place in the Stakeados community through learning,
              participation, and Web3 engagement
            </p>
          </div>

          {/* Benefits Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card-highlight">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold text-stakeados-primary mb-3">
                Governance Rights
              </h3>
              <p className="text-stakeados-gray-300">
                Participate in platform governance and help shape the future of
                Stakeados through voting and proposals.
              </p>
            </div>

            <div className="card-highlight">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-stakeados-blue mb-3">
                Exclusive Access
              </h3>
              <p className="text-stakeados-gray-300">
                Access premium courses, advanced features, and citizen-only
                content that enhances your learning journey.
              </p>
            </div>

            <div className="card-highlight">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-stakeados-yellow mb-3">
                Revenue Sharing
              </h3>
              <p className="text-stakeados-gray-300">
                Eligible for future revenue sharing programs and economic
                benefits as the platform grows and succeeds.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="card-primary text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-stakeados-primary" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">250+</div>
              <div className="text-sm text-stakeados-gray-300">Citizens</div>
            </div>

            <div className="card-primary text-center">
              <div className="flex items-center justify-center mb-3">
                <Target className="w-8 h-8 text-stakeados-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">100</div>
              <div className="text-sm text-stakeados-gray-300">
                Points Required
              </div>
            </div>

            <div className="card-primary text-center">
              <div className="flex items-center justify-center mb-3">
                <Shield className="w-8 h-8 text-stakeados-yellow" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">4</div>
              <div className="text-sm text-stakeados-gray-300">Tier Levels</div>
            </div>

            <div className="card-primary text-center">
              <div className="flex items-center justify-center mb-3">
                <Star className="w-8 h-8 text-stakeados-purple" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">∞</div>
              <div className="text-sm text-stakeados-gray-300">
                Lifetime Access
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab('eligibility')}
              className={`px-6 py-3 rounded-gaming font-medium transition-colors ${
                activeTab === 'eligibility'
                  ? 'bg-stakeados-primary text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <Award className="w-4 h-4 mr-2 inline" />
              Eligibility Check
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-3 rounded-gaming font-medium transition-colors ${
                activeTab === 'progress'
                  ? 'bg-stakeados-blue text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              Progress Tracker
            </button>
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-6 py-3 rounded-gaming font-medium transition-colors ${
                activeTab === 'tiers'
                  ? 'bg-stakeados-purple text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <Shield className="w-4 h-4 mr-2 inline" />
              Tier System
            </button>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'eligibility' && (
                <CitizenshipEligibilityChecker showMintButton={true} />
              )}

              {activeTab === 'progress' && (
                <CitizenshipProgressVisualization showDetails={true} />
              )}

              {activeTab === 'tiers' && (
                <CitizenshipTierSystem showCurrentTier={true} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Progress */}
              {activeTab !== 'progress' && (
                <CitizenshipProgressVisualization showDetails={false} />
              )}

              {/* Requirements Summary */}
              <div className="card-gaming">
                <h3 className="text-lg font-bold text-neon mb-4">
                  Requirements Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-stakeados-gray-300">
                      Community Points:
                    </span>
                    <span className="text-stakeados-primary font-semibold">
                      100+
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stakeados-gray-300">
                      ETH Balance:
                    </span>
                    <span className="text-stakeados-blue font-semibold">
                      0.001 ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stakeados-gray-300">
                      Transactions:
                    </span>
                    <span className="text-stakeados-yellow font-semibold">
                      2+
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stakeados-gray-300">Courses:</span>
                    <span className="text-stakeados-purple font-semibold">
                      1+
                    </span>
                  </div>
                </div>
              </div>

              {/* How to Earn Points */}
              <div className="card-gaming">
                <h3 className="text-lg font-bold text-neon mb-4">
                  How to Earn Points
                </h3>
                <div className="space-y-2 text-sm text-stakeados-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Complete Profile:</span>
                    <span className="text-stakeados-primary">+5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Basic Course:</span>
                    <span className="text-stakeados-primary">+5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Intermediate Course:</span>
                    <span className="text-stakeados-blue">+10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Advanced Course:</span>
                    <span className="text-stakeados-purple">+15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Published Article:</span>
                    <span className="text-stakeados-yellow">+5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Genesis Claim:</span>
                    <span className="text-stakeados-orange">+30</span>
                  </div>
                </div>
              </div>

              {/* Citizenship Benefits */}
              <div className="card-gaming">
                <h3 className="text-lg font-bold text-neon mb-4">
                  Citizenship Benefits
                </h3>
                <ul className="space-y-2 text-sm text-stakeados-gray-300">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-stakeados-primary" />
                    Governance participation
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stakeados-blue" />
                    Exclusive content access
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-stakeados-yellow" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-stakeados-purple" />
                    Revenue sharing eligibility
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
