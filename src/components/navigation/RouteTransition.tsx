'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigation } from './NavigationProvider';
import { cn } from '@/lib/utils';

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
  enableTransitions?: boolean;
  transitionDuration?: number;
}

/**
 * Component that provides smooth transitions between routes
 * This helps create a more polished navigation experience
 */
export function RouteTransition({
  children,
  className,
  enableTransitions = true,
  transitionDuration = 200
}: RouteTransitionProps) {
  const pathname = usePathname();
  const { isNavigating } = useNavigation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  // Handle route transitions
  useEffect(() => {
    if (!enableTransitions) return;

    if (pathname !== previousPathname) {
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousPathname(pathname);
      }, transitionDuration);

      return () => clearTimeout(timer);
    }
  }, [pathname, previousPathname, enableTransitions, transitionDuration]);

  // Show loading state during navigation
  if (isNavigating || isTransitioning) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center',
        className
      )}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'transition-opacity duration-200 ease-in-out',
      isTransitioning ? 'opacity-0' : 'opacity-100',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Loading indicator for navigation states
 */
export function NavigationLoadingIndicator({
  show,
  position = 'top',
  className
}: {
  show: boolean;
  position?: 'top' | 'bottom' | 'center';
  className?: string;
}) {
  if (!show) return null;

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    center: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
  };

  return (
    <div className={cn(positionClasses[position], className)}>
      {position === 'center' ? (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
          <p className="text-white text-sm">Navegando...</p>
        </div>
      ) : (
        <div className="h-1 bg-green-400 animate-pulse"></div>
      )}
    </div>
  );
}

/**
 * Page transition wrapper with fade effect
 */
export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn(
      'transition-all duration-300 ease-in-out',
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Breadcrumb transition component
 */
export function BreadcrumbTransition({
  children,
  show = true
}: {
  children: React.ReactNode;
  show?: boolean;
}) {
  return (
    <div className={cn(
      'transition-all duration-200 ease-in-out overflow-hidden',
      show ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
    )}>
      {children}
    </div>
  );
}