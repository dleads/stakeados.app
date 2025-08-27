'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useBaseName } from '@/hooks/useBaseName';
import UserAvatar from '@/components/ui/UserAvatar';
import BaseNameDisplay from '@/components/web3/BaseNameDisplay';
import WalletLinkManager from '@/components/web3/WalletLinkManager';
import Web3Requirements from '@/components/web3/Web3Requirements';
import ProgressDashboard from '@/components/progress/ProgressDashboard';
import LearningStreakWidget from '@/components/progress/LearningStreakWidget';
import { Award, BookOpen, Edit, Star, Wallet } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NFTGallery from '@/components/nft/NFTGallery';
import { Link } from '@/lib/utils/navigation';
import type { Address } from 'viem';

export default function ProfilePage() {
  const t = useTranslations();
  const { user, profile, isGenesisHolder } = useAuthContext();
  const walletAddress = profile?.wallet_address as Address | undefined;
  const {
    name: baseName,
    description,
    twitter,
    github,
    website,
  } = useBaseName(walletAddress);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-neon mb-4">
                {t('profile.title')}
              </h1>
              <p className="text-xl text-stakeados-gray-300">
                Manage your account and Web3 connections
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Profile Card */}
                <div className="card-primary">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        address={walletAddress}
                        profileAvatarUrl={profile?.avatar_url}
                        displayName={profile?.display_name || 'User'}
                        size="xl"
                        showBaseNameAvatar={true}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-white">
                            {baseName
                              ? baseName.replace('.base.eth', '')
                              : profile?.display_name || 'User'}
                          </h2>
                          {isGenesisHolder && (
                            <Star className="w-6 h-6 text-stakeados-yellow" />
                          )}
                        </div>
                        {baseName && (
                          <BaseNameDisplay
                            address={walletAddress}
                            showIcon={true}
                            showDescription={false}
                            className="mb-1"
                          />
                        )}
                        <p className="text-stakeados-gray-300">{user?.email}</p>
                        {description && (
                          <p className="text-stakeados-gray-400 mt-2">
                            {description}
                          </p>
                        )}

                        {/* Base Name Social Links */}
                        {(twitter || github || website) && (
                          <div className="flex items-center gap-3 mt-3">
                            {twitter && (
                              <a
                                href={`https://twitter.com/${twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stakeados-blue hover:text-stakeados-primary transition-colors text-sm"
                              >
                                @{twitter}
                              </a>
                            )}
                            {github && (
                              <a
                                href={`https://github.com/${github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stakeados-blue hover:text-stakeados-primary transition-colors text-sm"
                              >
                                GitHub
                              </a>
                            )}
                            {website && (
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stakeados-blue hover:text-stakeados-primary transition-colors text-sm"
                              >
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="btn-ghost">
                      <Edit className="w-4 h-4 mr-2" />
                      {t('profile.editProfile')}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                      <div className="text-2xl font-bold text-stakeados-primary mb-1">
                        {profile?.total_points || 0}
                      </div>
                      <div className="text-sm text-stakeados-gray-300">
                        {t('profile.totalPoints')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                      <div className="text-2xl font-bold text-stakeados-blue mb-1">
                        0
                      </div>
                      <div className="text-sm text-stakeados-gray-300">
                        {t('profile.coursesCompleted')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                      <div className="text-2xl font-bold text-stakeados-purple mb-1">
                        0
                      </div>
                      <div className="text-sm text-stakeados-gray-300">
                        {t('profile.articlesWritten')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-stakeados-gray-800 rounded-gaming">
                      <div className="text-2xl font-bold text-stakeados-yellow mb-1">
                        0
                      </div>
                      <div className="text-sm text-stakeados-gray-300">
                        {t('profile.nftCertificates')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Connection */}
                <WalletLinkManager />

                {/* Progress Overview */}
                <ProgressDashboard showDetailedStats={false} />

                {/* Achievements */}
                <div className="card-primary">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-stakeados-yellow" />
                    <h3 className="text-xl font-bold text-neon">
                      {t('profile.achievements')}
                    </h3>
                  </div>

                  {/* Quick preview of NFTs */}
                  <div className="mt-6">
                    <NFTGallery showFilters={false} maxItems={3} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isGenesisHolder && (
                      <div className="p-4 bg-gradient-to-r from-stakeados-yellow/20 to-stakeados-yellow/10 border border-stakeados-yellow/30 rounded-gaming">
                        <div className="flex items-center gap-3">
                          <Star className="w-8 h-8 text-stakeados-yellow" />
                          <div>
                            <div className="font-semibold text-stakeados-yellow">
                              {t('profile.genesisHolder')}
                            </div>
                            <div className="text-sm text-stakeados-gray-300">
                              Founding member of Stakeados
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-stakeados-gray-800 rounded-gaming opacity-50">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-stakeados-gray-500" />
                        <div>
                          <div className="font-semibold text-stakeados-gray-400">
                            First Course
                          </div>
                          <div className="text-sm text-stakeados-gray-500">
                            Complete your first course
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Web3 Requirements */}
              <div className="space-y-8">
                {/* Learning Streak */}
                <LearningStreakWidget />

                <Web3Requirements />

                {/* Quick Actions */}
                <div className="card-primary">
                  <h3 className="text-lg font-bold text-neon mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="btn-ghost w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-3" />
                      Browse Courses
                    </button>
                    <Link
                      href="/profile/certificates"
                      className="btn-ghost w-full justify-start"
                    >
                      View Certificates
                    </Link>
                    <button className="btn-ghost w-full justify-start">
                      <Wallet className="w-4 h-4 mr-3" />
                      Web3 Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
