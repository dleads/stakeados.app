'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNavigation } from './NavigationProvider';
import { isRouteActive } from '@/lib/navigation/utils';
import { ScreenReaderUtils, a11yUtils, KEYBOARD_KEYS } from '@/lib/navigation/accessibility';
import type { NavigationSection } from '@/types/navigation';

export interface NavLinksProps {
  sections: NavigationSection[];
  currentPath: string;
  userRole?: string | null;
  isAuthenticated: boolean;
  orientation?: 'horizontal' | 'vertical';
  onLinkClick?: (href: string, section?: NavigationSection) => void;
  variant?: 'default' | 'mobile';
  className?: string;
}

export default function NavLinks({
  sections,
  currentPath,
  userRole,
  isAuthenticated,
  orientation = 'horizontal',
  onLinkClick,
  variant = 'default',
  className,
}: NavLinksProps) {
  const { safeNavigate } = useNavigation();

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    section: NavigationSection
  ) => {
    e.preventDefault();
    safeNavigate(section.href, section);
    onLinkClick?.(section.href, section);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    section: NavigationSection
  ) => {
    if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
      e.preventDefault();
      safeNavigate(section.href, section);
      onLinkClick?.(section.href, section);
    }
  };

  const isActiveLink = (href: string, section?: NavigationSection): boolean => {
    return isRouteActive(currentPath, href, section);
  };

  const getLinkDescription = (section: NavigationSection): string => {
    return ScreenReaderUtils.getNavigationSectionDescription(section);
  };

  const getAccessibilityLabel = (section: NavigationSection): string => {
    const isActive = isActiveLink(section.href, section);
    return ScreenReaderUtils.getNavigationSectionLabel(section, isActive);
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-2', className)} role="menu">
        {sections.map(section => {
          const isActive = isActiveLink(section.href, section);
          const description = getLinkDescription(section);

          return (
            <Link
              key={section.id}
              href={section.href}
              onClick={(e) => handleLinkClick(e, section)}
              onKeyDown={(e) => handleKeyDown(e, section)}
              className={cn(
                'block px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-stakeados-primary/20 to-stakeados-primary/10 text-stakeados-primary border border-stakeados-primary/40 shadow-glow-sm'
                  : 'text-stakeados-gray-300 hover:text-white hover:bg-stakeados-gray-800/80 border border-transparent hover:border-stakeados-primary/20',
                !section.isImplemented && 'opacity-60 cursor-not-allowed',
                'hover:scale-[1.02] active:scale-[0.98]',
                a11yUtils.getFocusStyles()
              )}
              role="menuitem"
              tabIndex={0}
              aria-current={isActive ? 'page' : undefined}
              aria-label={getAccessibilityLabel(section)}
              aria-describedby={`${section.id}-description`}
              title={!section.isImplemented ? 'Funcionalidad próximamente disponible' : undefined}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="font-semibold flex items-center gap-2">
                  {isActive && (
                    <span 
                      className="w-2 h-2 bg-stakeados-primary rounded-full animate-pulse shadow-glow-sm" 
                      aria-hidden="true"
                    />
                  )}
                  {section.label}
                  {section.badge && (
                    <Badge
                      variant={
                        section.badge.variant === 'new'
                          ? 'default'
                          : section.badge.variant === 'beta'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30"
                    >
                      {section.badge.text}
                    </Badge>
                  )}
                </div>
                {!section.isImplemented && (
                  <Badge variant="outline" className="text-xs bg-stakeados-gray-700/50 text-stakeados-gray-400 border-stakeados-gray-600">
                    Próximamente
                  </Badge>
                )}
              </div>
              
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-r from-stakeados-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div 
                id={`${section.id}-description`}
                className="text-sm text-gray-500 mt-1"
              >
                {description}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  // Horizontal orientation (desktop)
  return (
    <div className={cn('flex items-center space-x-8', className)} role="menubar">
      {sections.map(section => {
        const isActive = isActiveLink(section.href, section);

        return (
          <Link
            key={section.id}
            href={section.href}
            onClick={(e) => handleLinkClick(e, section)}
            onKeyDown={(e) => handleKeyDown(e, section)}
            className={cn(
              'group relative px-4 py-2 font-semibold transition-all duration-300 rounded-lg overflow-hidden',
              isActive
                ? 'text-stakeados-primary bg-stakeados-primary/10 shadow-glow-sm'
                : 'text-stakeados-gray-300 hover:text-stakeados-primary hover:bg-stakeados-primary/5',
              !section.isImplemented && 'opacity-60 cursor-not-allowed',
              'hover:scale-105 active:scale-95',
              a11yUtils.getFocusStyles()
            )}
            role="menuitem"
            tabIndex={0}
            aria-current={isActive ? 'page' : undefined}
            aria-label={getAccessibilityLabel(section)}
            aria-describedby={`${section.id}-desktop-description`}
            title={!section.isImplemented ? 'Funcionalidad próximamente disponible' : undefined}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isActive && (
                <span 
                  className="w-1.5 h-1.5 bg-stakeados-primary rounded-full animate-pulse shadow-glow-sm" 
                  aria-hidden="true"
                />
              )}
              {section.label}
              {section.badge && (
                <Badge
                  variant={
                    section.badge.variant === 'new'
                      ? 'default'
                      : section.badge.variant === 'beta'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="text-xs bg-stakeados-primary/20 text-stakeados-primary border-stakeados-primary/30"
                >
                  {section.badge.text}
                </Badge>
              )}
              {!section.isImplemented && (
                <Badge variant="outline" className="text-xs bg-stakeados-gray-700/50 text-stakeados-gray-400 border-stakeados-gray-600">
                  Próximamente
                </Badge>
              )}
            </span>
            
            {/* Active indicator bar */}
            <span
              className={cn(
                'absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light transition-all duration-300 rounded-full',
                isActive ? 'w-full shadow-glow' : 'w-0 group-hover:w-full'
              )}
              aria-hidden="true"
            />
            
            {/* Hover background effect */}
            <span
              className="absolute inset-0 bg-gradient-to-r from-stakeados-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10"
              aria-hidden="true"
            />
            
            {/* Active background glow */}
            {isActive && (
              <span
                className="absolute inset-0 bg-gradient-to-r from-stakeados-primary/10 to-stakeados-primary/5 rounded-lg -z-10 animate-pulse"
                aria-hidden="true"
              />
            )}
            
            {/* Hidden description for screen readers */}
            <span 
              id={`${section.id}-desktop-description`}
              className="sr-only"
            >
              {getLinkDescription(section)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}