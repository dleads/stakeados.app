'use client';

import React from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  Crown,
  Star,
  Shield,
  Zap,
  Award,
  Trophy,
  Medal,
  Target,
} from 'lucide-react';

interface GenesisBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requirement: string;
  earned: boolean;
  earnedDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface GenesisBadgeSystemProps {
  className?: string;
  showProgress?: boolean;
}

export default function GenesisBadgeSystem({
  className = '',
  showProgress = true,
}: GenesisBadgeSystemProps) {
  const { isGenesisHolder, profile } = useAuthContext();

  // Mock badge data - in production this would come from user's achievements
  const genesisBadges: GenesisBadge[] = [
    {
      id: 'genesis-founder',
      name: 'Genesis Founder',
      description: 'Original founding member of the Stakeados community',
      icon: <Crown className="w-6 h-6" />,
      color: 'text-stakeados-yellow',
      requirement: 'Hold Genesis NFT',
      earned: isGenesisHolder,
      earnedDate: '2024-01-15',
      rarity: 'legendary',
    },
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      description: 'Among the first 100 users to join Stakeados',
      icon: <Star className="w-6 h-6" />,
      color: 'text-stakeados-primary',
      requirement: 'Join in first 100 users',
      earned: isGenesisHolder,
      earnedDate: '2024-01-15',
      rarity: 'epic',
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description:
        'Contributed significantly to community growth and engagement',
      icon: <Shield className="w-6 h-6" />,
      color: 'text-stakeados-blue',
      requirement: 'Help 10+ new users',
      earned: (profile?.total_points || 0) > 500,
      earnedDate: '2024-02-01',
      rarity: 'rare',
    },
    {
      id: 'content-creator',
      name: 'Content Creator',
      description: 'Created valuable educational content for the community',
      icon: <Award className="w-6 h-6" />,
      color: 'text-stakeados-purple',
      requirement: 'Publish 5+ articles',
      earned: false,
      rarity: 'rare',
    },
    {
      id: 'mentor',
      name: 'Mentor',
      description: 'Guided and mentored other community members',
      icon: <Target className="w-6 h-6" />,
      color: 'text-stakeados-orange',
      requirement: 'Mentor 5+ users',
      earned: false,
      rarity: 'epic',
    },
    {
      id: 'innovator',
      name: 'Innovator',
      description: 'Suggested features that were implemented in the platform',
      icon: <Zap className="w-6 h-6" />,
      color: 'text-stakeados-cyan',
      requirement: 'Feature suggestion accepted',
      earned: isGenesisHolder,
      earnedDate: '2024-01-20',
      rarity: 'epic',
    },
    {
      id: 'champion',
      name: 'Genesis Champion',
      description:
        'Achieved the highest level of Genesis community contribution',
      icon: <Trophy className="w-6 h-6" />,
      color: 'text-stakeados-yellow',
      requirement: 'Complete all Genesis milestones',
      earned: false,
      rarity: 'legendary',
    },
    {
      id: 'ambassador',
      name: 'Ambassador',
      description: 'Represented Stakeados in external communities and events',
      icon: <Medal className="w-6 h-6" />,
      color: 'text-stakeados-green',
      requirement: 'Represent Stakeados externally',
      earned: false,
      rarity: 'rare',
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-stakeados-yellow bg-stakeados-yellow/10';
      case 'epic':
        return 'border-stakeados-purple bg-stakeados-purple/10';
      case 'rare':
        return 'border-stakeados-blue bg-stakeados-blue/10';
      default:
        return 'border-stakeados-gray-600 bg-stakeados-gray-800';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'LEGENDARY';
      case 'epic':
        return 'EPIC';
      case 'rare':
        return 'RARE';
      default:
        return 'COMMON';
    }
  };

  const earnedBadges = genesisBadges.filter(badge => badge.earned);
  const availableBadges = genesisBadges.filter(badge => !badge.earned);

  if (!isGenesisHolder) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <Crown className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Genesis Access Required
          </h3>
          <p className="text-stakeados-gray-400">
            Badge system is exclusive to Genesis community members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Award className="w-12 h-12 text-stakeados-primary" />
          <h2 className="text-3xl font-bold text-neon">Genesis Badges</h2>
        </div>
        <p className="text-xl text-stakeados-gray-300">
          Exclusive achievements for Genesis community members
        </p>
      </div>

      {/* Progress Stats */}
      {showProgress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-primary mb-1">
              {earnedBadges.length}
            </div>
            <div className="text-sm text-stakeados-gray-300">Badges Earned</div>
          </div>
          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-yellow mb-1">
              {availableBadges.length}
            </div>
            <div className="text-sm text-stakeados-gray-300">Available</div>
          </div>
          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-purple mb-1">
              {Math.round((earnedBadges.length / genesisBadges.length) * 100)}%
            </div>
            <div className="text-sm text-stakeados-gray-300">Completion</div>
          </div>
          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-blue mb-1">
              {
                earnedBadges.filter(
                  b => b.rarity === 'legendary' || b.rarity === 'epic'
                ).length
              }
            </div>
            <div className="text-sm text-stakeados-gray-300">Rare Badges</div>
          </div>
        </div>
      )}

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="card-gaming">
          <h3 className="text-xl font-bold text-neon mb-6">
            Your Genesis Badges
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map(badge => (
              <div
                key={badge.id}
                className={`p-4 rounded-gaming border-2 ${getRarityColor(badge.rarity)} relative overflow-hidden`}
              >
                {/* Rarity indicator */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      badge.rarity === 'legendary'
                        ? 'bg-stakeados-yellow text-stakeados-dark'
                        : badge.rarity === 'epic'
                          ? 'bg-stakeados-purple text-white'
                          : badge.rarity === 'rare'
                            ? 'bg-stakeados-blue text-white'
                            : 'bg-stakeados-gray-600 text-stakeados-gray-300'
                    }`}
                  >
                    {getRarityText(badge.rarity)}
                  </span>
                </div>

                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${badge.color} bg-current/20`}
                  >
                    {badge.icon}
                  </div>

                  <h4 className="font-bold text-white mb-2">{badge.name}</h4>
                  <p className="text-stakeados-gray-300 text-sm mb-3">
                    {badge.description}
                  </p>

                  {badge.earnedDate && (
                    <div className="text-xs text-stakeados-gray-400">
                      Earned on{' '}
                      {new Date(badge.earnedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Shine effect for legendary badges */}
                {badge.rarity === 'legendary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Badges */}
      {availableBadges.length > 0 && (
        <div className="card-gaming">
          <h3 className="text-xl font-bold text-neon mb-6">Available Badges</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBadges.map(badge => (
              <div
                key={badge.id}
                className="p-4 bg-stakeados-gray-800 rounded-gaming border border-stakeados-gray-600 opacity-60 hover:opacity-80 transition-opacity"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-stakeados-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-stakeados-gray-500">{badge.icon}</div>
                  </div>

                  <h4 className="font-bold text-stakeados-gray-300 mb-2">
                    {badge.name}
                  </h4>
                  <p className="text-stakeados-gray-400 text-sm mb-3">
                    {badge.description}
                  </p>

                  <div className="p-2 bg-stakeados-gray-700 rounded text-xs text-stakeados-gray-300">
                    <strong>Requirement:</strong> {badge.requirement}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded bg-stakeados-gray-700 text-stakeados-gray-400`}
                    >
                      {getRarityText(badge.rarity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge Categories */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-6">Badge Categories</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Community Badges
            </h4>
            <ul className="space-y-2 text-stakeados-gray-300 text-sm">
              <li>• Genesis Founder - Original community member</li>
              <li>• Community Builder - Helped grow the community</li>
              <li>• Mentor - Guided other members</li>
              <li>• Ambassador - Represented Stakeados externally</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stakeados-primary mb-3">
              Achievement Badges
            </h4>
            <ul className="space-y-2 text-stakeados-gray-300 text-sm">
              <li>• Early Adopter - First 100 users</li>
              <li>• Content Creator - Published valuable content</li>
              <li>• Innovator - Contributed feature ideas</li>
              <li>• Champion - Highest level achievement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rarity System */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-6">Rarity System</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-2xl mb-2">🥉</div>
            <div className="font-semibold text-stakeados-gray-300">Common</div>
            <div className="text-xs text-stakeados-gray-400">Easy to earn</div>
          </div>
          <div className="text-center p-4 bg-stakeados-blue/10 border border-stakeados-blue/30 rounded-gaming">
            <div className="text-2xl mb-2">🥈</div>
            <div className="font-semibold text-stakeados-blue">Rare</div>
            <div className="text-xs text-stakeados-gray-400">
              Requires effort
            </div>
          </div>
          <div className="text-center p-4 bg-stakeados-purple/10 border border-stakeados-purple/30 rounded-gaming">
            <div className="text-2xl mb-2">🥇</div>
            <div className="font-semibold text-stakeados-purple">Epic</div>
            <div className="text-xs text-stakeados-gray-400">
              Significant achievement
            </div>
          </div>
          <div className="text-center p-4 bg-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
            <div className="text-2xl mb-2">💎</div>
            <div className="font-semibold text-stakeados-yellow">Legendary</div>
            <div className="text-xs text-stakeados-gray-400">
              Extremely rare
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
