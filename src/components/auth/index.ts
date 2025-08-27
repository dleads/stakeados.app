// Auth Components Exports
export { AuthProvider, useAuthContext } from './AuthProvider';
export { RoleProvider, useRole } from './RoleProvider';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as AdminOnlyRoute } from './AdminOnlyRoute';
export { default as FeatureNotAvailable } from './FeatureNotAvailable';
export { default as AdminBadge } from './AdminBadge';
export { default as AuthRequired } from './AuthRequired';

// Re-export types
export type {
  UserRole,
  UserProfile,
  RolePermissions,
  RoleContextType,
  ProtectedRouteProps,
  AdminOnlyRouteProps,
  FeatureNotAvailableProps,
  AdminBadgeProps,
} from '@/types/roles';
