import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NavigationSection } from '@/types/navigation';
import { defaultNavigationConfig } from './config';

export interface RouteProtectionConfig {
  path: string;
  requiredAuth?: boolean;
  requiredRoles?: string[];
  isImplemented?: boolean;
  redirectTo?: string;
}

// Route configurations for protection
export const protectedRoutes: RouteProtectionConfig[] = [
  {
    path: '/articles',
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Sistema de Artículos&description=Estamos desarrollando un completo sistema de gestión de artículos con categorías, búsqueda avanzada y comentarios.&estimated=Q2 2024'
  },
  {
    path: '/news',
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Sistema de Noticias&description=Estamos creando un sistema de noticias en tiempo real con notificaciones y categorización automática.&estimated=Q2 2024'
  },
  {
    path: '/community',
    requiredAuth: true,
    requiredRoles: ['student', 'instructor', 'admin'],
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Comunidad&description=Estamos construyendo un espacio de comunidad con foros, chat en tiempo real y eventos virtuales.&estimated=Q3 2024'
  },
  {
    path: '/courses',
    requiredAuth: true,
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Sistema de Cursos&description=Estamos desarrollando una plataforma completa de cursos con videos, ejercicios interactivos y certificaciones.&estimated=Q4 2024'
  },
  {
    path: '/profile',
    requiredAuth: true,
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Perfil de Usuario&description=Estamos creando un sistema completo de perfiles con estadísticas, logros y configuración personalizada.&estimated=Q2 2024'
  },
  {
    path: '/settings',
    requiredAuth: true,
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Configuración&description=Estamos desarrollando un panel de configuración completo con preferencias de notificaciones, privacidad y personalización.&estimated=Q2 2024'
  },
  {
    path: '/admin/users',
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Gestión de Usuarios&description=Estamos creando herramientas avanzadas para la gestión y administración de usuarios.&estimated=Q3 2024'
  },
  {
    path: '/admin/content',
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Gestión de Contenido&description=Estamos desarrollando un CMS completo para la gestión de contenido de la plataforma.&estimated=Q3 2024'
  },
  {
    path: '/admin/analytics',
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Analytics&description=Estamos implementando un sistema completo de analytics y métricas para administradores.&estimated=Q4 2024'
  },
  {
    path: '/admin/settings',
    requiredAuth: true,
    requiredRoles: ['admin'],
    isImplemented: false,
    redirectTo: '/coming-soon?feature=Configuración del Sistema&description=Estamos creando herramientas para la configuración avanzada del sistema.&estimated=Q4 2024'
  }
];

/**
 * Find route configuration for a given path
 */
export function findRouteConfig(pathname: string): RouteProtectionConfig | null {
  // Remove locale from path for matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';
  
  return protectedRoutes.find(route => {
    // Exact match
    if (route.path === pathWithoutLocale) {
      return true;
    }
    
    // Prefix match for nested routes
    if (pathWithoutLocale.startsWith(route.path + '/')) {
      return true;
    }
    
    return false;
  }) || null;
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRole: string | null, requiredRoles?: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  
  if (!userRole) {
    return false;
  }
  
  return requiredRoles.includes(userRole);
}

/**
 * Get user role from request (server-side)
 */
export async function getUserRole(request: NextRequest): Promise<string | null> {
  try {
    // This is a simplified version - in a real app you'd get this from your user profile/role system
    // For now, we'll return null and let the client-side handle role checking
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Check for session cookie or token
    const sessionCookie = request.cookies.get('sb-access-token');
    return !!sessionCookie;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Create redirect response with proper locale handling
 */
export function createRedirectResponse(request: NextRequest, redirectPath: string): NextResponse {
  const url = request.nextUrl.clone();
  
  // Extract locale from current path
  const locale = url.pathname.match(/^\/([a-z]{2}(-[A-Z]{2})?)/)?.[1] || 'es';
  
  // Handle absolute URLs
  if (redirectPath.startsWith('http')) {
    return NextResponse.redirect(redirectPath);
  }
  
  // Handle relative URLs - add locale prefix
  if (!redirectPath.startsWith(`/${locale}`)) {
    redirectPath = `/${locale}${redirectPath}`;
  }
  
  url.pathname = redirectPath;
  return NextResponse.redirect(url);
}

/**
 * Main route protection middleware function
 */
export async function protectRoute(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Skip protection for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/coming-soon') ||
    pathname.includes('/access-denied') ||
    pathname.includes('/not-found') ||
    pathname === '/' ||
    pathname.match(/^\/[a-z]{2}(-[A-Z]{2})?$/) // Just locale root
  ) {
    return null;
  }
  
  // Find route configuration
  const routeConfig = findRouteConfig(pathname);
  
  if (!routeConfig) {
    // No specific protection needed
    return null;
  }
  
  // Check if route is implemented
  if (routeConfig.isImplemented === false && routeConfig.redirectTo) {
    return createRedirectResponse(request, routeConfig.redirectTo);
  }
  
  // Check authentication requirement
  if (routeConfig.requiredAuth) {
    const userIsAuthenticated = await isAuthenticated(request);
    
    if (!userIsAuthenticated) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return createRedirectResponse(request, loginUrl);
    }
    
    // Check role requirements
    if (routeConfig.requiredRoles && routeConfig.requiredRoles.length > 0) {
      const userRole = await getUserRole(request);
      
      if (!hasRequiredRole(userRole, routeConfig.requiredRoles)) {
        const accessDeniedUrl = `/access-denied?reason=insufficient-role&feature=${encodeURIComponent(pathname)}`;
        return createRedirectResponse(request, accessDeniedUrl);
      }
    }
  }
  
  return null;
}

/**
 * Helper to update route implementation status
 */
export function updateRouteImplementation(path: string, isImplemented: boolean): void {
  const routeIndex = protectedRoutes.findIndex(route => route.path === path);
  
  if (routeIndex !== -1) {
    protectedRoutes[routeIndex].isImplemented = isImplemented;
  }
}

/**
 * Helper to get all unimplemented routes
 */
export function getUnimplementedRoutes(): RouteProtectionConfig[] {
  return protectedRoutes.filter(route => route.isImplemented === false);
}

/**
 * Helper to get routes accessible to a user role
 */
export function getAccessibleRoutes(userRole: string | null, isAuthenticated: boolean): RouteProtectionConfig[] {
  return protectedRoutes.filter(route => {
    // Skip unimplemented routes
    if (route.isImplemented === false) {
      return false;
    }
    
    // Check authentication requirement
    if (route.requiredAuth && !isAuthenticated) {
      return false;
    }
    
    // Check role requirements
    if (route.requiredRoles && !hasRequiredRole(userRole, route.requiredRoles)) {
      return false;
    }
    
    return true;
  });
}