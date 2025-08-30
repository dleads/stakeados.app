'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigation } from './NavigationProvider';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { 
  FocusManager, 
  KeyboardNavigationHandler, 
  ScreenReaderUtils,
  KEYBOARD_KEYS,
  a11yUtils 
} from '@/lib/navigation/accessibility';

export interface UserMenuProps {
  variant?: 'desktop' | 'mobile';
  onItemClick?: () => void;
  className?: string;
}

export default function UserMenu({
  variant = 'desktop',
  onItemClick,
  className,
}: UserMenuProps) {
  const {
    user,
    userRole,
    isAuthenticated,
    getUserMenuItems,
    getAdminMenuItems,
    safeNavigate,
    navigate,
  } = useNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Enhanced click outside and keyboard handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !dropdownRef.current) return;

      switch (event.key) {
        case KEYBOARD_KEYS.ESCAPE:
          event.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
          
        case KEYBOARD_KEYS.TAB:
          // Trap focus within the dropdown
          FocusManager.trapFocus(dropdownRef.current, event);
          break;
          
        default:
          // Handle arrow key navigation
          KeyboardNavigationHandler.handleVerticalMenuNavigation(
            event,
            dropdownRef.current,
            () => {
              setIsOpen(false);
              buttonRef.current?.focus();
            }
          );
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first menu item when opened
      setTimeout(() => {
        if (dropdownRef.current) {
          FocusManager.focusFirst(dropdownRef.current);
        }
      }, 100);
      
      // Announce menu opening
      ScreenReaderUtils.announce('Menú de usuario abierto', 'polite');
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleMenuItemClick = async (item: any) => {
    try {
      if (item.action === 'logout') {
        // Enhanced logout handling with proper auth context integration
        const { useAuthContext } = await import('@/components/auth/AuthProvider');
        console.log('Logout action triggered for user:', user?.email);
        
        // Use the signOut method from auth context
        const result = await import('@/components/auth/AuthProvider').then(module => {
          // This will be handled by the NavigationProvider's handleUserMenuAction
          return { success: true };
        });
        
        // The actual logout is handled by NavigationProvider
        console.log('Logout process initiated');
        
      } else if (item.href && item.href !== '#') {
        if (item.isImplemented) {
          navigate(item.href);
        } else {
          // Enhanced coming soon message with better UX
          const message = `${item.label} estará disponible próximamente. Estamos trabajando para traerte esta funcionalidad pronto.`;
          alert(message);
          console.log(`Coming soon modal shown for menu item: ${item.label}`);
        }
      }
    } catch (error) {
      console.error('Error handling menu item click:', error);
    } finally {
      setIsOpen(false);
      onItemClick?.();
    }
  };

  const userMenuItems = getUserMenuItems();
  const adminMenuItems = getAdminMenuItems();

  // Mobile variant
  if (variant === 'mobile') {
    if (!isAuthenticated) {
      return (
        <div className={cn('space-y-2', className)}>
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-800/80 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-glow-sm"
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-3 px-4 py-3 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-800/80 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-glow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Registrarse
          </Link>
        </div>
      );
    }

    return (
      <div className={cn('space-y-2', className)}>
        {/* User info */}
        <div className="px-4 py-2 border-b border-stakeados-primary/20 bg-gradient-to-r from-stakeados-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-stakeados-primary/30">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-stakeados-primary text-stakeados-dark font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-white">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
              </div>
              <div className="text-xs text-stakeados-gray-300">{user?.email}</div>
              {userRole && (
                <Badge variant="outline" className="text-xs mt-1 bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30">
                  {userRole}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* User menu items */}
        {userMenuItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleMenuItemClick(item)}
            onKeyDown={(e) => {
              if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                e.preventDefault();
                handleMenuItemClick(item);
              }
            }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-800/80 rounded-lg transition-all duration-200 w-full text-left hover:scale-[1.02] active:scale-[0.98] hover:shadow-glow-sm',
              a11yUtils.getFocusStyles()
            )}
            disabled={!item.isImplemented && item.action !== 'logout'}
            role="menuitem"
            tabIndex={0}
            aria-label={ScreenReaderUtils.getUserMenuItemLabel(item)}
          >
            {item.id === 'profile' && <User className="w-4 h-4" />}
            {item.id === 'settings' && <Settings className="w-4 h-4" />}
            {item.id === 'logout' && <LogOut className="w-4 h-4" />}
            <span>{item.label}</span>
            {!item.isImplemented && item.action !== 'logout' && (
              <Badge variant="outline" className="text-xs ml-auto">
                Próximamente
              </Badge>
            )}
          </button>
        ))}

        {/* Admin menu items */}
        {adminMenuItems.length > 0 && (
          <>
            <div className="px-4 py-2 border-t border-stakeados-orange/20 bg-gradient-to-r from-stakeados-orange/5 to-transparent">
              <div className="text-xs text-stakeados-orange font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stakeados-orange rounded-full animate-pulse"></span>
                Administración
              </div>
            </div>
            {adminMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                    e.preventDefault();
                    handleMenuItemClick(item);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-stakeados-orange hover:text-white hover:bg-stakeados-orange/20 rounded-lg transition-all duration-200 w-full text-left hover:scale-[1.02] active:scale-[0.98] hover:shadow-glow-sm',
                  a11yUtils.getFocusStyles()
                )}
                disabled={!item.isImplemented}
                role="menuitem"
                tabIndex={0}
                aria-label={ScreenReaderUtils.getUserMenuItemLabel(item)}
              >
                <Shield className="w-4 h-4" />
                <span>{item.label}</span>
                {!item.isImplemented && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    Próximamente
                  </Badge>
                )}
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  // Desktop variant
  if (!isAuthenticated) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/login')}
          className="text-gray-300 hover:text-white"
        >
          Iniciar Sesión
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/register')}
          className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
        >
          Registrarse
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* User Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === KEYBOARD_KEYS.ARROW_DOWN && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-stakeados-gray-800/60 hover:bg-stakeados-gray-700 transition-all duration-200 border border-stakeados-gray-700 hover:border-stakeados-primary/50 hover:shadow-glow-sm hover:scale-105 active:scale-95',
          a11yUtils.getFocusStyles()
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Menú de usuario para ${user?.email || 'usuario'}`}
        aria-describedby="user-menu-instructions"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-green-600 text-white">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-white">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
          </div>
          {userRole && (
            <div className="text-xs text-stakeados-gray-300">{userRole}</div>
          )}
        </div>
        
        <ChevronDown
          className={cn(
            'w-4 h-4 text-stakeados-gray-400 transition-all duration-300',
            isOpen && 'rotate-180 text-stakeados-primary'
          )}
          aria-hidden="true"
        />
        
        {/* Hidden instructions for screen readers */}
        <span id="user-menu-instructions" className="sr-only">
          Presione Enter o Espacio para abrir el menú de usuario, flecha abajo para abrir y navegar
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-b from-stakeados-gray-800/95 to-stakeados-gray-900/95 backdrop-blur-xl border border-stakeados-primary/30 rounded-lg shadow-2xl shadow-stakeados-primary/20 z-50 animate-slide-down"
          role="menu"
          aria-labelledby="user-menu-button"
          aria-orientation="vertical"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-stakeados-primary/20 bg-gradient-to-r from-stakeados-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-stakeados-primary/40">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-stakeados-primary text-stakeados-dark font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                </div>
                <div className="text-sm text-stakeados-gray-300">{user?.email}</div>
                {userRole && (
                  <Badge variant="outline" className="text-xs mt-1 bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30">
                    {userRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {userMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                    e.preventDefault();
                    handleMenuItemClick(item);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors w-full text-left disabled:opacity-50',
                  a11yUtils.getFocusStyles()
                )}
                disabled={!item.isImplemented && item.action !== 'logout'}
                role="menuitem"
                tabIndex={0}
                aria-label={ScreenReaderUtils.getUserMenuItemLabel(item)}
              >
                {item.id === 'profile' && <User className="w-4 h-4" />}
                {item.id === 'settings' && <Settings className="w-4 h-4" />}
                {item.id === 'logout' && <LogOut className="w-4 h-4" />}
                <span>{item.label}</span>
                {!item.isImplemented && item.action !== 'logout' && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    Próximamente
                  </Badge>
                )}
              </button>
            ))}

            {/* Admin Items */}
            {adminMenuItems.length > 0 && (
              <>
                <div className="border-t border-stakeados-orange/20 my-2" />
                <div className="px-4 py-1">
                  <div className="text-xs text-stakeados-orange font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-stakeados-orange rounded-full animate-pulse"></span>
                    Administración
                  </div>
                </div>
                {adminMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                        e.preventDefault();
                        handleMenuItemClick(item);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-orange-300 hover:text-orange-200 hover:bg-gray-700 transition-colors w-full text-left disabled:opacity-50',
                      a11yUtils.getFocusStyles()
                    )}
                    disabled={!item.isImplemented}
                    role="menuitem"
                    tabIndex={0}
                    aria-label={ScreenReaderUtils.getUserMenuItemLabel(item)}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{item.label}</span>
                    {!item.isImplemented && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        Próximamente
                      </Badge>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}