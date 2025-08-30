'use client';

import { useNavigation } from '@/components/navigation/NavigationProvider';
import type { NavigationSection, UserMenuItem } from '@/types/navigation';

/**
 * Custom hook for consuming navigation state and utilities
 * This hook provides a clean interface for components to access navigation functionality
 */
export function useNavigationState() {
  const navigation = useNavigation();

  return {
    // Core state
    user: navigation.user,
    userRole: navigation.userRole,
    currentPath: navigation.currentPath,
    isLoading: navigation.isLoading,
    isNavigating: navigation.isNavigating,
    isAuthenticated: navigation.isAuthenticated,
    navigationHistory: navigation.navigationHistory,
    
    // Menu state
    isMobileMenuOpen: navigation.isMobileMenuOpen,
    isSearchOpen: navigation.isSearchOpen,
    
    // Navigation methods
    navigate: navigation.navigate,
    safeNavigate: navigation.safeNavigate,
    goBack: navigation.goBack,
    goForward: navigation.goForward,
    canGoBack: navigation.canGoBack,
    canGoForward: navigation.canGoForward,
    
    // Menu controls
    openMobileMenu: navigation.openMobileMenu,
    closeMobileMenu: navigation.closeMobileMenu,
    toggleMobileMenu: navigation.toggleMobileMenu,
    openSearch: navigation.openSearch,
    closeSearch: navigation.closeSearch,
    toggleSearch: navigation.toggleSearch,
    
    // Filtered navigation items
    visibleSections: navigation.getVisibleSections(),
    userMenuItems: navigation.getUserMenuItems(),
    adminMenuItems: navigation.getAdminMenuItems(),
    
    // Utility methods
    hasRequiredRole: navigation.hasRequiredRole,
    handleUserMenuAction: navigation.handleUserMenuAction,
    
    // Configuration
    config: navigation.config,
  };
}

/**
 * Hook for checking if a specific navigation section is accessible
 */
export function useNavigationAccess(sectionId: string) {
  const { config, isAuthenticated, hasRequiredRole } = useNavigationState();
  
  const section = config.sections.find(s => s.id === sectionId);
  
  if (!section) {
    return {
      isAccessible: false,
      isImplemented: false,
      reason: 'Section not found',
    };
  }
  
  if (!section.isImplemented) {
    return {
      isAccessible: false,
      isImplemented: false,
      reason: 'Not implemented',
    };
  }
  
  if (section.requiredAuth && !isAuthenticated) {
    return {
      isAccessible: false,
      isImplemented: true,
      reason: 'Authentication required',
    };
  }
  
  if (section.requiredRoles && !hasRequiredRole(section.requiredRoles)) {
    return {
      isAccessible: false,
      isImplemented: true,
      reason: 'Insufficient permissions',
    };
  }
  
  return {
    isAccessible: true,
    isImplemented: true,
    reason: null,
  };
}

/**
 * Hook for getting navigation sections filtered by implementation status
 */
export function useImplementedSections() {
  const { config } = useNavigationState();
  
  const implementedSections = config.sections.filter(section => section.isImplemented);
  const unimplementedSections = config.sections.filter(section => !section.isImplemented);
  
  return {
    implementedSections,
    unimplementedSections,
    totalSections: config.sections.length,
    implementationProgress: (implementedSections.length / config.sections.length) * 100,
  };
}