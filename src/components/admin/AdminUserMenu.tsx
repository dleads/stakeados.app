'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useBaseName } from '@/hooks/useBaseName';
import UserAvatar from '@/components/ui/UserAvatar';
import {
  User,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  Activity,
  Database,
  FileText,
  BarChart3,
  Users,
  Crown,
} from 'lucide-react';
import { Link } from '@/lib/utils/navigation';
import { cn } from '@/lib/utils';
import type { Address } from 'viem';

export default function AdminUserMenu() {
  const t = useTranslations('admin.userMenu');
  const { user, profile, signOut, isAuthenticated, isGenesisHolder } =
    useAuthContext();
  const walletAddress = profile?.wallet_address as Address | undefined;

  // Always call useBaseName, but handle the case where walletAddress might be undefined
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

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const displayName =
    profile?.display_name || user?.email?.split('@')[0] || 'Admin';

  // Memoize admin menu items to avoid recreating on every render
  const adminMenuItems = useMemo(
    () => [
      {
        icon: Activity,
        label: t('quickAccess.dashboard'),
        href: '/admin',
        description: t('quickAccess.dashboardDesc'),
      },
      {
        icon: FileText,
        label: t('quickAccess.content'),
        href: '/admin/articles',
        description: t('quickAccess.contentDesc'),
      },
      {
        icon: BarChart3,
        label: t('quickAccess.analytics'),
        href: '/admin/analytics',
        description: t('quickAccess.analyticsDesc'),
      },
      {
        icon: Users,
        label: t('quickAccess.users'),
        href: '/admin/users',
        description: t('quickAccess.usersDesc'),
      },
      {
        icon: Database,
        label: t('quickAccess.system'),
        href: '/admin/settings',
        description: t('quickAccess.systemDesc'),
      },
    ],
    [t]
  );

  // Early return if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-gaming transition-all duration-200',
          isOpen
            ? 'bg-stakeados-primary/20 border border-stakeados-primary/30'
            : 'bg-stakeados-gray-800 hover:bg-stakeados-gray-700 border border-stakeados-gray-600 hover:border-stakeados-primary/50'
        )}
      >
        {/* Avatar */}
        <UserAvatar
          address={walletAddress}
          profileAvatarUrl={profile?.avatar_url}
          displayName={displayName}
          size="sm"
          showBaseNameAvatar={true}
        />

        {/* User Info */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            {baseName ? baseName.replace('.base.eth', '') : displayName}
            <Shield className="w-3 h-3 text-stakeados-primary" />
            {isGenesisHolder && (
              <Crown className="w-3 h-3 text-stakeados-yellow" />
            )}
          </div>
          <div className="text-xs text-stakeados-gray-400">
            {t('role.administrator')}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-stakeados-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gaming-card rounded-gaming border border-stakeados-gray-600 shadow-glow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-4 border-b border-stakeados-gray-700">
            <div className="flex items-center gap-3">
              <UserAvatar
                address={walletAddress}
                profileAvatarUrl={profile?.avatar_url}
                displayName={displayName}
                size="lg"
                showBaseNameAvatar={true}
              />
              <div className="flex-1">
                <div className="font-semibold text-white flex items-center gap-2">
                  {baseName ? baseName.replace('.base.eth', '') : displayName}
                  <Shield className="w-4 h-4 text-stakeados-primary" />
                  {isGenesisHolder && (
                    <Crown className="w-4 h-4 text-stakeados-yellow" />
                  )}
                </div>
                {baseName && (
                  <div className="text-xs text-stakeados-blue">{baseName}</div>
                )}
                <div className="text-sm text-stakeados-gray-400">
                  {user.email}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-stakeados-primary">
                    {t('role.adminLevel')}
                  </span>
                  <span className="text-stakeados-gray-400">
                    {t('points', { count: profile?.total_points || 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Quick Actions */}
          <div className="py-2">
            <div className="px-4 py-2">
              <h4 className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider">
                {t('quickAccess.title')}
              </h4>
            </div>

            {adminMenuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-4 h-4 text-stakeados-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-stakeados-gray-500">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-stakeados-gray-700" />

          {/* User Account Actions */}
          <div className="py-2">
            <div className="px-4 py-2">
              <h4 className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider">
                {t('account.title')}
              </h4>
            </div>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              {t('account.profile')}
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              {t('account.settings')}
            </Link>

            {isGenesisHolder && (
              <Link
                href="/genesis"
                className="flex items-center gap-3 px-4 py-2 text-stakeados-yellow hover:text-stakeados-yellow/80 hover:bg-stakeados-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Crown className="w-4 h-4" />
                {t('account.genesis')}
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-stakeados-gray-700" />

          {/* Sign Out */}
          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-stakeados-red hover:text-stakeados-red/80 hover:bg-stakeados-gray-700 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              {t('account.signOut')}
            </button>
          </div>

          {/* Footer Info */}
          <div className="px-4 py-3 border-t border-stakeados-gray-700 bg-stakeados-gray-800/50">
            <div className="flex items-center justify-between text-xs text-stakeados-gray-500">
              <span>{t('footer.version')}</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-stakeados-primary rounded-full animate-pulse"></div>
                <span>{t('footer.systemActive')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
