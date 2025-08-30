// Navigation components exports
export { default as MainNavigation } from './MainNavigation';
export { default as NavLogo } from './NavLogo';
export { default as NavLinks } from './NavLinks';
export { default as UserMenu } from './UserMenu';
export { default as Footer } from './Footer';
export { default as Breadcrumb } from './Breadcrumb';
export { default as MobileMenu } from './MobileMenu';
export { NavigationProvider, useNavigation } from './NavigationProvider';
export { default as SearchInterface } from './SearchInterface';

export type { MainNavigationProps } from './MainNavigation';
export type { NavLogoProps } from './NavLogo';
export type { NavLinksProps } from './NavLinks';
export type { UserMenuProps } from './UserMenu';
export type { FooterProps } from './Footer';

// Export navigation types
export type {
  NavigationSection,
  UserMenuItem,
  NavigationConfig,
  NavigationState,
  NavigationContextType,
  BreadcrumbItem,
  RouteConfig,
  BreadcrumbConfig,
} from '@/types/navigation';

// Export navigation configuration utilities
export {
  defaultNavigationConfig,
  updateNavigationConfig,
  toggleNavigationSection,
  toggleUserMenuItem,
  toggleAdminMenuItem,
} from '@/lib/navigation/config';

// Export navigation hooks
export {
  useNavigationState,
  useNavigationAccess,
  useImplementedSections,
} from '@/hooks/useNavigationState';
