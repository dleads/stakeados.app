import type { User } from '@supabase/supabase-js';

// Navigation section configuration
export interface NavigationSection {
  id: string;
  label: string;
  href: string;
  icon?: string;
  requiredAuth?: boolean;
  requiredRoles?: string[];
  isImplemented: boolean;
  isExternal?: boolean;
  children?: NavigationSection[];
  badge?: {
    text: string;
    variant: 'new' | 'beta' | 'coming-soon';
  };
}

// User menu item configuration
export interface UserMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  requiredAuth: boolean;
  isImplemented: boolean;
  action?: 'logout' | 'navigate';
}

// Complete navigation configuration
export interface NavigationConfig {
  sections: NavigationSection[];
  userMenuItems: UserMenuItem[];
  adminMenuItems: UserMenuItem[];
}

// Navigation state
export interface NavigationState {
  user: User | null;
  userRole: string | null;
  currentPath: string;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isLoading: boolean;
  isNavigating: boolean;
  navigationHistory: string[];
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

// Route configuration for breadcrumbs
export interface RouteConfig {
  path: string;
  breadcrumbs: BreadcrumbConfig[];
  requiredAuth?: boolean;
  requiredRoles?: string[];
  isImplemented: boolean;
}

export interface BreadcrumbConfig {
  label: string;
  href?: string;
  dynamic?: boolean; // For dynamic routes like /articles/[slug]
}

// Navigation context type
export interface NavigationContextType extends NavigationState {
  // Navigation configuration
  config: NavigationConfig;
  
  // Navigation methods
  navigate: (href: string, options?: { replace?: boolean; scroll?: boolean }) => void;
  safeNavigate: (href: string, section: NavigationSection, options?: { replace?: boolean; scroll?: boolean }) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Menu state methods
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  
  // Breadcrumb methods
  getBreadcrumbs: (pathname?: string, dynamicParams?: Record<string, string>) => BreadcrumbItem[];
  
  // Utility methods
  isAuthenticated: boolean;
  hasRequiredRole: (requiredRoles?: string[]) => boolean;
  getVisibleSections: () => NavigationSection[];
  getUserMenuItems: () => UserMenuItem[];
  getAdminMenuItems: () => UserMenuItem[];
  
  // User menu actions
  handleUserMenuAction: (item: UserMenuItem) => Promise<void>;
}