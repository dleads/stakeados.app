'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthProvider';
import {
  UserRole,
  RolePermissions,
  RoleContextType,
  UserProfile,
} from '@/types/roles';
import { RoleService } from '@/lib/services/roleService';

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading } = useAuthContext();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({
    canAccessAdmin: false,
    canCreateContent: false,
    canModerateContent: false,
    canAccessGenesis: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewAnalytics: false,
    canManageSystem: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch role and permissions when user changes
  useEffect(() => {
    const fetchRoleData = async () => {
      if (!user) {
        setRole(null);
        setPermissions({
          canAccessAdmin: false,
          canCreateContent: false,
          canModerateContent: false,
          canAccessGenesis: false,
          canManageUsers: false,
          canManageRoles: false,
          canViewAnalytics: false,
          canManageSystem: false,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get role from server since profile doesn't have role field
        let userRole: UserRole | null = null;

        // Check if user is admin based on email or metadata
        const isAdmin =
          user?.email === 'admin@stakeados.com' ||
          user?.user_metadata?.role === 'admin' ||
          user?.app_metadata?.role === 'admin';

        if (isAdmin) {
          userRole = UserRole.ADMIN;
        } else {
          // Fallback to server fetch
          userRole = await RoleService.getUserRole(user.id);
        }

        setRole(userRole);

        // Get permissions
        if (userRole) {
          const userPermissions = await RoleService.getRolePermissions(user.id);
          if (userPermissions) {
            setPermissions(userPermissions);
          } else {
            // Fallback to default permissions
            setPermissions(RoleService.getDefaultPermissions(userRole));
          }
        } else {
          // No role, set default permissions
          setPermissions(RoleService.getDefaultPermissions(UserRole.STUDENT));
        }
      } catch (err) {
        console.error('Error fetching role data:', err);
        setError(
          err instanceof Error ? err.message : 'Error loading role data'
        );
        setRole(null);
        setPermissions({
          canAccessAdmin: false,
          canCreateContent: false,
          canModerateContent: false,
          canAccessGenesis: false,
          canManageUsers: false,
          canManageRoles: false,
          canViewAnalytics: false,
          canManageSystem: false,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchRoleData();
    }
  }, [user, profile, authLoading]);

  const refreshRole = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const userRole = await RoleService.getUserRole(user.id);
      setRole(userRole);

      if (userRole) {
        const userPermissions = await RoleService.getRolePermissions(user.id);
        if (userPermissions) {
          setPermissions(userPermissions);
        } else {
          setPermissions(RoleService.getDefaultPermissions(userRole));
        }
      }
    } catch (err) {
      console.error('Error refreshing role:', err);
      setError(err instanceof Error ? err.message : 'Error refreshing role');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.some(r => RoleService.hasRoleOrHigher(role, r));
    }

    return RoleService.hasRoleOrHigher(role, requiredRole);
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission] || false;
  };

  // Convert profile to UserProfile format if needed
  const userProfile: UserProfile | null = profile
    ? {
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        wallet_address: profile.wallet_address,
        role: role, // Use the role from state instead of profile
        created_at: profile.created_at || undefined,
        updated_at: profile.updated_at || undefined,
      }
    : null;

  const value: RoleContextType = {
    user,
    profile: userProfile,
    role,
    permissions,
    loading: authLoading || loading,
    error,
    refreshRole,
    hasRole,
    hasPermission,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
