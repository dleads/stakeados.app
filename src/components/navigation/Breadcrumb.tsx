import React from 'react';
import { Link } from '@/lib/utils/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumb({
  items,
  separator = <ChevronRight className="w-4 h-4" />,
  showHome = true,
  className,
}: BreadcrumbProps) {
  const allItems = showHome
    ? [
        { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
        ...items,
      ]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2', className)}
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isCurrent =
            ('current' in item ? item.current : false) || isLast;

          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-stakeados-gray-500 flex-shrink-0">
                  {separator}
                </span>
              )}

              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-stakeados-gray-400 hover:text-stakeados-primary transition-colors text-sm font-medium"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    isCurrent
                      ? 'text-stakeados-primary'
                      : 'text-stakeados-gray-400'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook for automatic breadcrumb generation
export function useBreadcrumb() {
  const generateBreadcrumb = (pathname: string): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Remove locale from segments
    if (segments[0] === 'en' || segments[0] === 'es') {
      segments.shift();
    }

    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Generate label from segment
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Custom labels for known routes
      const customLabels: Record<string, string> = {
        courses: 'Courses',
        community: 'Community',
        news: 'News',
        genesis: 'Genesis',
        dashboard: 'Dashboard',
        profile: 'Profile',
        achievements: 'Achievements',
        citizenship: 'Citizenship',
        articles: 'Articles',
        create: 'Create',
        edit: 'Edit',
        admin: 'Admin',
      };

      if (customLabels[segment]) {
        label = customLabels[segment];
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        current: index === segments.length - 1,
      });
    });

    return breadcrumbs;
  };

  return { generateBreadcrumb };
}
