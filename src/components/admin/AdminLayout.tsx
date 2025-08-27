'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/lib/utils/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import Breadcrumb, { useBreadcrumb } from '@/components/navigation/Breadcrumb';
import AdminNotificationSystem from './AdminNotificationSystem';
import AdminUserMenu from './AdminUserMenu';
import AdminThemeToggle from './AdminThemeToggle';
import { RealTimeNotificationCenter } from './realtime/RealTimeNotificationCenter';
import { HelpSystem, ContextualHelp } from './help';
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Newspaper,
  Tags,
  FolderOpen,
  BarChart3,
  Settings,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  Plus,
  Monitor,
  Palette,
  Grid3X3,
  List,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  locale: string;
  className?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

interface LayoutPreferences {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  density: 'compact' | 'comfortable' | 'spacious';
  viewMode: 'grid' | 'list';
}

const LAYOUT_STORAGE_KEY = 'stakeados-admin-layout-preferences';

export default function AdminLayout({
  children,
  locale,
  className,
}: AdminLayoutProps) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const {} = useAuthContext();
  const { generateBreadcrumb } = useBreadcrumb();

  // Layout preferences state
  const [layoutPreferences, setLayoutPreferences] = useState<LayoutPreferences>(
    {
      sidebarCollapsed: false,
      theme: 'dark' as const,
      density: 'comfortable',
      viewMode: 'list',
    }
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLayoutCustomization, setShowLayoutCustomization] = useState(false);

  // Load layout preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved);
        setLayoutPreferences(prev => ({ ...prev, ...preferences }));
      }
    } catch (error) {
      console.error('Failed to load layout preferences:', error);
    }
  }, []);

  // Save layout preferences to localStorage
  const saveLayoutPreferences = (
    newPreferences: Partial<LayoutPreferences>
  ) => {
    const updated = { ...layoutPreferences, ...newPreferences };
    setLayoutPreferences(updated);

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save layout preferences:', error);
    }
  };

  // Navigation items with translations
  const navigationItems: NavigationItem[] = [
    {
      name: t('navigation.dashboard'),
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
      description: t('navigation.dashboardDescription'),
    },
    {
      name: t('navigation.articles'),
      href: `/${locale}/admin/articles`,
      icon: FileText,
      badge: 5, // This would come from API
      description: t('navigation.articlesDescription'),
    },
    {
      name: t('navigation.news'),
      href: `/${locale}/admin/news`,
      icon: Newspaper,
      badge: 12,
      description: t('navigation.newsDescription'),
    },
    {
      name: t('navigation.categories'),
      href: `/${locale}/admin/categories`,
      icon: FolderOpen,
      description: t('navigation.categoriesDescription'),
    },
    {
      name: t('navigation.tags'),
      href: `/${locale}/admin/tags`,
      icon: Tags,
      description: t('navigation.tagsDescription'),
    },
    {
      name: t('navigation.search'),
      href: `/${locale}/admin/search`,
      icon: Search,
      description: t('navigation.searchDescription'),
    },
    {
      name: t('navigation.analytics'),
      href: `/${locale}/admin/analytics`,
      icon: BarChart3,
      description: t('navigation.analyticsDescription'),
    },
    {
      name: t('navigation.users'),
      href: `/${locale}/admin/users`,
      icon: Users,
      description: t('navigation.usersDescription'),
    },
    {
      name: t('navigation.settings'),
      href: `/${locale}/admin/settings`,
      icon: Settings,
      description: t('navigation.settingsDescription'),
    },
  ];

  // Generate breadcrumb items
  const breadcrumbItems = generateBreadcrumb(pathname);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    saveLayoutPreferences({
      sidebarCollapsed: !layoutPreferences.sidebarCollapsed,
    });
  };

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle theme toggle
  const toggleTheme = (newTheme: 'dark' | 'light') => {
    saveLayoutPreferences({ theme: newTheme });
  };

  // Handle density change
  const changeDensity = (density: LayoutPreferences['density']) => {
    saveLayoutPreferences({ density });
  };

  // Handle view mode change
  const changeViewMode = (viewMode: LayoutPreferences['viewMode']) => {
    saveLayoutPreferences({ viewMode });
  };

  // Get density classes
  const getDensityClasses = () => {
    switch (layoutPreferences.density) {
      case 'compact':
        return 'text-sm';
      case 'spacious':
        return 'text-base py-1';
      default:
        return '';
    }
  };

  // Check if current route matches navigation item
  const isActiveRoute = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-gaming text-white transition-all duration-300',
        layoutPreferences.theme === 'light' && 'bg-gray-50 text-gray-900',
        getDensityClasses(),
        className
      )}
    >
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Layout Customization Panel */}
      {showLayoutCustomization && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {t('layout.customization.title')}
                </h3>
                <button
                  onClick={() => setShowLayoutCustomization(false)}
                  className="p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white mb-3">
                  {t('layout.customization.theme')}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['dark', 'light'] as const).map(themeOption => (
                    <button
                      key={themeOption}
                      onClick={() => toggleTheme(themeOption)}
                      className={cn(
                        'p-3 rounded-gaming border transition-all duration-200 text-left',
                        layoutPreferences.theme === themeOption
                          ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                          : 'border-stakeados-gray-600 text-stakeados-gray-300 hover:border-stakeados-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {themeOption === 'dark' ? (
                          <Monitor className="w-4 h-4" />
                        ) : (
                          <Palette className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {themeOption === 'dark'
                            ? t('layout.customization.darkTheme')
                            : t('layout.customization.lightTheme')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Density Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white mb-3">
                  {t('layout.customization.density')}
                </h4>
                <div className="space-y-2">
                  {(['compact', 'comfortable', 'spacious'] as const).map(
                    densityOption => (
                      <button
                        key={densityOption}
                        onClick={() => changeDensity(densityOption)}
                        className={cn(
                          'w-full p-3 rounded-gaming border transition-all duration-200 text-left',
                          layoutPreferences.density === densityOption
                            ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                            : 'border-stakeados-gray-600 text-stakeados-gray-300 hover:border-stakeados-primary/50'
                        )}
                      >
                        <div className="text-sm font-medium">
                          {t(`layout.customization.${densityOption}`)}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* View Mode Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white mb-3">
                  {t('layout.customization.viewMode')}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['grid', 'list'] as const).map(viewOption => (
                    <button
                      key={viewOption}
                      onClick={() => changeViewMode(viewOption)}
                      className={cn(
                        'p-3 rounded-gaming border transition-all duration-200 text-left',
                        layoutPreferences.viewMode === viewOption
                          ? 'border-stakeados-primary bg-stakeados-primary/10 text-stakeados-primary'
                          : 'border-stakeados-gray-600 text-stakeados-gray-300 hover:border-stakeados-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {viewOption === 'grid' ? (
                          <Grid3X3 className="w-4 h-4" />
                        ) : (
                          <List className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {t(`layout.customization.${viewOption}`)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  const defaultPreferences: LayoutPreferences = {
                    sidebarCollapsed: false,
                    theme: 'dark' as const,
                    density: 'comfortable',
                    viewMode: 'list',
                  };
                  saveLayoutPreferences(defaultPreferences);
                }}
                className="w-full p-3 bg-stakeados-gray-700 hover:bg-stakeados-gray-600 text-white rounded-gaming transition-colors"
              >
                {t('layout.customization.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-gaming-card border-r border-stakeados-gray-700 z-50 transform transition-all duration-300 ease-in-out',
          layoutPreferences.sidebarCollapsed ? 'w-16' : 'w-80',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-stakeados-gray-700">
          <Link
            href={`/${locale}`}
            className={cn(
              'flex items-center gap-3 group transition-all duration-300',
              layoutPreferences.sidebarCollapsed && 'justify-center'
            )}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-gaming flex items-center justify-center group-hover:shadow-glow transition-all">
              <Zap className="w-6 h-6 text-stakeados-dark" />
            </div>
            {!layoutPreferences.sidebarCollapsed && (
              <div>
                <span className="text-xl font-bold text-neon">Stakeados</span>
                <div className="text-xs text-stakeados-gray-400">
                  {t('layout.adminPanel')}
                </div>
              </div>
            )}
          </Link>

          {/* Sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
            title={
              layoutPreferences.sidebarCollapsed
                ? t('layout.expandSidebar')
                : t('layout.collapseSidebar')
            }
          >
            {layoutPreferences.sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {navigationItems.map(item => {
            const isActive = isActiveRoute(item.href);
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-gaming transition-all duration-200 group relative',
                  isActive
                    ? 'bg-stakeados-primary/20 text-stakeados-primary border border-stakeados-primary/30'
                    : 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700',
                  layoutPreferences.sidebarCollapsed && 'justify-center px-2',
                  layoutPreferences.density === 'compact' && 'py-2',
                  layoutPreferences.density === 'spacious' && 'py-4'
                )}
                title={
                  layoutPreferences.sidebarCollapsed ? item.name : undefined
                }
              >
                <IconComponent
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-gray-400 group-hover:text-stakeados-primary'
                  )}
                />

                {!layoutPreferences.sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      {item.description &&
                        layoutPreferences.density !== 'compact' && (
                          <div className="text-xs text-stakeados-gray-500 truncate">
                            {item.description}
                          </div>
                        )}
                    </div>

                    {item.badge && item.badge > 0 && (
                      <div className="bg-stakeados-primary text-stakeados-dark text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </div>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed sidebar */}
                {layoutPreferences.sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gaming-card border border-stakeados-gray-600 rounded-gaming shadow-glow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-stakeados-gray-400 mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          layoutPreferences.sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-gaming-card/95 backdrop-blur-lg border-b border-stakeados-gray-700">
          <div
            className={cn(
              'flex items-center justify-between px-4',
              layoutPreferences.density === 'compact' ? 'py-2' : 'py-3',
              layoutPreferences.density === 'spacious' ? 'py-4' : ''
            )}
          >
            {/* Left side - Mobile menu button and breadcrumbs */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                title={t('layout.openMenu')}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Back to main site link */}
              <Link
                href={`/${locale}`}
                className="hidden sm:flex items-center gap-2 text-stakeados-gray-300 hover:text-stakeados-primary transition-colors text-sm"
                title={t('layout.backToSite')}
              >
                <Home className="w-4 h-4" />
                <span>{t('layout.backToSite')}</span>
              </Link>

              {/* Enhanced Breadcrumb Navigation */}
              <div className="hidden md:block">
                <Breadcrumb
                  items={breadcrumbItems}
                  showHome={false}
                  className={cn(
                    'text-sm',
                    layoutPreferences.density === 'compact' && 'text-xs'
                  )}
                />
              </div>
            </div>

            {/* Right side - Actions and user menu */}
            <div className="flex items-center gap-2">
              {/* Quick search */}
              <button
                className="p-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                title={t('layout.quickSearch')}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Quick add button */}
              <button
                className="p-2 text-stakeados-gray-300 hover:text-stakeados-primary hover:bg-stakeados-primary/10 rounded-gaming transition-colors"
                title={t('layout.quickAdd')}
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Layout customization button */}
              <button
                onClick={() => setShowLayoutCustomization(true)}
                className="p-2 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-700 rounded-gaming transition-colors"
                title={t('layout.customization.title')}
              >
                {layoutPreferences.sidebarCollapsed ? (
                  <Maximize2 className="w-5 h-5" />
                ) : (
                  <Minimize2 className="w-5 h-5" />
                )}
              </button>

              {/* Help System */}
              <HelpSystem />

              {/* Contextual Help */}
              <ContextualHelp
                page={pathname.split('/').pop() || 'dashboard'}
                section={
                  pathname.includes('/')
                    ? pathname.split('/').slice(-2)[0]
                    : undefined
                }
              />

              {/* Notifications */}
              <RealTimeNotificationCenter />
              <AdminNotificationSystem />

              {/* Theme toggle */}
              <AdminThemeToggle
                theme={layoutPreferences.theme}
                onToggle={toggleTheme}
              />

              {/* User menu */}
              <AdminUserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={cn(
            'transition-all duration-300',
            layoutPreferences.density === 'compact'
              ? 'p-3'
              : 'p-4 sm:p-6 lg:p-8',
            layoutPreferences.density === 'spacious' ? 'p-6 sm:p-8 lg:p-12' : ''
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
