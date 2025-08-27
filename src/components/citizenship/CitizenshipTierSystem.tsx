'use client';

import React from 'react';
import { useCitizenshipEligibility } from '@/hooks/useCitizenshipEligibility';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Crown, Star, Award, Medal, Shield, Zap } from 'lucide-react';

interface CitizenshipTier {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  requirements: {
    points: number;
    web3Score: number;
    isGenesis?: boolean;
  };
  benefits: string[];
}

interface CitizenshipTierSystemProps {
  className?: string;
  showCurrentTier?: boolean;
}

export default function CitizenshipTierSystem({
  className = '',
  showCurrentTier = true,
}: CitizenshipTierSystemProps) {
  const { profile, isGenesisHolder } = useAuthContext();
  const { citizenship, hasCitizenship, transactionCount } =
    useCitizenshipEligibility();

  const tiers: CitizenshipTier[] = [
    {
      id: 'bronze',
      name: 'Bronze Citizen',
      description: 'Entry-level citizenship with basic community access',
      icon: <Medal className="w-8 h-8" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30',
      requirements: {
        points: 100,
        web3Score: 50,
      },
      benefits: [
        'Community forum access',
        'Basic course certificates',
        'Standard support',
        'Monthly newsletter',
      ],
    },
    {
      id: 'silver',
      name: 'Silver Citizen',
      description: 'Intermediate citizenship with enhanced privileges',
      icon: <Award className="w-8 h-8" />,
      color: 'text-gray-300',
      bgColor: 'bg-gray-300/10',
      borderColor: 'border-gray-300/30',
      requirements: {
        points: 250,
        web3Score: 100,
      },
      benefits: [
        'All Bronze benefits',
        'Priority course access',
        'Advanced certificates',
        'Community events access',
        'Enhanced support',
      ],
    },
    {
      id: 'gold',
      name: 'Gold Citizen',
      description:
        'Advanced citizenship with premium access and governance rights',
      icon: <Star className="w-8 h-8" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/30',
      requirements: {
        points: 500,
        web3Score: 150,
      },
      benefits: [
        'All Silver benefits',
        'Governance voting rights',
        'Premium course access',
        'Revenue sharing eligibility',
        'VIP support',
        'Beta feature access',
      ],
    },
    {
      id: 'genesis',
      name: 'Genesis Citizen',
      description:
        'Exclusive tier for founding members with maximum privileges',
      icon: <Crown className="w-8 h-8" />,
      color: 'text-stakeados-primary',
      bgColor: 'bg-stakeados-primary/10',
      borderColor: 'border-stakeados-primary/30',
      requirements: {
        points: 0,
        web3Score: 0,
        isGenesis: true,
      },
      benefits: [
        'All Gold benefits',
        'Founder recognition',
        'Maximum governance power',
        'Exclusive Genesis content',
        'Early access to everything',
        'Special revenue sharing',
        'Lifetime privileges',
      ],
    },
  ];

  const getCurrentTier = () => {
    if (!hasCitizenship || !citizenship) return null;
    return tiers.find(tier => tier.id === citizenship.data.tier);
  };

  const getPotentialTier = () => {
    const currentPoints = profile?.total_points || 0;
    const web3Score = transactionCount * 20; // Simplified calculation

    if (isGenesisHolder) return tiers.find(t => t.id === 'genesis');
    if (currentPoints >= 500 && web3Score >= 150)
      return tiers.find(t => t.id === 'gold');
    if (currentPoints >= 250 && web3Score >= 100)
      return tiers.find(t => t.id === 'silver');
    return tiers.find(t => t.id === 'bronze');
  };

  const currentTier = getCurrentTier();
  const potentialTier = getPotentialTier();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-stakeados-blue" />
          <h2 className="text-2xl font-bold text-neon">Citizenship Tiers</h2>
        </div>
        <p className="text-stakeados-gray-300">
          Different levels of citizenship with increasing benefits and
          privileges
        </p>
      </div>

      {/* Current Tier Display */}
      {showCurrentTier && hasCitizenship && currentTier && (
        <div className={`card-highlight border-2 ${currentTier.borderColor}`}>
          <div className="text-center py-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${currentTier.bgColor}`}
            >
              <div className={currentTier.color}>{currentTier.icon}</div>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${currentTier.color}`}>
              Your Current Tier: {currentTier.name}
            </h3>
            <p className="text-stakeados-gray-300 mb-4">
              {currentTier.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-semibold text-stakeados-primary">
                  {citizenship.data.pointsAtMint}
                </div>
                <div className="text-xs text-stakeados-gray-400">
                  Points at Mint
                </div>
              </div>
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-semibold text-stakeados-blue">
                  {citizenship.data.web3Score}
                </div>
                <div className="text-xs text-stakeados-gray-400">
                  Web3 Score
                </div>
              </div>
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-semibold text-stakeados-yellow">
                  #{citizenship.tokenId}
                </div>
                <div className="text-xs text-stakeados-gray-400">Token ID</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Potential Tier (if not citizen yet) */}
      {!hasCitizenship && potentialTier && (
        <div className={`card-gaming border-2 ${potentialTier.borderColor}`}>
          <div className="text-center py-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${potentialTier.bgColor}`}
            >
              <div className={potentialTier.color}>{potentialTier.icon}</div>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${potentialTier.color}`}>
              Your Potential Tier: {potentialTier.name}
            </h3>
            <p className="text-stakeados-gray-300 mb-4">
              Based on your current progress, you would receive this tier
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-semibold text-stakeados-primary">
                  {profile?.total_points || 0}
                </div>
                <div className="text-xs text-stakeados-gray-400">
                  Current Points
                </div>
              </div>
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-semibold text-stakeados-blue">
                  {transactionCount * 20}
                </div>
                <div className="text-xs text-stakeados-gray-400">
                  Web3 Score
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiers.map(tier => {
          const isCurrent = currentTier?.id === tier.id;
          const isPotential = potentialTier?.id === tier.id && !hasCitizenship;

          return (
            <div
              key={tier.id}
              className={`card-primary border-2 transition-all ${
                isCurrent
                  ? `${tier.borderColor} shadow-glow`
                  : isPotential
                    ? `${tier.borderColor}`
                    : 'border-stakeados-gray-600'
              }`}
            >
              <div className="text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isCurrent || isPotential
                      ? tier.bgColor
                      : 'bg-stakeados-gray-700'
                  }`}
                >
                  <div
                    className={
                      isCurrent || isPotential
                        ? tier.color
                        : 'text-stakeados-gray-400'
                    }
                  >
                    {tier.icon}
                  </div>
                </div>

                <h3
                  className={`text-xl font-bold mb-2 ${
                    isCurrent || isPotential
                      ? tier.color
                      : 'text-stakeados-gray-300'
                  }`}
                >
                  {tier.name}
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-stakeados-primary text-stakeados-dark px-2 py-1 rounded">
                      CURRENT
                    </span>
                  )}
                  {isPotential && (
                    <span className="ml-2 text-xs bg-stakeados-blue text-white px-2 py-1 rounded">
                      POTENTIAL
                    </span>
                  )}
                </h3>

                <p className="text-stakeados-gray-400 text-sm mb-4">
                  {tier.description}
                </p>

                {/* Requirements */}
                <div className="mb-4 p-3 bg-stakeados-gray-800 rounded-gaming">
                  <h4 className="font-semibold text-stakeados-primary mb-2 text-sm">
                    Requirements:
                  </h4>
                  <div className="text-xs text-stakeados-gray-300 space-y-1">
                    {tier.requirements.isGenesis ? (
                      <div>Genesis NFT holder</div>
                    ) : (
                      <>
                        <div>{tier.requirements.points}+ points</div>
                        <div>{tier.requirements.web3Score}+ Web3 score</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className="text-left">
                  <h4 className="font-semibold text-stakeados-primary mb-2 text-sm">
                    Benefits:
                  </h4>
                  <ul className="text-xs text-stakeados-gray-300 space-y-1">
                    {tier.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-stakeados-primary flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier Progression Info */}
      <div className="card-gaming">
        <h3 className="text-lg font-bold text-neon mb-4">Tier Progression</h3>
        <div className="">
          <p className="text-stakeados-gray-300 mb-4">
            Citizenship tiers are determined at the time of minting based on
            your points and Web3 activity. Higher tiers unlock additional
            benefits and governance rights within the Stakeados ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-stakeados-primary font-semibold mb-3">
                How Tiers Work
              </h4>
              <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                <li>• Tiers are assigned at citizenship minting</li>
                <li>• Based on points earned and Web3 activity</li>
                <li>• Genesis holders get automatic Genesis tier</li>
                <li>• Tiers can be upgraded in future updates</li>
                <li>• Each tier unlocks cumulative benefits</li>
              </ul>
            </div>

            <div>
              <h4 className="text-stakeados-primary font-semibold mb-3">
                Web3 Score Calculation
              </h4>
              <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                <li>• ETH balance contribution</li>
                <li>• Transaction count multiplier</li>
                <li>• Contract interaction history</li>
                <li>• DeFi protocol usage</li>
                <li>• NFT collection activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
