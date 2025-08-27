'use client';

import { useRole } from '@/components/auth/RoleProvider';
import { getLocalizedUrl } from '@/lib/i18n';
import type { Locale } from '@/types/content';
import { NavigationItem } from '@/types/roles';

export function useFilteredNavigation(locale: Locale) {
  const { role, loading } = useRole();

  // All navigation items (including admin-only)
  const allNavigationItems: NavigationItem[] = [
    // Public items
    {
      key: 'articles',
      label: 'Articles',
      href: getLocalizedUrl('/articles', locale),
      adminOnly: false,
    },
    {
      key: 'news',
      label: 'News',
      href: getLocalizedUrl('/news', locale),
      adminOnly: false,
    },
    {
      key: 'community',
      label: 'Community',
      href: getLocalizedUrl('/community', locale),
      adminOnly: false,
    },
    // Admin-only items
    {
      key: 'courses',
      label: 'Courses',
      href: getLocalizedUrl('/courses', locale),
      adminOnly: true,
      badge: 'Dev',
    },
    {
      key: 'genesis',
      label: 'Genesis',
      href: getLocalizedUrl('/genesis', locale),
      adminOnly: true,
      badge: 'Dev',
    },
    {
      key: 'certificates',
      label: 'Certificates',
      href: getLocalizedUrl('/certificates', locale),
      adminOnly: true,
      badge: 'Dev',
    },
    {
      key: 'achievements',
      label: 'Achievements',
      href: getLocalizedUrl('/achievements', locale),
      adminOnly: true,
      badge: 'Dev',
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: getLocalizedUrl('/dashboard', locale),
      adminOnly: true,
      badge: 'Beta',
    },
  ];

  // Filter navigation items based on user role
  const filteredItems = allNavigationItems.filter(
    item => !item.adminOnly || role === 'admin'
  );

  return {
    navigationItems: filteredItems,
    allItems: allNavigationItems,
    isAdmin: role === 'admin',
    loading,
  };
}
