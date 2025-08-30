'use client';

import React, { forwardRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { useNavigation } from './NavigationProvider';
import { useNextNavigation } from '@/hooks/useNextNavigation';
import { cn } from '@/lib/utils';
import type { NavigationSection } from '@/types/navigation';

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  section?: NavigationSection;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onNavigationStart?: () => void;
  onNavigationComplete?: () => void;
  onNavigationError?: (error: Error) => void;
}

/**
 * Enhanced navigation link component that provides smooth client-side navigation
 * with loading states, error handling, and integration with our navigation system
 */
export const NavigationLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({
    href,
    children,
    section,
    className,
    activeClassName = 'text-green-400 font-semibold',
    exact = false,
    prefetch = true,
    replace = false,
    scroll = true,
    onClick,
    onNavigationStart,
    onNavigationComplete,
    onNavigationError,
    ...props
  }, ref) => {
    const { safeNavigate } = useNavigation();
    const { isRouteActive, prefetch: prefetchRoute } = useNextNavigation();
    const [isNavigating, setIsNavigating] = useState(false);

    // Check if this link is currently active
    const isActive = isRouteActive(href, exact);

    // Handle click with our navigation system
    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call custom onClick handler if provided
      onClick?.(e);

      // Don't handle if default was prevented
      if (e.defaultPrevented) {
        return;
      }

      // Handle external links normally
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return;
      }

      // Handle anchor links
      if (href.startsWith('#')) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Set loading state
      setIsNavigating(true);
      onNavigationStart?.();

      try {
        if (section) {
          // Use safe navigation if section is provided
          safeNavigate(href, section, { replace, scroll });
        } else {
          // Use regular navigation
          window.location.href = href;
        }

        // Simulate completion (since we don't have route events in App Router)
        setTimeout(() => {
          setIsNavigating(false);
          onNavigationComplete?.();
        }, 100);

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Navigation failed');
        setIsNavigating(false);
        onNavigationError?.(err);
        console.error('Navigation error:', err);
      }
    }, [
      href, 
      section, 
      safeNavigate, 
      replace, 
      scroll, 
      onClick, 
      onNavigationStart, 
      onNavigationComplete, 
      onNavigationError
    ]);

    // Handle mouse enter for prefetching
    const handleMouseEnter = useCallback(() => {
      if (prefetch && !href.startsWith('http') && !href.startsWith('#')) {
        prefetchRoute(href);
      }
    }, [prefetch, href, prefetchRoute]);

    // Combine class names
    const linkClassName = cn(
      className,
      isActive && activeClassName,
      isNavigating && 'opacity-70 pointer-events-none',
      'transition-all duration-200 ease-in-out'
    );

    // For external links, use regular anchor tag
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return (
        <a
          ref={ref}
          href={href}
          className={linkClassName}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          {...props}
        >
          {children}
          {isNavigating && (
            <span className="ml-2 inline-block animate-spin">⟳</span>
          )}
        </a>
      );
    }

    // For anchor links, use regular anchor tag
    if (href.startsWith('#')) {
      return (
        <a
          ref={ref}
          href={href}
          className={linkClassName}
          onClick={onClick}
          {...props}
        >
          {children}
        </a>
      );
    }

    // For internal links, use Next.js Link with our enhanced handling
    return (
      <Link
        ref={ref}
        href={href}
        className={linkClassName}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      >
        {children}
        {isNavigating && (
          <span className="ml-2 inline-block animate-spin text-green-400">⟳</span>
        )}
      </Link>
    );
  }
);

NavigationLink.displayName = 'NavigationLink';

/**
 * Specialized navigation link for sections with coming soon functionality
 */
export function SectionNavigationLink({
  section,
  children,
  className,
  showBadge = true,
  ...props
}: Omit<NavigationLinkProps, 'section'> & {
  section: NavigationSection;
  showBadge?: boolean;
}) {
  return (
    <NavigationLink
      href={section.href}
      section={section}
      className={cn(
        'relative inline-flex items-center gap-2',
        !section.isImplemented && 'cursor-not-allowed opacity-60',
        className
      )}
      {...props}
    >
      {children}
      
      {/* Badge for section status */}
      {showBadge && section.badge && (
        <span
          className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            section.badge.variant === 'new' && 'bg-green-500 text-white',
            section.badge.variant === 'beta' && 'bg-blue-500 text-white',
            section.badge.variant === 'coming-soon' && 'bg-yellow-500 text-black'
          )}
        >
          {section.badge.text}
        </span>
      )}
      
      {/* Coming soon indicator */}
      {!section.isImplemented && (
        <span className="text-xs text-gray-400 ml-1">
          (Próximamente)
        </span>
      )}
    </NavigationLink>
  );
}

/**
 * Navigation link with loading indicator
 */
export function LoadingNavigationLink({
  children,
  loadingText = 'Cargando...',
  ...props
}: NavigationLinkProps & {
  loadingText?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <NavigationLink
      {...props}
      onNavigationStart={() => {
        setIsLoading(true);
        props.onNavigationStart?.();
      }}
      onNavigationComplete={() => {
        setIsLoading(false);
        props.onNavigationComplete?.();
      }}
      onNavigationError={(error) => {
        setIsLoading(false);
        props.onNavigationError?.(error);
      }}
    >
      {isLoading ? loadingText : children}
    </NavigationLink>
  );
}