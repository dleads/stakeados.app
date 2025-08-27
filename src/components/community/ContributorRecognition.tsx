'use client';

import React, { useState } from 'react';

import UserAvatar from '@/components/ui/UserAvatar';
import { formatDate } from '@/lib/utils';
import {
  Award,
  TrendingUp,
  Star,
  Crown,
  Trophy,
  Medal,
  Calendar,
  Users,
} from 'lucide-react';

interface ContributorRecognitionProps {
  className?: string;
  showLeaderboard?: boolean;
  maxContributors?: number;
}

export default function ContributorRecognition({
  className = '',
  showLeaderboard = true,
  maxContributors = 10,
}: ContributorRecognitionProps) {
  // Mock data for contributors - in production this would come from Supabase
  const [contributors] = useState([
    {
      id: '1',
      display_name: 'Alex Chen',
      username: 'alexchen',
      avatar_url: null,
      articles_count: 12,
      total_points: 180,
      level: 'Expert',
      joined_date: '2024-01-15',
      specialties: ['DeFi', 'Smart Contracts'],
      featured_articles: 3,
    },
    {
      id: '2',
      display_name: 'Maria Rodriguez',
      username: 'mariarodriguez',
      avatar_url: null,
      articles_count: 8,
      total_points: 120,
      level: 'Advanced',
      joined_date: '2024-02-20',
      specialties: ['NFTs', 'Base Network'],
      featured_articles: 2,
    },
    {
      id: '3',
      display_name: 'David Kim',
      username: 'davidkim',
      avatar_url: null,
      articles_count: 6,
      total_points: 90,
      level: 'Advanced',
      joined_date: '2024-03-10',
      specialties: ['Web3 Development', 'Account Abstraction'],
      featured_articles: 1,
    },
    {
      id: '4',
      display_name: 'Sarah Johnson',
      username: 'sarahjohnson',
      avatar_url: null,
      articles_count: 4,
      total_points: 60,
      level: 'Contributor',
      joined_date: '2024-04-05',
      specialties: ['Blockchain Basics', 'Education'],
      featured_articles: 0,
    },
    {
      id: '5',
      display_name: 'Carlos Mendez',
      username: 'carlosmendez',
      avatar_url: null,
      articles_count: 3,
      total_points: 45,
      level: 'Contributor',
      joined_date: '2024-05-12',
      specialties: ['Cryptocurrency', 'Trading'],
      featured_articles: 0,
    },
  ]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Expert':
        return <Crown className="w-5 h-5 text-stakeados-purple" />;
      case 'Advanced':
        return <Star className="w-5 h-5 text-stakeados-blue" />;
      case 'Contributor':
        return <Award className="w-5 h-5 text-stakeados-primary" />;
      default:
        return <Medal className="w-5 h-5 text-stakeados-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'text-stakeados-purple';
      case 'Advanced':
        return 'text-stakeados-blue';
      case 'Contributor':
        return 'text-stakeados-primary';
      default:
        return 'text-stakeados-gray-400';
    }
  };

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-stakeados-blue" />
          <div>
            <h2 className="text-2xl font-bold text-neon">Top Contributors</h2>
            <p className="text-stakeados-gray-300">
              Recognizing our community leaders
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-stakeados-primary">
            {contributors.length}
          </div>
          <div className="text-sm text-stakeados-gray-300">Active Authors</div>
        </div>
      </div>

      {/* Top 3 Contributors Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contributors.slice(0, 3).map((contributor, index) => (
          <div key={contributor.id} className="card-highlight text-center">
            <div className="flex justify-center mb-4">
              {getRankIcon(index + 1)}
            </div>

            <UserAvatar
              profileAvatarUrl={contributor.avatar_url}
              displayName={contributor.display_name}
              size="xl"
              className="mx-auto mb-4"
            />

            <h3 className="text-lg font-bold text-white mb-1">
              {contributor.display_name}
            </h3>
            <div
              className={`font-semibold mb-3 ${getLevelColor(contributor.level)}`}
            >
              {contributor.level} Contributor
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-stakeados-primary">
                  {contributor.articles_count}
                </div>
                <div className="text-xs text-stakeados-gray-300">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-stakeados-yellow">
                  {contributor.total_points}
                </div>
                <div className="text-xs text-stakeados-gray-300">Points</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 justify-center">
              {contributor.specialties.map(specialty => (
                <span
                  key={specialty}
                  className="px-2 py-1 bg-stakeados-gray-700 text-stakeados-gray-300 rounded text-xs"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="card-gaming">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-stakeados-orange" />
            <h3 className="text-xl font-bold text-neon">
              Contributor Leaderboard
            </h3>
          </div>

          <div className="space-y-3">
            {contributors
              .slice(0, maxContributors)
              .map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center gap-4 p-4 bg-stakeados-gray-800 hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {index < 3 ? (
                      getRankIcon(index + 1)
                    ) : (
                      <span className="text-stakeados-gray-400 font-bold">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar & Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <UserAvatar
                      profileAvatarUrl={contributor.avatar_url}
                      displayName={contributor.display_name}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {contributor.display_name}
                        </span>
                        {getLevelIcon(contributor.level)}
                      </div>
                      <div className="text-sm text-stakeados-gray-400">
                        Joined {formatDate(contributor.joined_date)}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-stakeados-primary">
                        {contributor.articles_count}
                      </div>
                      <div className="text-stakeados-gray-400">Articles</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-stakeados-yellow">
                        {contributor.total_points}
                      </div>
                      <div className="text-stakeados-gray-400">Points</div>
                    </div>
                    {contributor.featured_articles > 0 && (
                      <div className="text-center">
                        <div className="font-bold text-stakeados-orange">
                          {contributor.featured_articles}
                        </div>
                        <div className="text-stakeados-gray-400">Featured</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recognition Badges */}
      <div className="card-gaming">
        <h3 className="text-xl font-bold text-neon mb-6">Recognition Badges</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-semibold text-stakeados-yellow mb-1">
              Top Author
            </div>
            <div className="text-xs text-stakeados-gray-400">
              Most articles published
            </div>
          </div>

          <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-semibold text-stakeados-blue mb-1">
              Quality Writer
            </div>
            <div className="text-xs text-stakeados-gray-400">
              Highest average rating
            </div>
          </div>

          <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-3xl mb-2">🚀</div>
            <div className="font-semibold text-stakeados-primary mb-1">
              Rising Star
            </div>
            <div className="text-xs text-stakeados-gray-400">
              Fastest growing contributor
            </div>
          </div>

          <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
            <div className="text-3xl mb-2">💎</div>
            <div className="font-semibold text-stakeados-purple mb-1">
              Expert
            </div>
            <div className="text-xs text-stakeados-gray-400">
              Technical excellence
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Highlights */}
      <div className="card-gaming">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-stakeados-purple" />
          <h3 className="text-xl font-bold text-neon">
            This Month's Highlights
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-stakeados-primary">
              Featured Articles
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-medium text-white mb-1">
                  "Advanced Smart Contract Patterns"
                </div>
                <div className="text-sm text-stakeados-gray-400">
                  by Alex Chen • 2,500 views
                </div>
              </div>
              <div className="p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="font-medium text-white mb-1">
                  "Base Network Deep Dive"
                </div>
                <div className="text-sm text-stakeados-gray-400">
                  by Maria Rodriguez • 1,800 views
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-stakeados-primary">
              Community Stats
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-primary">
                  8
                </div>
                <div className="text-xs text-stakeados-gray-300">
                  New Articles
                </div>
              </div>
              <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-blue">3</div>
                <div className="text-xs text-stakeados-gray-300">
                  New Authors
                </div>
              </div>
              <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-yellow">
                  15k
                </div>
                <div className="text-xs text-stakeados-gray-300">
                  Total Views
                </div>
              </div>
              <div className="text-center p-3 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-purple">
                  95%
                </div>
                <div className="text-xs text-stakeados-gray-300">
                  Approval Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
