'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from './NavigationProvider';
import NavLinks from './NavLinks';
import UserMenu from './UserMenu';
import type { NavigationSection } from '@/types/navigation';
import { 
  FocusManager, 
  KeyboardNavigationHandler, 
  ScreenReaderUtils,
  KEYBOARD_KEYS,
  a11yUtils 
} from '@/lib/navigation/accessibility';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  slideDirection?: 'left' | 'right';
}

export default function MobileMenu({
  isOpen,
  onClose,
  className,
  slideDirection = 'right',
}: MobileMenuProps) {
  const {
    getVisibleSections,
    getUserMenuItems,
    isAuthenticated,
    userRole,
    currentPath,
    safeNavigate,
  } = useNavigation();

  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Store the element that had focus before opening the menu
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  // Enhanced focus management and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Store current focus before opening menu
      setPreviousFocus(FocusManager.storeFocus());
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the close button when menu opens (better UX than focusing container)
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 100);

      // Announce menu opening to screen readers
      ScreenReaderUtils.announce('Menú de navegación móvil abierto', 'assertive');

      // Enhanced keyboard handling
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!menuRef.current) return;

        switch (event.key) {
          case KEYBOARD_KEYS.ESCAPE:
            event.preventDefault();
            onClose();
            break;
            
          case KEYBOARD_KEYS.TAB:
            // Trap focus within the menu
            FocusManager.trapFocus(menuRef.current, event);
            break;
            
          default:
            // Handle arrow key navigation within the menu
            if (navigationRef.current) {
              KeyboardNavigationHandler.handleVerticalMenuNavigation(
                event,
                navigationRef.current,
                onClose
              );
            }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus when menu closes
      if (previousFocus) {
        setTimeout(() => {
          FocusManager.restoreFocus(previousFocus);
        }, 100);
      }
      
      // Announce menu closing
      if (previousFocus) {
        ScreenReaderUtils.announce('Menú de navegación móvil cerrado', 'polite');
      }
      
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose, previousFocus]);

  // Handle outside click detection
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        backdropRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // Use capture phase to ensure we catch the event before other handlers
      document.addEventListener('mousedown', handleOutsideClick, true);
      document.addEventListener('touchstart', handleOutsideClick, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('touchstart', handleOutsideClick, true);
    };
  }, [isOpen, onClose]);

  const visibleSections = getVisibleSections();
  const userMenuItems = getUserMenuItems();

  const handleLinkClick = (href: string, section?: NavigationSection) => {
    if (section) {
      safeNavigate(href, section);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop with smooth fade */}
      <div
        ref={backdropRef}
        className={cn(
          'absolute inset-0 bg-black/85 backdrop-blur-md transition-all duration-300 ease-out',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background: isOpen 
            ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)'
            : 'transparent'
        }}
        aria-hidden="true"
      />

      {/* Menu Panel with slide animation */}
      <div
        ref={menuRef}
        className={cn(
          'absolute top-0 h-full w-80 max-w-[85vw]',
          'bg-gradient-to-b from-stakeados-gray-900/98 via-stakeados-gray-800/95 to-stakeados-gray-900/98',
          'backdrop-blur-xl border-l border-stakeados-primary/30',
          'shadow-2xl shadow-stakeados-primary/20',
          'transform transition-all duration-300 ease-out',
          'focus:outline-none',
          slideDirection === 'right' ? 'right-0' : 'left-0',
          isOpen
            ? 'translate-x-0 opacity-100'
            : slideDirection === 'right'
            ? 'translate-x-full opacity-0'
            : '-translate-x-full opacity-0',
          className
        )}
        style={{
          background: isOpen 
            ? 'linear-gradient(135deg, rgba(26,26,26,0.98) 0%, rgba(42,42,42,0.95) 50%, rgba(26,26,26,0.98) 100%)'
            : undefined
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        aria-describedby="mobile-menu-description"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stakeados-primary/20 bg-gradient-to-r from-stakeados-primary/5 to-transparent">
          <div>
            <h2 
              id="mobile-menu-title" 
              className="text-lg sm:text-xl font-bold text-white"
            >
              Navegación
            </h2>
            <div 
              id="mobile-menu-description" 
              className="text-sm text-stakeados-gray-300 mt-1"
            >
              Use las teclas de flecha para navegar, Enter para activar
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={cn(
              'p-2 text-stakeados-gray-400 hover:text-white hover:bg-stakeados-primary/20',
              'rounded-lg transition-all duration-200 hover:scale-105 active:scale-95',
              'border border-transparent hover:border-stakeados-primary/30',
              a11yUtils.getFocusStyles()
            )}
            aria-label="Cerrar menú de navegación móvil"
            aria-keyshortcuts="Escape"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stakeados-primary/30 scrollbar-track-transparent">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 
                className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"
                id="main-nav-heading"
              >
                <span className="w-2 h-2 bg-stakeados-primary rounded-full animate-pulse"></span>
                Navegación Principal
              </h3>
              <nav 
                ref={navigationRef}
                className="space-y-1" 
                role="navigation"
                aria-labelledby="main-nav-heading"
                aria-describedby="main-nav-instructions"
              >
                <div id="main-nav-instructions" className="sr-only">
                  Lista de enlaces de navegación principal. Use las teclas de flecha arriba y abajo para navegar entre opciones.
                </div>
                <NavLinks
                  sections={visibleSections}
                  currentPath={currentPath}
                  userRole={userRole}
                  isAuthenticated={isAuthenticated}
                  orientation="vertical"
                  onLinkClick={handleLinkClick}
                  variant="mobile"
                />
              </nav>
            </div>

            {/* User Menu Section */}
            {isAuthenticated && userMenuItems.length > 0 && (
              <div>
                <h3 
                  className="text-xs font-semibold text-stakeados-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"
                  id="user-menu-heading"
                >
                  <span className="w-2 h-2 bg-stakeados-blue rounded-full animate-pulse"></span>
                  Mi Cuenta
                </h3>
                <div 
                  className="space-y-1"
                  role="group"
                  aria-labelledby="user-menu-heading"
                >
                  <UserMenu variant="mobile" onItemClick={onClose} />
                </div>
              </div>
            )}

            {/* Authentication Actions for non-authenticated users */}
            {!isAuthenticated && (
              <div 
                className="space-y-3"
                role="group"
                aria-label="Acciones de autenticación"
              >
                <button
                  onClick={() => handleLinkClick('/login')}
                  className={cn(
                    'w-full px-4 py-3 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-dark',
                    'hover:from-stakeados-primary-light hover:to-stakeados-primary',
                    'text-stakeados-dark font-semibold rounded-lg transition-all duration-200',
                    'hover:scale-105 active:scale-95 hover:shadow-glow',
                    a11yUtils.getFocusStyles()
                  )}
                  aria-describedby="login-description"
                >
                  Iniciar Sesión
                  <span id="login-description" className="sr-only">
                    Acceder a tu cuenta existente en Stakeados
                  </span>
                </button>
                <button
                  onClick={() => handleLinkClick('/register')}
                  className={cn(
                    'w-full px-4 py-3 border-2 border-stakeados-primary/50 hover:border-stakeados-primary',
                    'text-stakeados-primary hover:text-white font-semibold rounded-lg',
                    'transition-all duration-200 hover:bg-stakeados-primary/10',
                    'hover:scale-105 active:scale-95 hover:shadow-glow-sm',
                    a11yUtils.getFocusStyles()
                  )}
                  aria-describedby="register-description"
                >
                  Registrarse
                  <span id="register-description" className="sr-only">
                    Crear una nueva cuenta en Stakeados
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer with additional info */}
        <div className="border-t border-stakeados-primary/20 p-4 bg-gradient-to-r from-transparent via-stakeados-primary/5 to-transparent">
          <div className="text-xs text-stakeados-gray-400 text-center font-medium">
            Stakeados Platform
          </div>
          <div className="text-xs text-stakeados-gray-500 text-center mt-1">
            v2.0 • Gaming & Blockchain
          </div>
        </div>
      </div>
    </div>
  );
}
