import { redirect } from 'next/navigation';
import type { NavigationSection, UserMenuItem } from '@/types/navigation';

export interface AccessControlOptions {
  redirectToLogin?: boolean;
  loginRedirectUrl?: string;
  showAccessDenied?: boolean;
  accessDeniedUrl?: string;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: 'not-authenticated' | 'insufficient-role' | 'not-implemented';
  redirectUrl?: string;
}

/**
 * Check if user has access to a navigation section
 */
export function checkSectionAccess(
  section: NavigationSection,
  isAuthenticated: boolean,
  userRole?: string | null
): AccessCheckResult {
  // Check if feature is implemented
  if (!section.isImplemented) {
    return {
      hasAccess: false,
      reason: 'not-implemented'
    };
  }

  // Check authentication requirement
  if (section.requiredAuth && !isAuthenticated) {
    return {
      hasAccess: false,
      reason: 'not-authenticated',
      redirectUrl: `/login?redirect=${encodeURIComponent(section.href)}`
    };
  }

  // Check role requirements
  if (section.requiredRoles && section.requiredRoles.length > 0) {
    if (!userRole || !section.requiredRoles.includes(userRole)) {
      return {
        hasAccess: false,
        reason: 'insufficient-role',
        redirectUrl: '/access-denied'
      };
    }
  }

  return { hasAccess: true };
}

/**
 * Check if user has access to a user menu item
 */
export function checkUserMenuAccess(
  item: UserMenuItem,
  isAuthenticated: boolean,
  userRole?: string | null
): AccessCheckResult {
  // Check if feature is implemented
  if (!item.isImplemented) {
    return {
      hasAccess: false,
      reason: 'not-implemented'
    };
  }

  // Check authentication requirement
  if (item.requiredAuth && !isAuthenticated) {
    return {
      hasAccess: false,
      reason: 'not-authenticated',
      redirectUrl: `/login?redirect=${encodeURIComponent(item.href)}`
    };
  }

  return { hasAccess: true };
}

/**
 * Enforce access control for a route (server-side)
 */
export function enforceRouteAccess(
  section: NavigationSection,
  isAuthenticated: boolean,
  userRole?: string | null,
  options: AccessControlOptions = {}
): void {
  const accessResult = checkSectionAccess(section, isAuthenticated, userRole);

  if (!accessResult.hasAccess) {
    switch (accessResult.reason) {
      case 'not-authenticated':
        if (options.redirectToLogin !== false) {
          const loginUrl = options.loginRedirectUrl || `/login?redirect=${encodeURIComponent(section.href)}`;
          redirect(loginUrl);
        }
        break;

      case 'insufficient-role':
        if (options.showAccessDenied !== false) {
          const accessDeniedUrl = options.accessDeniedUrl || '/access-denied';
          redirect(accessDeniedUrl);
        }
        break;

      case 'not-implemented':
        redirect('/coming-soon');
        break;
    }
  }
}

/**
 * Get filtered navigation sections based on user permissions
 */
export function getAccessibleSections(
  sections: NavigationSection[],
  isAuthenticated: boolean,
  userRole?: string | null,
  includeNotImplemented: boolean = false
): NavigationSection[] {
  return sections.filter(section => {
    const accessResult = checkSectionAccess(section, isAuthenticated, userRole);
    
    // Always include if user has access
    if (accessResult.hasAccess) {
      return true;
    }

    // Include not implemented sections if requested (for showing "coming soon" badges)
    if (includeNotImplemented && accessResult.reason === 'not-implemented') {
      return true;
    }

    return false;
  });
}

/**
 * Get filtered user menu items based on user permissions
 */
export function getAccessibleUserMenuItems(
  items: UserMenuItem[],
  isAuthenticated: boolean,
  userRole?: string | null,
  includeNotImplemented: boolean = false
): UserMenuItem[] {
  return items.filter(item => {
    const accessResult = checkUserMenuAccess(item, isAuthenticated, userRole);
    
    // Always include if user has access
    if (accessResult.hasAccess) {
      return true;
    }

    // Include not implemented items if requested (for showing "coming soon" badges)
    if (includeNotImplemented && accessResult.reason === 'not-implemented') {
      return true;
    }

    return false;
  });
}

/**
 * Create a safe navigation function that checks access before navigating
 */
export function createSafeNavigate(
  navigate: (href: string) => void,
  showComingSoonModal: (featureName: string) => void,
  showAccessDeniedMessage: () => void
) {
  return function safeNavigate(
    href: string,
    section: NavigationSection,
    isAuthenticated: boolean,
    userRole?: string | null
  ) {
    const accessResult = checkSectionAccess(section, isAuthenticated, userRole);

    if (!accessResult.hasAccess) {
      switch (accessResult.reason) {
        case 'not-implemented':
          showComingSoonModal(section.label);
          return;

        case 'not-authenticated':
          navigate(accessResult.redirectUrl || `/login?redirect=${encodeURIComponent(href)}`);
          return;

        case 'insufficient-role':
          showAccessDeniedMessage();
          return;
      }
    }

    navigate(href);
  };
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: string | null | undefined,
  requiredRoles?: string[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: string | null | undefined): boolean {
  return userRole === 'admin';
}

/**
 * Get user-friendly error message for access denial
 */
export function getAccessDeniedMessage(
  reason: AccessCheckResult['reason'],
  featureName?: string
): string {
  switch (reason) {
    case 'not-authenticated':
      return 'Debes iniciar sesión para acceder a esta funcionalidad.';
    
    case 'insufficient-role':
      return 'No tienes permisos suficientes para acceder a esta funcionalidad.';
    
    case 'not-implemented':
      return `La funcionalidad "${featureName}" está en desarrollo y estará disponible pronto.`;
    
    default:
      return 'No tienes acceso a esta funcionalidad.';
  }
}