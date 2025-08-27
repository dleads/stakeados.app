'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  'aria-label'?: string;
  role?: string;
  tabIndex?: number;
}

const sizeClasses = {
  sm: 'min-h-[44px] min-w-[44px] p-2',
  md: 'min-h-[48px] min-w-[48px] p-3',
  lg: 'min-h-[56px] min-w-[56px] p-4',
};

export default function TouchTarget({
  children,
  className = '',
  size = 'md',
  as: Component = 'button',
  onClick,
  href,
  disabled = false,
  'aria-label': ariaLabel,
  role,
  tabIndex,
  ...props
}: TouchTargetProps) {
  const baseClasses = cn(
    // Minimum touch target size (44px minimum for accessibility)
    sizeClasses[size],
    // Touch optimization
    'touch-manipulation',
    // Focus and interaction states
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-primary focus-visible:ring-offset-2 focus-visible:ring-offset-stakeados-dark',
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    // Smooth transitions
    'transition-all duration-200 ease-out',
    // Prevent text selection on touch
    'select-none',
    className
  );

  const commonProps = {
    className: baseClasses,
    'aria-label': ariaLabel,
    role,
    tabIndex: disabled ? -1 : tabIndex,
    ...props,
  };

  if (href && !disabled) {
    return (
      <a {...commonProps} href={href} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Component
      {...commonProps}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </Component>
  );
}
