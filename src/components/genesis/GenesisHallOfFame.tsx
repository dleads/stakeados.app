'use client';

import React, { useState } from 'react';

import UserAvatar from '@/components/ui/UserAvatar';
import BaseNameDisplay from '@/components/web3/BaseNameDisplay';
import { formatDate } from '@/lib/utils';
import {
  Crown,
  Star,
  Trophy,
  Medal,
  Calendar,
  Users,
  TrendingUp,
  Award,
} from 'lucide-react';
import type { Address } from 'viem';

interface GenesisFounder {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  walletAddress?: Address;
  joinedDate: string;
  totalPoints: number;
  contributionScore: number;
  specialties: string[];
  achievements: string[];
  rank: number;
  isActive: boolean;
}

interface GenesisHallOfFameProps {
  className?: string;
  maxFounders?: number;
  showStats?: boolean;
}

export default function GenesisHallOfFame({
  className = '',
  maxFounders = 20,
  showStats = true,
}: GenesisHallOfFameProps) {
  const [sortBy, setSortBy] = useState<
    'rank' | 'points' | 'date' | 'contribution'
  >('rank');
  const [filterActive, setFilterActive] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  // Mock Genesis founders data - in production this would come from Supabase
  const [founders] = useState<GenesisFounder[]>([
    {
      id: '1',
      displayName: 'Alex Chen',
      username: 'alexchen',
      avatarUrl: undefined,
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1' as Address,
      joinedDate: '2024-01-15',
      totalPoints: 2500,
      contributionScore: 95,
      specialties: ['Smart Contracts', 'DeFi', 'Education'],
      achievements: ['First Article', 'Course Creator', 'Community Leader'],
      rank: 1,
      isActive: true,
    },
    {
      id: '2',
      displayName: 'Maria Rodriguez',
      username: 'mariarodriguez',
      avatarUrl: undefined,
      walletAddress: '0x8ba1f109551bD432803012645Hac136c5c8b4d8b' as Address,
      joinedDate: '2024-01-16',
      totalPoints: 2200,
      contributionScore: 88,
      specialties: ['NFTs', 'Base Network', 'Community'],
      achievements: ['Genesis Holder', 'Top Contributor', 'Mentor'],
      rank: 2,
      isActive: true,
    },
    {
      id: '3',
      displayName: 'David Kim',
      username: 'davidkim',
      avatarUrl: undefined,
      walletAddress: '0x123456789abcdef123456789abcdef123456789a' as Address,
      joinedDate: '2024-01-17',
      totalPoints: 1950,
      contributionScore: 82,
      specialties: ['Web3 Development', 'Account Abstraction'],
      achievements: ['Technical Expert', 'Code Contributor'],
      rank: 3,
      isActive: true,
    },
    {
      id: '4',
      displayName: 'Sarah Johnson',
      username: 'sarahjohnson',
      avatarUrl: undefined,
      joinedDate: '2024-01-20',
      totalPoints: 1800,
      contributionScore: 79,
      specialties: ['Education', 'Content Creation'],
      achievements: ['Educator', 'Content Creator'],
      rank: 4,
      isActive: false,
    },
    {
      id: '5',
      displayName: 'Carlos Mendez',
      username: 'carlosmendez',
      avatarUrl: undefined,
      joinedDate: '2024-01-22',
      totalPoints: 1650,
      contributionScore: 75,
      specialties: ['Trading', 'Market Analysis'],
      achievements: ['Market Analyst', 'Community Member'],
      rank: 5,
      isActive: true,
    },
  ]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-stakeados-yellow" />;
      case 2:
        return <Medal className="w-6 h-6 text-stakeados-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-stakeados-orange" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-stakeados-gray-400 font-bold">
            #{rank}
          </span>
        );
    }
  };

  const getContributionColor = (score: number) => {
    if (score >= 90) return 'text-stakeados-primary';
    if (score >= 80) return 'text-stakeados-blue';
    if (score >= 70) return 'text-stakeados-yellow';
    return 'text-stakeados-orange';
  };

  const filteredFounders = founders
    .filter(founder => {
      if (filterActive === 'active') return founder.isActive;
      if (filterActive === 'inactive') return !founder.isActive;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.totalPoints - a.totalPoints;
        case 'date':
          return (
            new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime()
          );
        case 'contribution':
          return b.contributionScore - a.contributionScore;
        default:
          return a.rank - b.rank;
      }
    })
    .slice(0, maxFounders);

  const totalFounders = founders.length;
  const activeFounders = founders.filter(f => f.isActive).length;
  const totalPoints = founders.reduce((sum, f) => sum + f.totalPoints, 0);
  const avgContribution =
    founders.reduce((sum, f) => sum + f.contributionScore, 0) / founders.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="w-12 h-12 text-stakeados-yellow" />
          <h2 className="text-3xl font-bold text-neon">Genesis Hall of Fame</h2>
        </div>
        <p className="text-xl text-stakeados-gray-300">
          Honoring the founding members who built Stakeados from the ground up
        </p>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-primary text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-stakeados-primary" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {totalFounders}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Total Founders
            </div>
          </div>

          <div className="card-primary text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-stakeados-blue" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {activeFounders}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Active Members
            </div>
          </div>

          <div className="card-primary text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-stakeados-yellow" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {totalPoints.toLocaleString()}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Combined Points
            </div>
          </div>

          <div className="card-primary text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-stakeados-purple" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(avgContribution)}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Avg Contribution
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Founders Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredFounders.slice(0, 3).map(founder => (
          <div key={founder.id} className="card-highlight text-center">
            <div className="flex justify-center mb-4">
              {getRankIcon(founder.rank)}
            </div>

            <UserAvatar
              address={founder.walletAddress}
              profileAvatarUrl={founder.avatarUrl}
              displayName={founder.displayName}
              size="xl"
              className="mx-auto mb-4"
            />

            <h3 className="text-lg font-bold text-white mb-1">
              {founder.displayName}
            </h3>

            {founder.walletAddress && (
              <BaseNameDisplay
                address={founder.walletAddress}
                showIcon={true}
                className="mb-2"
              />
            )}

            <div className="text-sm text-stakeados-yellow font-semibold mb-3">
              Genesis Founder #{founder.rank}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-stakeados-primary">
                  {founder.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-stakeados-gray-300">Points</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-xl font-bold ${getContributionColor(founder.contributionScore)}`}
                >
                  {founder.contributionScore}
                </div>
                <div className="text-xs text-stakeados-gray-300">
                  Contribution
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 justify-center mb-4">
              {founder.specialties.slice(0, 2).map(specialty => (
                <span
                  key={specialty}
                  className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 rounded text-xs"
                >
                  {specialty}
                </span>
              ))}
            </div>

            <div
              className={`text-xs px-2 py-1 rounded ${
                founder.isActive
                  ? 'bg-stakeados-primary/20 text-stakeados-primary'
                  : 'bg-stakeados-gray-700 text-stakeados-gray-400'
              }`}
            >
              {founder.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="card-gaming">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-neon">All Genesis Founders</h3>

          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-3 py-2 text-sm"
            >
              <option value="rank">Sort by Rank</option>
              <option value="points">Sort by Points</option>
              <option value="date">Sort by Join Date</option>
              <option value="contribution">Sort by Contribution</option>
            </select>

            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value as any)}
              className="bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-3 py-2 text-sm"
            >
              <option value="all">All Members</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Founders List */}
        <div className="space-y-3">
          {filteredFounders.map(founder => (
            <div
              key={founder.id}
              className="flex items-center gap-4 p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                {founder.rank <= 3 ? (
                  getRankIcon(founder.rank)
                ) : (
                  <span className="text-stakeados-gray-400 font-bold">
                    #{founder.rank}
                  </span>
                )}
              </div>

              {/* Avatar & Info */}
              <div className="flex items-center gap-3 flex-1">
                <UserAvatar
                  address={founder.walletAddress}
                  profileAvatarUrl={founder.avatarUrl}
                  displayName={founder.displayName}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {founder.displayName}
                    </span>
                    <Crown className="w-4 h-4 text-stakeados-yellow" />
                    {!founder.isActive && (
                      <span className="text-xs text-stakeados-gray-500">
                        (Inactive)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-stakeados-gray-400">
                    Joined {formatDate(founder.joinedDate)}
                  </div>
                  {founder.walletAddress && (
                    <BaseNameDisplay
                      address={founder.walletAddress}
                      showIcon={false}
                      className="text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Specialties */}
              <div className="hidden md:flex flex-wrap gap-1">
                {founder.specialties.slice(0, 2).map(specialty => (
                  <span
                    key={specialty}
                    className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 rounded text-xs"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-stakeados-primary">
                    {founder.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-stakeados-gray-400 text-xs">Points</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-bold ${getContributionColor(founder.contributionScore)}`}
                  >
                    {founder.contributionScore}
                  </div>
                  <div className="text-stakeados-gray-400 text-xs">Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Genesis Legacy */}
      <div className="card-gaming">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-stakeados-purple" />
          <h3 className="text-xl font-bold text-neon">Genesis Legacy</h3>
        </div>

        <div className="">
          <p className="text-stakeados-gray-300 mb-4">
            The Genesis community represents the founding members who believed
            in Stakeados' vision from the very beginning. These pioneers helped
            shape the platform, contributed to its early development, and
            continue to guide its evolution.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-stakeados-primary font-semibold mb-3">
                Genesis Contributions
              </h4>
              <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                <li>• Platform concept and vision development</li>
                <li>• Early feedback and feature suggestions</li>
                <li>• Community building and growth</li>
                <li>• Educational content creation</li>
                <li>• Technical development support</li>
                <li>• Marketing and outreach efforts</li>
              </ul>
            </div>

            <div>
              <h4 className="text-stakeados-primary font-semibold mb-3">
                Ongoing Benefits
              </h4>
              <ul className="space-y-2 text-stakeados-gray-300 text-sm">
                <li>• Lifetime Genesis badge and recognition</li>
                <li>• Early access to all new features</li>
                <li>• Exclusive Genesis-only content</li>
                <li>• Priority support and feedback channels</li>
                <li>• Special voting rights in governance</li>
                <li>• Revenue sharing opportunities (future)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
