import type { BreadcrumbItem, BreadcrumbConfig, RouteConfig } from '@/types/navigation';

// Route configurations for breadcrumb generation
export const routeConfigs: RouteConfig[] = [
  {
    path: '/',
    breadcrumbs: [],
    isImplemented: true
  },
  {
    path: '/articles',
    breadcrumbs: [
      { label: 'Artículos', href: '/articles' }
    ],
    isImplemented: false
  },
  {
    path: '/articles/categories',
    breadcrumbs: [
      { label: 'Artículos', href: '/articles' },
      { label: 'Categorías', href: '/articles/categories' }
    ],
    isImplemented: false
  },
  {
    path: '/articles/[slug]',
    breadcrumbs: [
      { label: 'Artículos', href: '/articles' },
      { label: 'Artículo', dynamic: true }
    ],
    isImplemented: false
  },
  {
    path: '/news',
    breadcrumbs: [
      { label: 'Noticias', href: '/news' }
    ],
    isImplemented: false
  },
  {
    path: '/news/[slug]',
    breadcrumbs: [
      { label: 'Noticias', href: '/news' },
      { label: 'Noticia', dynamic: true }
    ],
    isImplemented: false
  },
  {
    path: '/community',
    breadcrumbs: [
      { label: 'Comunidad', href: '/community' }
    ],
    requiredAuth: true,
    isImplemented: false
  },
  {
    path: '/courses',
    breadcrumbs: [
      { label: 'Cursos', href: '/courses' }
    ],
    requiredAuth: true,
    isImplemented: false
  },
  {
    path: '/courses/[id]',
    breadcrumbs: [
      { label: 'Cursos', href: '/courses' },
      { label: 'Curso', dynamic: true }
    ],
    requiredAuth: true,
    isImplemented: false
  },
  {
    path: '/profile',
    breadcrumbs: [
      { label: 'Mi Perfil', href: '/profile' }
    ],
    requiredAuth: true,
    isImplemented: false
  },
  {
    path: '/settings',
    breadcrumbs: [
      { label: 'Configuración', href: '/settings' }
    ],
    requiredAuth: true,
    isImplemented: false
  },
  {
    path: '/admin',
    breadcrumbs: [
      { label: 'Administración', href: '/admin' }
    ],
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: true
  },
  {
    path: '/admin/users',
    breadcrumbs: [
      { label: 'Administración', href: '/admin' },
      { label: 'Usuarios', href: '/admin/users' }
    ],
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false
  },
  {
    path: '/admin/content',
    breadcrumbs: [
      { label: 'Administración', href: '/admin' },
      { label: 'Contenido', href: '/admin/content' }
    ],
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false
  },
  {
    path: '/admin/analytics',
    breadcrumbs: [
      { label: 'Administración', href: '/admin' },
      { label: 'Analytics', href: '/admin/analytics' }
    ],
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false
  },
  {
    path: '/admin/settings',
    breadcrumbs: [
      { label: 'Administración', href: '/admin' },
      { label: 'Configuración', href: '/admin/settings' }
    ],
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false
  }
];

/**
 * Generate breadcrumbs for a given pathname
 */
export function generateBreadcrumbs(
  pathname: string,
  dynamicParams?: Record<string, string>
): BreadcrumbItem[] {
  // Find matching route configuration
  const routeConfig = findRouteConfig(pathname);
  
  if (!routeConfig || routeConfig.breadcrumbs.length === 0) {
    return [];
  }

  // Convert breadcrumb configs to breadcrumb items
  return routeConfig.breadcrumbs.map((config, index) => {
    const isLast = index === routeConfig.breadcrumbs.length - 1;
    
    if (config.dynamic) {
      // Handle dynamic routes - always use the dynamic label generation
      const dynamicLabel = getDynamicLabel(pathname, config.label, dynamicParams);
      return {
        label: dynamicLabel,
        href: isLast ? undefined : pathname,
        isCurrentPage: isLast
      };
    }

    return {
      label: config.label,
      href: isLast ? undefined : config.href,
      isCurrentPage: isLast
    };
  });
}

/**
 * Find route configuration for a given pathname
 */
export function findRouteConfig(pathname: string): RouteConfig | undefined {
  // First try exact match
  const exactMatch = routeConfigs.find(config => config.path === pathname);
  if (exactMatch) {
    return exactMatch;
  }

  // Then try dynamic route matching
  return routeConfigs.find(config => {
    if (!config.path.includes('[')) {
      return false;
    }

    const configSegments = config.path.split('/');
    const pathSegments = pathname.split('/');

    if (configSegments.length !== pathSegments.length) {
      return false;
    }

    return configSegments.every((segment, index) => {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return true; // Dynamic segment matches anything
      }
      return segment === pathSegments[index];
    });
  });
}

/**
 * Get dynamic label for breadcrumb
 */
function getDynamicLabel(
  pathname: string,
  defaultLabel: string,
  dynamicParams?: Record<string, string>
): string {
  // Extract dynamic parameter from pathname
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];

  // If we have dynamic params, use them first
  if (dynamicParams) {
    // Try to get a more descriptive label from dynamic params
    if (dynamicParams.title) {
      return dynamicParams.title;
    }
    
    if (dynamicParams.name) {
      return dynamicParams.name;
    }

    if (dynamicParams.slug) {
      // Convert slug to readable format
      return dynamicParams.slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  // Always format the last segment for dynamic routes, even without params
  if (lastSegment && lastSegment !== '') {
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Fallback to default label only if no segment available
  return defaultLabel;
}

/**
 * Check if user can access a route based on breadcrumb configuration
 */
export function canAccessRoute(
  pathname: string,
  isAuthenticated: boolean,
  userRole?: string | null
): boolean {
  const routeConfig = findRouteConfig(pathname);
  
  if (!routeConfig) {
    return true; // Allow access to unconfigured routes
  }

  // Check authentication requirement
  if (routeConfig.requiredAuth && !isAuthenticated) {
    return false;
  }

  // Check role requirements
  if (routeConfig.requiredRoles && routeConfig.requiredRoles.length > 0) {
    if (!userRole || !routeConfig.requiredRoles.includes(userRole)) {
      return false;
    }
  }

  return true;
}

/**
 * Get breadcrumbs for current route with access control
 */
export function getBreadcrumbsForRoute(
  pathname: string,
  isAuthenticated: boolean,
  userRole?: string | null,
  dynamicParams?: Record<string, string>
): BreadcrumbItem[] {
  // Check if user can access this route
  if (!canAccessRoute(pathname, isAuthenticated, userRole)) {
    return [];
  }

  return generateBreadcrumbs(pathname, dynamicParams);
}

/**
 * Add a new route configuration
 */
export function addRouteConfig(config: RouteConfig): void {
  const existingIndex = routeConfigs.findIndex(c => c.path === config.path);
  
  if (existingIndex >= 0) {
    routeConfigs[existingIndex] = config;
  } else {
    routeConfigs.push(config);
  }
}

/**
 * Update route configuration implementation status
 */
export function updateRouteImplementation(
  path: string,
  isImplemented: boolean
): void {
  const config = routeConfigs.find(c => c.path === path);
  if (config) {
    config.isImplemented = isImplemented;
  }
}

/**
 * Get all route configurations
 */
export function getAllRouteConfigs(): RouteConfig[] {
  return [...routeConfigs];
}

/**
 * Get implemented route configurations only
 */
export function getImplementedRouteConfigs(): RouteConfig[] {
  return routeConfigs.filter(config => config.isImplemented);
}