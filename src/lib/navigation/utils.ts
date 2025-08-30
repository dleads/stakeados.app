/**
 * Navigation utility functions for route matching and active state detection
 */

import type { NavigationSection } from '@/types/navigation';

/**
 * Enhanced route matching that handles various Next.js routing scenarios
 */
export function isRouteActive(
  currentPath: string,
  targetHref: string,
  section?: NavigationSection
): boolean {
  // Remove query parameters and hash for comparison
  const normalizedCurrentPath = currentPath.split('?')[0].split('#')[0];
  const normalizedTargetHref = targetHref.split('?')[0].split('#')[0];

  // Exact match for home page
  if (normalizedTargetHref === '/') {
    return normalizedCurrentPath === '/';
  }

  // Exact match
  if (normalizedCurrentPath === normalizedTargetHref) {
    return true;
  }

  // Check if current path is a child of the target section
  if (section?.children) {
    return section.children.some(child => 
      isRouteActive(currentPath, child.href, child)
    );
  }

  // Handle dynamic routes (e.g., /articles/[slug])
  if (normalizedTargetHref.includes('[') && normalizedTargetHref.includes(']')) {
    const pattern = normalizedTargetHref
      .replace(/\[([^\]]+)\]/g, '([^/]+)') // Replace [param] with regex group
      .replace(/\//g, '\\/'); // Escape forward slashes
    
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(normalizedCurrentPath);
  }

  // Path prefix matching for nested routes
  if (normalizedTargetHref.length > 1) {
    // Ensure we're matching complete path segments, not partial matches
    const targetSegments = normalizedTargetHref.split('/').filter(Boolean);
    const currentSegments = normalizedCurrentPath.split('/').filter(Boolean);
    
    if (targetSegments.length > currentSegments.length) {
      return false;
    }
    
    // Check if all target segments match the beginning of current segments
    return targetSegments.every((segment, index) => 
      currentSegments[index] === segment
    );
  }

  return false;
}

/**
 * Get the active navigation section based on current path
 */
export function getActiveSection(
  currentPath: string,
  sections: NavigationSection[]
): NavigationSection | null {
  // Find the most specific match (longest matching path)
  let bestMatch: NavigationSection | null = null;
  let bestMatchLength = 0;

  for (const section of sections) {
    const normalizedHref = section.href.split('?')[0].split('#')[0];
    const normalizedPath = currentPath.split('?')[0].split('#')[0];
    
    // Exact match
    if (normalizedPath === normalizedHref) {
      return section;
    }
    
    // Check if this section matches and is more specific than current best match
    if (isRouteActive(currentPath, section.href, section)) {
      if (normalizedHref.length > bestMatchLength) {
        bestMatch = section;
        bestMatchLength = normalizedHref.length;
      }
    }
  }

  return bestMatch;
}

/**
 * Generate breadcrumbs based on current path and navigation configuration
 */
export function generateBreadcrumbs(
  currentPath: string,
  sections: NavigationSection[]
): Array<{ label: string; href?: string; isCurrentPage?: boolean }> {
  const breadcrumbs: Array<{ label: string; href?: string; isCurrentPage?: boolean }> = [];
  const normalizedPath = currentPath.split('?')[0].split('#')[0];
  
  // Always start with home
  breadcrumbs.push({
    label: 'Inicio',
    href: '/',
    isCurrentPage: normalizedPath === '/'
  });

  // If we're on the home page, return just home
  if (normalizedPath === '/') {
    return breadcrumbs;
  }

  // Find the active section
  const activeSection = getActiveSection(currentPath, sections);
  
  if (activeSection) {
    const normalizedSectionHref = activeSection.href.split('?')[0].split('#')[0];
    
    // Add the main section
    breadcrumbs.push({
      label: activeSection.label,
      href: activeSection.href,
      isCurrentPage: normalizedPath === normalizedSectionHref
    });

    // If we're deeper than the main section, try to find child sections first
    if (normalizedPath !== normalizedSectionHref && activeSection.children) {
      const activeChild = activeSection.children.find(child => {
        const normalizedChildHref = child.href.split('?')[0].split('#')[0];
        return normalizedPath === normalizedChildHref;
      });
      
      if (activeChild) {
        breadcrumbs.push({
          label: activeChild.label,
          href: activeChild.href,
          isCurrentPage: true
        });
        return breadcrumbs;
      }
    }

    // Handle dynamic routes by parsing the path (when no matching child found)
    if (normalizedPath !== normalizedSectionHref) {
      const pathSegments = normalizedPath.split('/').filter(Boolean);
      const sectionSegments = normalizedSectionHref.split('/').filter(Boolean);
      
      // Add additional segments as breadcrumbs
      for (let i = sectionSegments.length; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const segmentPath = '/' + pathSegments.slice(0, i + 1).join('/');
        
        breadcrumbs.push({
          label: formatSegmentLabel(segment),
          href: segmentPath,
          isCurrentPage: segmentPath === normalizedPath
        });
      }
    }
  }

  return breadcrumbs;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegmentLabel(segment: string): string {
  // Handle common patterns
  if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return 'Detalle'; // UUID pattern
  }
  
  if (segment.match(/^\d+$/)) {
    return `ID: ${segment}`; // Numeric ID
  }
  
  // Convert kebab-case or snake_case to title case
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if a route requires authentication based on navigation configuration
 */
export function requiresAuthentication(
  path: string,
  sections: NavigationSection[]
): boolean {
  const activeSection = getActiveSection(path, sections);
  return activeSection?.requiredAuth ?? false;
}

/**
 * Check if a route requires specific roles based on navigation configuration
 */
export function getRequiredRoles(
  path: string,
  sections: NavigationSection[]
): string[] {
  const activeSection = getActiveSection(path, sections);
  return activeSection?.requiredRoles ?? [];
}

/**
 * Get navigation analytics data for tracking
 */
export function getNavigationAnalytics(
  fromPath: string,
  toPath: string,
  section?: NavigationSection
) {
  return {
    event: 'navigation',
    fromPath,
    toPath,
    sectionId: section?.id,
    sectionLabel: section?.label,
    isImplemented: section?.isImplemented ?? true,
    requiresAuth: section?.requiredAuth ?? false,
    timestamp: new Date().toISOString()
  };
}