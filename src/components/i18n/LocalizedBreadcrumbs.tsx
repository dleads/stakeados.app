'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';
import { Locale } from '@/types/content';
import { i18nRoutingService } from '@/lib/services/i18nRoutingService';
import { cn } from '@/lib/utils';

interface LocalizedBreadcrumbsProps {
  params?: Record<string, string | string[]>;
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

export default function LocalizedBreadcrumbs({
  params,
  className,
  showHome = true,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
}: LocalizedBreadcrumbsProps) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  // Get current path without locale prefix
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Generate breadcrumbs
  const breadcrumbs = i18nRoutingService.generateBreadcrumbs(
    pathWithoutLocale,
    locale,
    params
  );

  // Filter out home if not needed
  const filteredBreadcrumbs = showHome ? breadcrumbs : breadcrumbs.slice(1);

  if (filteredBreadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {filteredBreadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 flex-shrink-0">{separator}</span>
            )}

            {breadcrumb.isActive ? (
              <span
                className="font-medium text-foreground truncate max-w-[200px]"
                aria-current="page"
              >
                {index === 0 && showHome ? (
                  <Home className="h-4 w-4" />
                ) : (
                  breadcrumb.label
                )}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] flex items-center"
              >
                {index === 0 && showHome ? (
                  <Home className="h-4 w-4" />
                ) : (
                  breadcrumb.label
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Structured data breadcrumbs for SEO
export function BreadcrumbStructuredData({
  params,
}: {
  params?: Record<string, string | string[]>;
}) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  const breadcrumbs = i18nRoutingService.generateBreadcrumbs(
    pathWithoutLocale,
    locale,
    params
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.label,
      item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${breadcrumb.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Hook for getting breadcrumb data
export function useBreadcrumbs(params?: Record<string, string | string[]>) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  return i18nRoutingService.generateBreadcrumbs(
    pathWithoutLocale,
    locale,
    params
  );
}
