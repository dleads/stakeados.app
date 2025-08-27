'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/components/auth/AuthProvider';
import GenesisClaimInterface from '@/components/genesis/GenesisClaimInterface';
import GenesisHallOfFame from '@/components/genesis/GenesisHallOfFame';
import GenesisEarlyAccess from '@/components/genesis/GenesisEarlyAccess';
import GenesisBadgeSystem from '@/components/genesis/GenesisBadgeSystem';
import { Crown, Star, Zap, Award, Users, Shield } from 'lucide-react';

export default function GenesisPage() {
  const t = useTranslations();
  const { isGenesisHolder, isAuthenticated } = useAuthContext();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'claim' | 'hall-of-fame' | 'early-access' | 'badges'
  >('overview');

  return (
    <div className="min-h-screen bg-gradient-gaming py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Crown className="w-12 h-12 text-stakeados-yellow" />
              <h1 className="text-4xl md:text-6xl font-bold text-neon">
                {t('genesis.title')}
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-stakeados-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('genesis.subtitle')}
            </p>
          </div>

          {/* Genesis Benefits Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card-highlight">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-stakeados-yellow mb-3">
                Founder Status
              </h3>
              <p className="text-stakeados-gray-300">
                Permanent recognition as a founding member with exclusive
                Genesis badge and privileges throughout the platform.
              </p>
            </div>

            <div className="card-highlight">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-stakeados-primary mb-3">
                Early Access
              </h3>
              <p className="text-stakeados-gray-300">
                Get first access to new features, courses, and content.
                Experience innovations before they're available to the general
                community.
              </p>
            </div>

            <div className="card-highlight">
              <div className="text-4xl mb-4">🎖️</div>
              <h3 className="text-xl font-bold text-stakeados-blue mb-3">
                Exclusive Benefits
              </h3>
              <p className="text-stakeados-gray-300">
                Access to Genesis-only content, priority support, governance
                participation, and future revenue sharing opportunities.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-gaming font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-stakeados-primary text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <Crown className="w-4 h-4 mr-2 inline" />
              Overview
            </button>

            {!isGenesisHolder && (
              <button
                onClick={() => setActiveTab('claim')}
                className={`px-4 py-2 rounded-gaming font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'claim'
                    ? 'bg-stakeados-yellow text-stakeados-dark'
                    : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
                }`}
              >
                <Star className="w-4 h-4 mr-2 inline" />
                Claim Status
              </button>
            )}

            <button
              onClick={() => setActiveTab('hall-of-fame')}
              className={`px-4 py-2 rounded-gaming font-medium transition-colors whitespace-nowrap ${
                activeTab === 'hall-of-fame'
                  ? 'bg-stakeados-purple text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <Users className="w-4 h-4 mr-2 inline" />
              Hall of Fame
            </button>

            <button
              onClick={() => setActiveTab('early-access')}
              className={`px-4 py-2 rounded-gaming font-medium transition-colors whitespace-nowrap ${
                activeTab === 'early-access'
                  ? 'bg-stakeados-blue text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <Zap className="w-4 h-4 mr-2 inline" />
              Early Access
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`px-4 py-2 rounded-gaming font-medium transition-colors whitespace-nowrap ${
                activeTab === 'badges'
                  ? 'bg-stakeados-orange text-stakeados-dark'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-300 hover:bg-stakeados-gray-600'
              }`}
            >
              <Award className="w-4 h-4 mr-2 inline" />
              Badges
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Genesis Story */}
              <div className="card-gaming">
                <h2 className="text-2xl font-bold text-neon mb-6">
                  The Genesis Story
                </h2>
                <div className="">
                  <p className="text-stakeados-gray-300 mb-4">
                    The Genesis community represents the visionary individuals
                    who believed in Stakeados' mission from the very beginning.
                    These pioneers didn't just join a platform—they helped
                    create it, shape it, and guide its evolution into the
                    premier Web3 educational ecosystem it is today.
                  </p>

                  <p className="text-stakeados-gray-300 mb-6">
                    Genesis holders are more than early adopters; they are the
                    foundation upon which Stakeados was built. Their feedback,
                    contributions, and unwavering support have been instrumental
                    in creating a platform that truly serves the Web3 learning
                    community.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-stakeados-primary font-semibold mb-3">
                        Genesis Contributions
                      </h3>
                      <ul className="space-y-2 text-stakeados-gray-300">
                        <li>• Platform vision and concept development</li>
                        <li>• Early user feedback and feature requests</li>
                        <li>• Community building and growth initiatives</li>
                        <li>• Educational content creation and curation</li>
                        <li>• Technical testing and quality assurance</li>
                        <li>• Marketing and outreach efforts</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-stakeados-primary font-semibold mb-3">
                        Ongoing Legacy
                      </h3>
                      <ul className="space-y-2 text-stakeados-gray-300">
                        <li>• Permanent founder recognition</li>
                        <li>• Lifetime access to exclusive features</li>
                        <li>• Governance participation rights</li>
                        <li>• Revenue sharing opportunities</li>
                        <li>• Priority access to partnerships</li>
                        <li>• Mentorship and leadership roles</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              {isAuthenticated && (
                <div className="card-gaming">
                  <h2 className="text-2xl font-bold text-neon mb-6">
                    Your Genesis Status
                  </h2>
                  {isGenesisHolder ? (
                    <div className="p-6 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
                      <div className="flex items-center gap-4 mb-4">
                        <Crown className="w-12 h-12 text-stakeados-yellow" />
                        <div>
                          <h3 className="text-2xl font-bold text-stakeados-yellow">
                            Genesis Founder
                          </h3>
                          <p className="text-stakeados-gray-300">
                            You are a verified founding member
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                          <Star className="w-6 h-6 text-stakeados-primary mx-auto mb-2" />
                          <div className="font-semibold text-white">
                            Early Access
                          </div>
                          <div className="text-xs text-stakeados-gray-400">
                            Active
                          </div>
                        </div>
                        <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                          <Shield className="w-6 h-6 text-stakeados-blue mx-auto mb-2" />
                          <div className="font-semibold text-white">
                            Exclusive Content
                          </div>
                          <div className="text-xs text-stakeados-gray-400">
                            Unlocked
                          </div>
                        </div>
                        <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                          <Award className="w-6 h-6 text-stakeados-purple mx-auto mb-2" />
                          <div className="font-semibold text-white">
                            Special Recognition
                          </div>
                          <div className="text-xs text-stakeados-gray-400">
                            Permanent
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-stakeados-gray-800 rounded-gaming">
                      <div className="text-center">
                        <Crown className="w-12 h-12 text-stakeados-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-stakeados-gray-300 mb-2">
                          Not a Genesis Member
                        </h3>
                        <p className="text-stakeados-gray-400 mb-6">
                          Genesis status is exclusive to holders of Genesis NFTs
                        </p>
                        <button
                          onClick={() => setActiveTab('claim')}
                          className="btn-primary"
                        >
                          Check Eligibility
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Community Impact */}
              <div className="card-gaming">
                <h2 className="text-2xl font-bold text-neon mb-6">
                  Community Impact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-stakeados-primary mb-2">
                      50+
                    </div>
                    <div className="text-stakeados-gray-300">
                      Genesis Founders
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-stakeados-blue mb-2">
                      1000+
                    </div>
                    <div className="text-stakeados-gray-300">
                      Community Members
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-stakeados-yellow mb-2">
                      25+
                    </div>
                    <div className="text-stakeados-gray-300">
                      Features Suggested
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-stakeados-purple mb-2">
                      100+
                    </div>
                    <div className="text-stakeados-gray-300">
                      Hours of Content
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'claim' && <GenesisClaimInterface />}

          {activeTab === 'hall-of-fame' && (
            <GenesisHallOfFame showStats={true} />
          )}

          {activeTab === 'early-access' && <GenesisEarlyAccess />}

          {activeTab === 'badges' && <GenesisBadgeSystem showProgress={true} />}
        </div>
      </div>
    </div>
  );
}
