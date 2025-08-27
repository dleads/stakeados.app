'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  X,
  Home,
  BookOpen,
  Users,
  Newspaper,
  Crown,
  BarChart3,
  Award,
  Settings,
  User,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const t = useTranslations();
  const { isAuthenticated, isGenesisHolder } = useAuthContext();

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
        { href: '/achievements', icon: Award, label: 'Achievements' },
        { href: '/settings', icon: Settings, label: t('common.settings') },
      ]
    : [];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gaming-card border-r border-stakeados-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stakeados-gray-700">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={onClose}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-gaming flex items-center justify-center group-hover:shadow-glow transition-all">
              <Zap className="w-5 h-5 text-stakeados-dark" />
            </div>
            <span className="text-xl font-bold text-neon">Stakeados</span>
          </Link>

          <button
            onClick={onClose}
            className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-8">
          {/* Main Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              {navigationItems.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-gaming transition-colors group ${
                      item.highlight
                        ? 'text-stakeados-yellow hover:bg-stakeados-yellow/10'
                        : 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700'
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${
                        item.highlight
                          ? 'text-stakeados-yellow'
                          : 'text-stakeados-gray-400 group-hover:text-stakeados-primary'
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                    {item.highlight && isGenesisHolder && (
                      <div className="w-2 h-2 bg-stakeados-yellow rounded-full animate-pulse" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* User Navigation */}
          {userItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider mb-4">
                Account
              </h3>
              <ul className="space-y-2">
                {userItems.map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors group"
                    >
                      <item.icon className="w-5 h-5 text-stakeados-gray-400 group-hover:text-stakeados-primary" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Stats */}
          {isAuthenticated && (
            <div className="p-4 bg-stakeados-gray-800 rounded-gaming">
              <h4 className="font-semibold text-white mb-3">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-400">Points:</span>
                  <span className="text-stakeados-primary font-semibold">
                    0
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-400">Courses:</span>
                  <span className="text-stakeados-blue font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stakeados-gray-400">Certificates:</span>
                  <span className="text-stakeados-yellow font-semibold">0</span>
                </div>
              </div>
            </div>
          )}

          {/* Community Status */}
          <div className="p-4 bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming">
            <h4 className="font-semibold text-stakeados-primary mb-2">
              Community
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">Active Users:</span>
                <span className="text-white font-semibold">1,250+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">
                  Certificates Issued:
                </span>
                <span className="text-white font-semibold">500+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stakeados-gray-300">
                  Genesis Members:
                </span>
                <span className="text-stakeados-yellow font-semibold">50+</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

// Sidebar toggle hook
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}
