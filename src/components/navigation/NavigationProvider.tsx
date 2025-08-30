'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useRole } from '@/components/auth/RoleProvider';
import { useComingSoon } from '@/hooks/useComingSoon';
import { LazyWrapper, NavigationSkeletons } from './optimization/LazyWrapper';
import { 
  LazySearchInterface, 
  LazyMobileMenu, 
  LazyComingSoonModal,
  preloadOnHover 
} from './lazy';
import { createSafeNavigate, getAccessDeniedMessage } from '@/lib/navigation/access-control';
import type {
  NavigationSection,
  UserMenuItem,
  NavigationConfig,
  NavigationContextType,
  BreadcrumbItem,
} from '@/types/navigation';
import { defaultNavigationConfig } from '@/lib/navigation/config';
import { getBreadcrumbsForRoute } from '@/lib/navigation/breadcrumbs';
import { navigationConfigManager } from '@/lib/navigation/config-manager';

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

export interface NavigationProviderProps {
  children: React.ReactNode;
  config?: NavigationConfig;
}

export function NavigationProvider({
  children,
  config: initialConfig,
}: NavigationProviderProps) {
  // Use configuration manager for dynamic config
  const [config, setConfig] = useState<NavigationConfig>(() => 
    initialConfig || navigationConfigManager.getConfig()
  );

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribe = navigationConfigManager.subscribe(setConfig);
    return unsubscribe;
  }, []);
  // Auth and routing hooks
  const { user, loading: authLoading, signOut } = useAuthContext();
  const { role, loading: roleLoading } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  
  // Coming soon modal hook
  const {
    isComingSoonOpen,
    comingSoonFeatureName,
    comingSoonDescription,
    comingSoonEstimatedDate,
    showComingSoonModal,
    hideComingSoonModal,
    showComingSoonForSection,
  } = useComingSoon();
  
  // Local state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  
  // Computed state
  const isLoading = authLoading || roleLoading || isNavigating;
  const isAuthenticated = !!user;

  // Handle route changes and browser navigation
  useEffect(() => {
    // Track navigation history for back/forward support
    setNavigationHistory(prev => {
      const newHistory = [...prev];
      if (newHistory[newHistory.length - 1] !== pathname) {
        newHistory.push(pathname);
        // Keep only last 10 entries to prevent memory issues
        return newHistory.slice(-10);
      }
      return newHistory;
    });

    // Handle route change completion
    setIsNavigating(false);

    // Close mobile menu on route change
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // Close search on route change
    if (isSearchOpen) {
      setIsSearchOpen(false);
    }

    // Log route change for analytics
    console.log('Route changed:', pathname);
  }, [pathname, isMobileMenuOpen, isSearchOpen]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('Browser navigation detected:', event.state);
      // The router will handle the actual navigation
      // We just need to update our internal state
      setIsNavigating(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle navigation start (for loading states)
  useEffect(() => {
    // Note: Next.js App Router doesn't have router events like Pages Router
    // We handle loading states through the navigate function instead
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Enhanced navigation methods with Next.js integration
  const navigate = useCallback((href: string, options?: { replace?: boolean; scroll?: boolean }) => {
    try {
      // Validate URL format
      if (!href || typeof href !== 'string') {
        console.error('Invalid navigation href:', href);
        return;
      }

      // Handle external URLs
      if (href.startsWith('http://') || href.startsWith('https://')) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }

      // Handle anchor links
      if (href.startsWith('#')) {
        const element = document.getElementById(href.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // Set loading state for smooth transitions
      setIsNavigating(true);

      // Use Next.js router for internal navigation
      if (options?.replace) {
        router.replace(href, { scroll: options?.scroll ?? true });
      } else {
        router.push(href, { scroll: options?.scroll ?? true });
      }

      // Close mobile menu on navigation
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }

      // Log navigation for analytics
      console.log('Navigation:', { from: pathname, to: href, options });
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
      // Fallback to window.location for critical navigation
      window.location.href = href;
    }
  }, [router, pathname, isMobileMenuOpen]);

  // Browser navigation helpers
  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      router.back();
    } else {
      // If no history, go to home
      const currentLocale = pathname.split('/')[1] || 'es';
      navigate(`/${currentLocale}`);
    }
  }, [router, navigationHistory, pathname, navigate]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  const canGoBack = navigationHistory.length > 1;
  const canGoForward = typeof window !== 'undefined' && window.history.length > 1;
  
  const hasRequiredRole = (requiredRoles?: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!role) return false;
    return requiredRoles.includes(role);
  };
  
  const showAccessDeniedMessage = useCallback(() => {
    const message = getAccessDeniedMessage('insufficient-role');
    setAccessDeniedMessage(message);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setAccessDeniedMessage(null);
    }, 5000);
    
    // Log for security/audit purposes
    console.log(`Access denied for user: ${user?.email}, role: ${role}, path: ${pathname}`);
  }, [user?.email, role, pathname]);
  
  // Create safe navigate function using the access control utility
  const safeNavigate = useCallback(
    createSafeNavigate(
      (href: string) => navigate(href),
      (featureName: string) => showComingSoonModal(featureName),
      showAccessDeniedMessage
    ),
    [navigate, showComingSoonModal, showAccessDeniedMessage]
  );

  // Enhanced safe navigate that works with NavigationSection
  const safeNavigateToSection = useCallback((href: string, section: NavigationSection, options?: { replace?: boolean; scroll?: boolean }) => {
    // Check if feature is implemented
    if (!section.isImplemented) {
      showComingSoonForSection(section.id);
      return;
    }
    
    // Check authentication requirement
    if (section.requiredAuth && !isAuthenticated) {
      // Preserve the intended destination for redirect after login
      const currentLocale = pathname.split('/')[1] || 'es';
      const redirectUrl = `/${currentLocale}/auth/login?redirect=${encodeURIComponent(href)}`;
      navigate(redirectUrl, { replace: true });
      return;
    }
    
    // Check role requirements
    if (section.requiredRoles && !hasRequiredRole(section.requiredRoles)) {
      showAccessDeniedMessage();
      return;
    }
    
    // Check if it's an external link
    if (section.isExternal) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // All checks passed, navigate safely
    navigate(href, options);
    
    // Log successful navigation for analytics
    console.log(`Navigation successful: ${section.label} -> ${href}`);
  }, [navigate, pathname, isAuthenticated, hasRequiredRole, showComingSoonForSection, showAccessDeniedMessage]);
  
  // Enhanced filter methods with comprehensive logic
  const getVisibleSections = (): NavigationSection[] => {
    return config.sections.filter(section => {
      // Always show public sections (no auth required)
      if (!section.requiredAuth) return true;
      
      // Hide auth-required sections if user not authenticated
      if (section.requiredAuth && !isAuthenticated) return false;
      
      // Check role requirements if specified
      if (section.requiredRoles && section.requiredRoles.length > 0) {
        if (!hasRequiredRole(section.requiredRoles)) {
          return false;
        }
      }
      
      // Show section if all checks pass
      return true;
    });
  };
  
  const getUserMenuItems = (): UserMenuItem[] => {
    return config.userMenuItems.filter(item => {
      // Filter based on authentication requirement
      if (item.requiredAuth && !isAuthenticated) return false;
      
      // Always show logout if authenticated (special case)
      if (item.action === 'logout' && isAuthenticated) return true;
      
      return true;
    });
  };
  
  const getAdminMenuItems = (): UserMenuItem[] => {
    // Only show admin items if user is authenticated and has admin role
    if (!isAuthenticated) return [];
    
    // Check if user has admin role or admin permissions
    const isAdmin = role === 'admin' || hasRequiredRole(['admin']);
    
    if (!isAdmin) return [];
    
    return config.adminMenuItems;
  };
  
  // Breadcrumb methods
  const getBreadcrumbs = (
    targetPathname?: string,
    dynamicParams?: Record<string, string>
  ): BreadcrumbItem[] => {
    const pathToUse = targetPathname || pathname;
    return getBreadcrumbsForRoute(pathToUse, isAuthenticated, role, dynamicParams);
  };

  // Menu state methods
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  
  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  // Enhanced user menu action handler
  const handleUserMenuAction = async (item: UserMenuItem) => {
    try {
      if (item.action === 'logout') {
        // Enhanced logout with proper cleanup
        console.log('User logout initiated');
        const result = await signOut();
        
        if (result.error) {
          console.error('Logout error:', result.error);
          // Could show error message to user
        } else {
          console.log('User logged out successfully');
          // Redirect to home page after successful logout
          router.push('/');
        }
      } else if (item.action === 'navigate') {
        // Check if the menu item is implemented before navigating
        if (!item.isImplemented) {
          showComingSoonModal(item.label);
          return;
        }
        
        navigate(item.href);
      }
    } catch (error) {
      console.error('Error handling user menu action:', error);
      // Could show error message to user
    }
  };
  
  // Navigation state
  const navigationState: NavigationContextType = {
    // State
    user,
    userRole: role,
    currentPath: pathname,
    isMobileMenuOpen,
    isSearchOpen,
    isLoading,
    isNavigating,
    navigationHistory,
    
    // Configuration
    config,
    
    // Navigation methods
    navigate,
    safeNavigate: safeNavigateToSection,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    
    // Menu state methods
    openSearch,
    closeSearch,
    toggleSearch,
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    
    // Breadcrumb methods
    getBreadcrumbs,
    
    // Utility methods
    isAuthenticated,
    hasRequiredRole,
    getVisibleSections,
    getUserMenuItems,
    getAdminMenuItems,
    
    // User menu actions
    handleUserMenuAction,
  };
  
  return (
    <NavigationContext.Provider value={navigationState}>
      {children}

      {/* Global Navigation Components - Lazy Loaded */}
      <LazyWrapper
        componentName="SearchInterface"
        fallback={<NavigationSkeletons.SearchInterface />}
        preloadOnHover={true}
      >
        <LazySearchInterface isOpen={isSearchOpen} onClose={closeSearch} />
      </LazyWrapper>

      <LazyWrapper
        componentName="MobileMenu"
        fallback={<NavigationSkeletons.MobileMenu />}
        preloadOnHover={true}
      >
        <LazyMobileMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
      </LazyWrapper>

      {/* Coming Soon Modal - Lazy Loaded */}
      <LazyWrapper
        componentName="ComingSoonModal"
        fallback={null}
      >
        <LazyComingSoonModal
          isOpen={isComingSoonOpen}
          onClose={hideComingSoonModal}
          featureName={comingSoonFeatureName}
          description={comingSoonDescription}
          estimatedDate={comingSoonEstimatedDate}
        />
      </LazyWrapper>

      {/* Access Denied Message */}
      {accessDeniedMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-sm">
          <div className="flex">
            <div className="flex-1">
              <p className="text-sm">{accessDeniedMessage}</p>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}
