export enum UserRole {
  ADMIN = 'admin',
  GENESIS = 'genesis',
  CITIZEN = 'citizen',
  STUDENT = 'student',
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  wallet_address?: string | null;
  is_genesis?: boolean | null;
  total_points?: number | null;
  role?: UserRole | null;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermissions {
  canAccessAdmin: boolean;
  canCreateContent: boolean;
  canModerateContent: boolean;
  canAccessGenesis: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
}

export interface RoleAuditLog {
  id: string;
  user_id: string;
  old_role: string | null;
  new_role: string | null;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface RoleContextType {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  permissions: RolePermissions;
  loading: boolean;
  error: string | null;
  refreshRole: () => Promise<void>;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
}

export class RoleError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_ROLE' | 'ROLE_NOT_FOUND' | 'ROLE_UPDATE_FAILED',
    public requiredRole?: UserRole,
    public currentRole?: UserRole
  ) {
    super(message);
    this.name = 'RoleError';
  }
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  requireGenesis?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface AdminOnlyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showComingSoon?: boolean;
  featureName?: string;
}

export interface FeatureNotAvailableProps {
  featureName: string;
  description?: string;
  showInterest?: boolean;
}

export interface AdminBadgeProps {
  variant?: 'development' | 'testing' | 'beta';
  className?: string;
}

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  icon?: React.ComponentType;
  adminOnly?: boolean;
  badge?: string;
}

export const ROUTE_PROTECTION = {
  // Public routes (no protection needed)
  '/': 'public',
  '/articles': 'public',
  '/articles/[slug]': 'public',
  '/news': 'public',
  '/news/[id]': 'public',
  '/community': 'public',
  '/search': 'public',
  '/padentro': 'public',

  // Admin-only routes
  '/courses': 'admin',
  '/courses/[id]': 'admin',
  '/genesis': 'admin',
  '/certificates': 'admin',
  '/achievements': 'admin',
  '/citizenship': 'admin',
  '/dashboard': 'admin',
  '/profile/certificates': 'admin',
  '/profile/achievements': 'admin',

  // Admin panel (always admin)
  '/admin': 'admin',
  '/admin/*': 'admin',
} as const;

export type RouteProtection =
  (typeof ROUTE_PROTECTION)[keyof typeof ROUTE_PROTECTION];
