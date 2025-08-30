'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types/navigation';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumbs({
  items,
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />,
  maxItems = 5,
  showHome = true,
  className,
}: BreadcrumbsProps) {
  // Don't render breadcrumbs if no items or only home
  if (!items || items.length === 0) {
    return null;
  }

  // Add home breadcrumb if requested and not already present
  const breadcrumbItems = showHome && items[0]?.href !== '/' 
    ? [{ label: 'Inicio', href: '/', isCurrentPage: false }, ...items]
    : items;

  // Truncate items if exceeding maxItems
  const displayItems = breadcrumbItems.length > maxItems
    ? [
        breadcrumbItems[0],
        { label: '...', href: undefined, isCurrentPage: false },
        ...breadcrumbItems.slice(-maxItems + 2)
      ]
    : breadcrumbItems;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-1 text-sm text-stakeados-gray-400 bg-stakeados-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-stakeados-gray-700/50',
        className
      )}
      role="navigation"
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {/* Separator (not for first item) */}
              {index > 0 && (
                <span className="mx-2 text-stakeados-primary/60" aria-hidden="true">
                  {separator}
                </span>
              )}

              {/* Breadcrumb item */}
              {isEllipsis ? (
                <span className="text-stakeados-gray-500" aria-hidden="true">
                  ...
                </span>
              ) : isLast || item.isCurrentPage || !item.href ? (
                <span
                  className={cn(
                    'font-semibold px-2 py-1 rounded-md',
                    isLast || item.isCurrentPage
                      ? 'text-stakeados-primary bg-stakeados-primary/10'
                      : 'text-stakeados-gray-300'
                  )}
                  aria-current={isLast || item.isCurrentPage ? 'page' : undefined}
                >
                  {item.href === '/' && showHome ? (
                    <Home className="h-4 w-4" aria-label="Inicio" />
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'hover:text-stakeados-primary transition-all duration-200 font-medium px-2 py-1 rounded-md hover:bg-stakeados-primary/10 hover:scale-105 active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-stakeados-primary focus:ring-offset-2 focus:ring-offset-stakeados-gray-900'
                  )}
                >
                  {item.href === '/' && showHome ? (
                    <Home className="h-4 w-4" aria-label="Inicio" />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}