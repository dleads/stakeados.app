'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { useNavigation } from './NavigationProvider';
import './navigation.css';
import NavLogo from './NavLogo';
import NavLinks from './NavLinks';
import HamburgerButton from './HamburgerButton';
import { LazyWrapper, NavigationSkeletons } from './optimization/LazyWrapper';
import { LazyUserMenu, LazyMobileMenu, preloadOnHover } from './lazy';
import { useNavigationPerformance } from './performance/NavigationPerformanceProvider';
import { 
  KeyboardNavigationHandler, 
  FocusManager, 
  KEYBOARD_KEYS,
  a11yUtils 
} from '@/lib/navigation/accessibility';

export interface MainNavigationProps {
  className?: string;
  variant?: 'desktop' | 'mobile' | 'auto';
}

export default function MainNavigation({
  className,
  variant = 'auto',
}: MainNavigationProps) {
  const {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    getVisibleSections,
    isAuthenticated,
    userRole,
    currentPath,
  } = useNavigation();

  const { trackUserInteraction, startNavigation } = useNavigationPerformance();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldPreloadUserMenu, setShouldPreloadUserMenu] = useState(false);
  
  // Accessibility refs and state
  const navigationRef = useRef<HTMLElement>(null);
  const desktopLinksRef = useRef<HTMLDivElement>(null);
  const [skipLinkId] = useState(() => a11yUtils.generateId('skip-nav'));

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced mobile detection with responsive breakpoints and performance optimization
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      // Use Tailwind's md breakpoint (768px) for consistency
      const newIsMobile = width < 768;
      
      // Only update state if value actually changed to prevent unnecessary re-renders
      setIsMobile(prevIsMobile => {
        if (prevIsMobile !== newIsMobile) {
          // Track viewport change for analytics
          trackUserInteraction('viewport_change', 'navigation', {
            width,
            isMobile: newIsMobile,
          });
          return newIsMobile;
        }
        return prevIsMobile;
      });
    };
    
    checkMobile();
    
    // Use ResizeObserver for better performance if available
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        checkMobile();
      });
      resizeObserver.observe(document.body);
      
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // Fallback to resize event listener with throttling
      let timeoutId: NodeJS.Timeout;
      const throttledCheckMobile = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(checkMobile, 100);
      };
      
      window.addEventListener('resize', throttledCheckMobile);
      return () => {
        window.removeEventListener('resize', throttledCheckMobile);
        clearTimeout(timeoutId);
      };
    }
  }, [trackUserInteraction]);

  // Preload user menu on hover/focus for better UX
  useEffect(() => {
    if (isAuthenticated && !shouldPreloadUserMenu) {
      const timer = setTimeout(() => {
        setShouldPreloadUserMenu(true);
        preloadOnHover.userMenu();
      }, 1000); // Preload after 1 second if user is authenticated
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldPreloadUserMenu]);

  // Determine if we should show mobile or desktop version
  const showMobile = variant === 'mobile' || (variant === 'auto' && isMobile);
  const visibleSections = getVisibleSections();

  // Keyboard navigation handler for desktop navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!desktopLinksRef.current || showMobile) return;
      
      // Only handle keyboard navigation if focus is within the navigation
      const isWithinNavigation = navigationRef.current?.contains(document.activeElement);
      if (!isWithinNavigation) return;

      KeyboardNavigationHandler.handleHorizontalMenuNavigation(
        event,
        desktopLinksRef.current,
        () => {
          // On Escape, move focus to skip link or first focusable element
          const skipLink = document.getElementById(skipLinkId);
          if (skipLink) {
            skipLink.focus();
          }
        }
      );
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMobile, skipLinkId]);

  // Handle mobile menu focus management
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Prevent body scroll and manage focus
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Skip Navigation Link for Screen Readers */}
      <a
        id={skipLinkId}
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]',
          'bg-green-600 text-white px-4 py-2 rounded-md font-medium',
          'transition-all duration-200',
          a11yUtils.getFocusStyles()
        )}
        onFocus={() => {
          // Announce skip link availability
          setTimeout(() => {
            const announcement = 'Enlace de salto al contenido principal disponible';
            const announcer = a11yUtils.createLiveRegion('polite');
            announcer.textContent = announcement;
            document.body.appendChild(announcer);
            setTimeout(() => document.body.removeChild(announcer), 1000);
          }, 100);
        }}
      >
        Saltar al contenido principal
      </a>

      <nav
        ref={navigationRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
          isScrolled
            ? 'bg-black/90 backdrop-blur-lg border-b border-stakeados-primary/20 shadow-lg shadow-stakeados-primary/5'
            : 'bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm',
          'supports-[backdrop-filter]:bg-black/80',
          className
        )}
        role="navigation"
        aria-label="Navegación principal de Stakeados"
        aria-describedby="nav-description"
      >
        {/* Hidden description for screen readers */}
        <div id="nav-description" className="sr-only">
          Navegación principal del sitio web. Use las teclas de flecha para navegar entre opciones, Enter o Espacio para activar enlaces, y Escape para salir del menú.
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 sm:h-17 md:h-18 lg:h-20">
            {/* Logo */}
            <NavLogo />

            {/* Desktop Navigation */}
            {!showMobile && (
              <div 
                ref={desktopLinksRef}
                className="hidden md:flex items-center space-x-6 lg:space-x-8"
                role="menubar"
                aria-label="Navegación principal"
              >
                <NavLinks
                  sections={visibleSections}
                  currentPath={currentPath}
                  userRole={userRole}
                  isAuthenticated={isAuthenticated}
                  orientation="horizontal"
                />
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* User Menu (Desktop) - Lazy Loaded */}
              {!showMobile && (
                <LazyWrapper
                  componentName="UserMenu"
                  fallback={<NavigationSkeletons.UserMenu />}
                  preloadOnHover={true}
                >
                  <LazyUserMenu />
                </LazyWrapper>
              )}

              {/* Mobile Menu Button */}
              {showMobile && (
                <HamburgerButton
                  isOpen={isMobileMenuOpen}
                  onClick={() => {
                    toggleMobileMenu();
                    trackUserInteraction('click', 'mobile_menu_toggle', {
                      isOpen: !isMobileMenuOpen,
                    });
                    
                    // Preload mobile menu if not already done
                    if (!isMobileMenuOpen) {
                      preloadOnHover.mobileMenu();
                    }
                  }}
                  className="md:hidden"
                  size="md"
                  variant="default"
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Lazy Loaded */}
      {showMobile && (
        <LazyWrapper
          componentName="MobileMenu"
          fallback={null}
        >
          <LazyMobileMenu
            isOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
        </LazyWrapper>
      )}
    </>
  );
}
