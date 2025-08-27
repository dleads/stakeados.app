'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useBaseName } from '@/hooks/useBaseName';
import UserAvatar from './UserAvatar';
import { User, Settings, LogOut, Star, Award, ChevronDown } from 'lucide-react';
import { Link } from '@/lib/utils/navigation';
import type { Address } from 'viem';

export default function UserMenu() {
  const t = useTranslations();
  const { user, profile, signOut, isAuthenticated, isGenesisHolder } =
    useAuthContext();
  const walletAddress = profile?.wallet_address as Address | undefined;
  const { name: baseName } = useBaseName(walletAddress);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const displayName =
    profile?.display_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-gaming bg-stakeados-gray-800 hover:bg-stakeados-gray-700 transition-colors border border-stakeados-gray-600 hover:border-stakeados-primary/50"
      >
        {/* Avatar */}
        <UserAvatar
          address={walletAddress}
          profileAvatarUrl={profile?.avatar_url}
          displayName={displayName}
          size="md"
          showBaseNameAvatar={true}
        />

        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="text-left">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              {baseName ? baseName.replace('.base.eth', '') : displayName}
              {isGenesisHolder && (
                <Star className="w-4 h-4 text-stakeados-yellow" />
              )}
            </div>
            <div className="text-xs text-stakeados-gray-400">
              {profile?.total_points || 0} points
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-stakeados-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gaming-card rounded-gaming border border-stakeados-gray-600 shadow-glow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-stakeados-gray-700">
            <div className="flex items-center gap-3">
              <UserAvatar
                address={walletAddress}
                profileAvatarUrl={profile?.avatar_url}
                displayName={displayName}
                size="lg"
                showBaseNameAvatar={true}
              />
              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  {baseName ? baseName.replace('.base.eth', '') : displayName}
                  {isGenesisHolder && (
                    <Star className="w-4 h-4 text-stakeados-yellow" />
                  )}
                </div>
                {baseName && (
                  <div className="text-xs text-stakeados-blue">{baseName}</div>
                )}
                <div className="text-sm text-stakeados-gray-400">
                  {user.email}
                </div>
                <div className="text-xs text-stakeados-primary">
                  {profile?.total_points || 0} points
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              {t('profile.title')}
            </Link>

            <Link
              href="/profile/certificates"
              className="flex items-center gap-3 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Award className="w-4 h-4" />
              {t('profile.nftCertificates')}
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              {t('common.settings')}
            </Link>

            {isGenesisHolder && (
              <Link
                href="/genesis"
                className="flex items-center gap-3 px-4 py-2 text-stakeados-yellow hover:text-stakeados-yellow/80 hover:bg-stakeados-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Star className="w-4 h-4" />
                Genesis Community
              </Link>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-stakeados-gray-700 py-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-stakeados-red hover:text-stakeados-red/80 hover:bg-stakeados-gray-700 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              {t('common.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
