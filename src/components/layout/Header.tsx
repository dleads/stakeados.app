'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import UserMenu from '@/components/ui/UserMenu';
import AuthModal from '@/components/auth/AuthModal';
import WalletAuthModal from '@/components/auth/WalletAuthModal';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Menu, X, Zap, Crown, Search, Bell } from 'lucide-react';

export default function Header() {
  const t = useTranslations();
  const { isAuthenticated } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletAuthModalOpen, setIsWalletAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>(
    'signin'
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const openWalletAuthModal = () => {
    setIsWalletAuthModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };
  const navigationItems = [
    { href: '/courses', label: t('navigation.courses') },
    { href: '/dashboard', label: t('navigation.dashboard') },
    { href: '/community', label: t('navigation.community') },
    { href: '/news', label: t('navigation.news') },
    { href: '/genesis', label: t('navigation.genesis') },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-gaming-card/95 backdrop-blur-lg border-b border-stakeados-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-gaming flex items-center justify-center group-hover:shadow-glow transition-all">
                <Zap className="w-5 h-5 text-stakeados-dark" />
              </div>
              <span className="text-xl font-bold text-neon group-hover:text-glow transition-all">
                Stakeados
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-stakeados-gray-300 hover:text-stakeados-primary transition-colors font-medium ${
                    item.href === '/genesis' ? 'flex items-center gap-1' : ''
                  }`}
                >
                  {/* Hover underline effect */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-stakeados-primary transition-all duration-300 group-hover:w-full"></span>
                  {item.href === '/genesis' && (
                    <Crown className="w-4 h-4 text-stakeados-yellow" />
                  )}
                  {item.label}
                </Link>
              ))}

              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 text-stakeados-gray-300 hover:text-stakeados-primary hover:bg-stakeados-primary/10 rounded-gaming transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Search Dropdown */}
                {isSearchOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg z-50">
                    <form onSubmit={handleSearch} className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stakeados-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search courses, articles, news..."
                          className="w-full pl-10 pr-4 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming focus:border-stakeados-primary focus:ring-2 focus:ring-stakeados-primary/20 transition-all"
                          autoFocus
                        />
                      </div>
                      <div className="mt-3 text-xs text-stakeados-gray-400">
                        Press Enter to search or ESC to close
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Auth/User Menu */}
            <div className="hidden md:flex items-center gap-4">
              {/* Notifications (if authenticated) */}
              {isAuthenticated && (
                <button className="relative p-2 text-stakeados-gray-300 hover:text-stakeados-primary hover:bg-stakeados-primary/10 rounded-gaming transition-colors">
                  <Bell className="w-5 h-5" />
                  {/* Notification badge */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-stakeados-red rounded-full"></div>
                </button>
              )}

              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="btn-ghost"
                  >
                    {t('common.signIn')}
                  </button>
                  <button
                    onClick={openWalletAuthModal}
                    className="btn-secondary"
                  >
                    Connect Wallet
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="btn-primary"
                  >
                    {t('common.signUp')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-stakeados-gray-300 hover:text-stakeados-primary transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Notification Center */}
          <div className="hidden">
            <NotificationCenter />
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden border-t border-stakeados-gray-700 overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? 'max-h-96 py-4' : 'max-h-0'
            }`}
          >
            <div className="space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="px-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stakeados-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming focus:border-stakeados-primary focus:ring-2 focus:ring-stakeados-primary/20 transition-all"
                  />
                </div>
              </form>

              <nav className="flex flex-col gap-4">
                {navigationItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-stakeados-gray-300 hover:text-stakeados-primary transition-colors font-medium px-2 py-1 ${
                      item.href === '/genesis' ? 'flex items-center gap-2' : ''
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.href === '/genesis' && (
                      <Crown className="w-4 h-4 text-stakeados-yellow" />
                    )}
                    {item.label}
                  </Link>
                ))}

                {/* Mobile Auth Buttons */}
                {!isAuthenticated && (
                  <div className="flex flex-col gap-3 pt-4 border-t border-stakeados-gray-700">
                    <button
                      onClick={() => {
                        openAuthModal('signin');
                        setIsMobileMenuOpen(false);
                      }}
                      className="btn-ghost"
                    >
                      {t('common.signIn')}
                    </button>
                    <button
                      onClick={() => {
                        openWalletAuthModal();
                        setIsMobileMenuOpen(false);
                      }}
                      className="btn-secondary"
                    >
                      Connect Wallet
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('signup');
                        setIsMobileMenuOpen(false);
                      }}
                      className="btn-primary"
                    >
                      {t('common.signUp')}
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* Search overlay for mobile */}
        {isSearchOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsSearchOpen(false)}
          />
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Wallet Auth Modal */}
      <WalletAuthModal
        isOpen={isWalletAuthModalOpen}
        onClose={() => setIsWalletAuthModalOpen(false)}
      />
    </>
  );
}
