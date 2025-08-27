import { createClient } from '@/lib/supabase/client';
import { UserRole, RolePermissions } from '@/types/roles';

const supabase = createClient();

export class RoleService {
  /**
   * Get user role from database
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }

      return (data?.role as UserRole) || null;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }

  /**
   * Update user role with audit logging
   */
  static async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_user_role' as any, {
        target_user_id: targetUserId,
        new_role: newRole,
        reason: reason || null,
      });

      if (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: error.message };
      }

      return { success: data };
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate role access for server-side protection
   */
  static async validateRoleAccess(
    userId: string,
    requiredRole: UserRole
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role_or_higher' as any, {
        user_id: userId,
        required_role: requiredRole,
      });

      if (error) {
        console.error('Error validating role access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in validateRoleAccess:', error);
      return false;
    }
  }

  /**
   * Get role permissions for a user
   */
  static async getRolePermissions(
    userId: string
  ): Promise<RolePermissions | null> {
    try {
      const { data, error } = await supabase.rpc(
        'get_role_permissions' as any,
        {
          user_id: userId,
        }
      );

      if (error) {
        console.error('Error getting role permissions:', error);
        return null;
      }

      return data as RolePermissions;
    } catch (error) {
      console.error('Error in getRolePermissions:', error);
      return null;
    }
  }

  /**
   * Audit role change
   */
  static async auditRoleChange(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('role_audit_log' as any).insert({
        user_id: userId,
        old_role: oldRole,
        new_role: newRole,
        changed_by: changedBy,
        reason: reason || null,
      });

      if (error) {
        console.error('Error auditing role change:', error);
      }
    } catch (error) {
      console.error('Error in auditRoleChange:', error);
    }
  }

  /**
   * Get role audit log for a user
   */
  static async getRoleAuditLog(userId: string) {
    try {
      const { data, error } = await supabase
        .from('role_audit_log' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting role audit log:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRoleAuditLog:', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: string,
    permission: keyof RolePermissions
  ): Promise<boolean> {
    try {
      const permissions = await this.getRolePermissions(userId);
      return permissions?.[permission] || false;
    } catch (error) {
      console.error('Error in hasPermission:', error);
      return false;
    }
  }

  /**
   * Get all users with their roles (admin only)
   */
  static async getAllUsersWithRoles() {
    try {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('id, email, display_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting users with roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUsersWithRoles:', error);
      return [];
    }
  }

  /**
   * Check role hierarchy
   */
  static hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.ADMIN]: 4,
      [UserRole.GENESIS]: 3,
      [UserRole.CITIZEN]: 2,
      [UserRole.STUDENT]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Get default permissions for a role
   */
  static getDefaultPermissions(role: UserRole): RolePermissions {
    const permissions: Record<UserRole, RolePermissions> = {
      [UserRole.ADMIN]: {
        canAccessAdmin: true,
        canCreateContent: true,
        canModerateContent: true,
        canAccessGenesis: true,
        canManageUsers: true,
        canManageRoles: true,
        canViewAnalytics: true,
        canManageSystem: true,
      },
      [UserRole.GENESIS]: {
        canAccessAdmin: false,
        canCreateContent: true,
        canModerateContent: true,
        canAccessGenesis: true,
        canManageUsers: false,
        canManageRoles: false,
        canViewAnalytics: true,
        canManageSystem: false,
      },
      [UserRole.CITIZEN]: {
        canAccessAdmin: false,
        canCreateContent: true,
        canModerateContent: false,
        canAccessGenesis: false,
        canManageUsers: false,
        canManageRoles: false,
        canViewAnalytics: false,
        canManageSystem: false,
      },
      [UserRole.STUDENT]: {
        canAccessAdmin: false,
        canCreateContent: false,
        canModerateContent: false,
        canAccessGenesis: false,
        canManageUsers: false,
        canManageRoles: false,
        canViewAnalytics: false,
        canManageSystem: false,
      },
    };

    return permissions[role];
  }
}
