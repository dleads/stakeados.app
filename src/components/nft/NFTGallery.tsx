'use client';

import React, { useState } from 'react';

import { useNFTManagement } from '@/hooks/useNFTManagement';
import { formatDate } from '@/lib/utils';
import { Award, Star, Calendar, Target, ExternalLink } from 'lucide-react';

interface NFTGalleryProps {
  className?: string;
  showFilters?: boolean;
  maxItems?: number;
}

export default function NFTGallery({
  className = '',
  showFilters = true,
  maxItems,
}: NFTGalleryProps) {
  const {
    certificates,
    citizenship,
    isLoading,
    error,
    getCertificateStats,
    isConnected,
  } = useNFTManagement();

  const [filter, setFilter] = useState<
    'all' | 'basic' | 'intermediate' | 'advanced'
  >('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'difficulty'>('date');

  const stats = getCertificateStats();

  // Filter and sort certificates
  const filteredCertificates = certificates
    .filter(cert => {
      if (filter === 'all') return true;
      return cert.data.difficulty === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (
            b.data.completionDate.getTime() - a.data.completionDate.getTime()
          );
        case 'score':
          return b.data.score - a.data.score;
        case 'difficulty':
          const difficultyOrder = { basic: 1, intermediate: 2, advanced: 3 };
          return (
            difficultyOrder[b.data.difficulty] -
            difficultyOrder[a.data.difficulty]
          );
        default:
          return 0;
      }
    })
    .slice(0, maxItems);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'text-stakeados-primary';
      case 'intermediate':
        return 'text-stakeados-blue';
      case 'advanced':
        return 'text-stakeados-purple';
      default:
        return 'text-stakeados-gray-300';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'text-orange-400';
      case 'silver':
        return 'text-gray-300';
      case 'gold':
        return 'text-yellow-400';
      case 'genesis':
        return 'text-stakeados-primary';
      default:
        return 'text-stakeados-gray-300';
    }
  };

  if (!isConnected) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-stakeados-gray-400">
            Connect your wallet to view your NFT collection
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-stakeados-gray-600 border-t-stakeados-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stakeados-gray-300">
            Loading your NFT collection...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-gaming ${className}`}>
        <div className="notification-error">
          <p>Error loading NFTs: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon mb-2">NFT Collection</h2>
          <p className="text-stakeados-gray-300">
            Your certificates and achievements on the blockchain
          </p>
        </div>

        {showFilters && (certificates.length > 0 || citizenship) && (
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-3 py-2 text-sm"
            >
              <option value="all">All Certificates</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-3 py-2 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="difficulty">Sort by Difficulty</option>
            </select>
          </div>
        )}
      </div>

      {/* Statistics */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-primary mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Total Certificates
            </div>
          </div>

          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-blue mb-1">
              {stats.averageScore}%
            </div>
            <div className="text-sm text-stakeados-gray-300">Average Score</div>
          </div>

          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-purple mb-1">
              {stats.advanced}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Advanced Certs
            </div>
          </div>

          <div className="card-primary text-center">
            <div className="text-2xl font-bold text-stakeados-yellow mb-1">
              {stats.validCertificates}
            </div>
            <div className="text-sm text-stakeados-gray-300">
              Valid Certificates
            </div>
          </div>
        </div>
      )}

      {/* Citizenship NFT */}
      {citizenship && (
        <div className="card-highlight">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-stakeados-yellow" />
            <h3 className="text-xl font-bold text-neon">Citizenship NFT</h3>
            {citizenship.data.isGenesis && (
              <span className="bg-stakeados-primary/20 text-stakeados-primary px-3 py-1 rounded-gaming text-sm font-semibold">
                GENESIS
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Tier:</span>
                <span
                  className={`font-semibold ${getTierColor(citizenship.data.tier)}`}
                >
                  {citizenship.data.tier.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Points at Mint:</span>
                <span className="text-white font-semibold">
                  {citizenship.data.pointsAtMint}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Web3 Score:</span>
                <span className="text-stakeados-blue font-semibold">
                  {citizenship.data.web3Score}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Mint Date:</span>
                <span className="text-white">
                  {formatDate(citizenship.data.mintDate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Status:</span>
                <span
                  className={
                    citizenship.data.isActive
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-red'
                  }
                >
                  {citizenship.data.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Token ID:</span>
                <span className="text-stakeados-gray-300 font-mono">
                  #{citizenship.tokenId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map(certificate => (
            <div
              key={certificate.tokenId}
              className="card-primary hover:card-highlight transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-stakeados-yellow" />
                  <span className="text-xs text-stakeados-gray-400 font-mono">
                    #{certificate.tokenId}
                  </span>
                </div>

                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(certificate.data.difficulty)} bg-current/10`}
                >
                  {certificate.data.difficulty.toUpperCase()}
                </span>
              </div>

              <h4 className="text-lg font-bold text-white mb-2">
                {certificate.data.courseName}
              </h4>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300 text-sm">
                    Score:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {certificate.data.score}%
                    </span>
                    <Target className="w-4 h-4 text-stakeados-primary" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300 text-sm">
                    Completed:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">
                      {formatDate(certificate.data.completionDate)}
                    </span>
                    <Calendar className="w-4 h-4 text-stakeados-blue" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-300 text-sm">
                    Status:
                  </span>
                  <span
                    className={
                      certificate.data.isValid
                        ? 'text-stakeados-primary'
                        : 'text-stakeados-red'
                    }
                  >
                    {certificate.data.isValid ? 'Valid' : 'Revoked'}
                  </span>
                </div>
              </div>

              <button className="btn-ghost w-full text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Basescan
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-gaming text-center py-12">
          <Award className="w-16 h-16 text-stakeados-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stakeados-gray-300 mb-2">
            No Certificates Yet
          </h3>
          <p className="text-stakeados-gray-400 mb-6">
            Complete courses to earn your first NFT certificate
          </p>
          <button className="btn-primary">Browse Courses</button>
        </div>
      )}
    </div>
  );
}
