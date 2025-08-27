'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import UserAvatar from '@/components/ui/UserAvatar';
import {
  X,
  Home,
  BookOpen,
  Users,
  Newspaper,
  Crown,
  BarChart3,
  User,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';
import type { Address } from 'viem';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  onSearchOpen,
}: MobileMenuProps) {
  const t = useTranslations();
  const { isAuthenticated, user, profile, signOut } = useAuthContext();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    { href: '/', icon: Home, label: t('navigation.home') },
    { href: '/courses', icon: BookOpen, label: t('navigation.courses') },
    { href: '/community', icon: Users, label: t('navigation.community') },
    { href: '/news', icon: Newspaper, label: t('navigation.news') },
    {
      href: '/genesis',
      icon: Crown,
      label: t('navigation.genesis'),
      highlight: true,
    },
  ];

  const userItems = isAuthenticated
    ? [
        {
          href: '/dashboard',
          icon: BarChart3,
          label: t('navigation.dashboard'),
        },
        { href: '/profile', icon: User, label: t('navigation.profile') },
        { href: '/achievements', icon: Crown, label: 'Achievements' },
        { href: '/settings', icon: Settings, label: t('common.settings') },
      ]
    : [];

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-gaming-card border-l border-stakeados-gray-700 shadow-glow-xl transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stakeados-gray-700">
          <h2 className="text-lg font-bold text-neon">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Section */}
        {isAuthenticated && user && (
          <div className="p-6 border-b border-stakeados-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar
                address={profile?.wallet_address as Address}
                profileAvatarUrl={profile?.avatar_url}
                displayName={profile?.display_name || 'User'}
                size="lg"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {profile?.display_name || 'User'}
                </div>
                <div className="text-sm text-stakeados-gray-400">
                  {user.email}
                </div>
                <div className="text-xs text-stakeados-primary">
                  {profile?.total_points || 0} points
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-primary">
                  0
                </div>
                <div className="text-xs text-stakeados-gray-400">Courses</div>
              </div>
              <div className="text-center p-2 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-blue">0</div>
                <div className="text-xs text-stakeados-gray-400">
                  Certificates
                </div>
              </div>
              <div className="text-center p-2 bg-stakeados-gray-800 rounded-gaming">
                <div className="text-lg font-bold text-stakeados-yellow">0</div>
                <div className="text-xs text-stakeados-gray-400">
                  Achievements
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Search */}
            <button
              onClick={() => {
                onSearchOpen();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>

            {/* Main Navigation */}
            <div>
              <h3 className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider mb-3">
                Platform
              </h3>
              <nav className="space-y-1">
                {navigationItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 p-3 rounded-gaming transition-colors ${
                      item.highlight
                        ? 'text-stakeados-yellow hover:bg-stakeados-yellow/10'
                        : 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Navigation */}
            {userItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider mb-3">
                  Account
                </h3>
                <nav className="space-y-1">
                  {userItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Auth Actions */}
            {!isAuthenticated && (
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  {t('common.signUp')}
                </button>
                <button className="btn-secondary w-full">
                  {t('common.signIn')}
                </button>
                <button className="btn-ghost w-full">Connect Wallet</button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="border-t border-stakeados-gray-700 p-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full p-3 text-stakeados-red hover:bg-stakeados-red/10 rounded-gaming transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('common.signOut')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
