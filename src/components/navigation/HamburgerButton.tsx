'use client';

import React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { a11yUtils, KEYBOARD_KEYS } from '@/lib/navigation/accessibility';

export interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export default function HamburgerButton({
  isOpen,
  onClick,
  className,
  size = 'md',
  variant = 'default',
}: HamburgerButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    default: 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-800 border border-transparent hover:border-stakeados-primary/30 hover:shadow-glow-sm',
    minimal: 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-800/50',
  };

  // Handle keyboard activation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.SPACE) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'rounded-lg transition-all duration-200 ease-in-out',
        'active:scale-95',
        // Size classes
        sizeClasses[size],
        // Variant classes
        variantClasses[variant],
        // Accessibility styles
        a11yUtils.getFocusStyles(),
        className
      )}
      aria-label={isOpen ? 'Cerrar menú de navegación móvil' : 'Abrir menú de navegación móvil'}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation-menu"
      aria-haspopup="dialog"
      aria-describedby="hamburger-instructions"
    >
      {/* Icon with smooth transition */}
      <div className="relative">
        <Menu
          className={cn(
            iconSizes[size],
            'transition-all duration-300 ease-out',
            isOpen ? 'opacity-0 rotate-180 scale-75' : 'opacity-100 rotate-0 scale-100'
          )}
          aria-hidden="true"
        />
        <X
          className={cn(
            iconSizes[size],
            'absolute inset-0 transition-all duration-300 ease-out',
            isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-75'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-lg bg-stakeados-primary/20 opacity-0 transition-opacity duration-200 active:opacity-100" />
      
      {/* Glow effect when open */}
      {isOpen && (
        <span className="absolute inset-0 rounded-lg bg-stakeados-primary/10 animate-pulse" />
      )}
      
      {/* Hidden instructions for screen readers */}
      <span id="hamburger-instructions" className="sr-only">
        {isOpen 
          ? 'Presione Enter o Espacio para cerrar el menú de navegación móvil'
          : 'Presione Enter o Espacio para abrir el menú de navegación móvil'
        }
      </span>
    </button>
  );
}