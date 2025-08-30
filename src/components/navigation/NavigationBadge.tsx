'use client';

import { cn } from '@/lib/utils';
import type { BadgeVariant } from '@/lib/navigation/config-manager';

interface NavigationBadgeProps {
  text: string;
  variant: BadgeVariant;
  className?: string;
}

const badgeVariants = {
  new: 'bg-green-100 text-green-800 border-green-200',
  beta: 'bg-blue-100 text-blue-800 border-blue-200',
  'coming-soon': 'bg-orange-100 text-orange-800 border-orange-200',
} as const;

export function NavigationBadge({ text, variant, className }: NavigationBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        badgeVariants[variant],
        className
      )}
      aria-label={`${text} - ${variant}`}
    >
      {text}
    </span>
  );
}

// Badge component specifically for navigation links
export function NavigationLinkBadge({ text, variant }: NavigationBadgeProps) {
  return (
    <NavigationBadge
      text={text}
      variant={variant}
      className="ml-2 flex-shrink-0"
    />
  );
}

// Badge component for mobile navigation
export function MobileNavigationBadge({ text, variant }: NavigationBadgeProps) {
  return (
    <NavigationBadge
      text={text}
      variant={variant}
      className="ml-auto flex-shrink-0"
    />
  );
}