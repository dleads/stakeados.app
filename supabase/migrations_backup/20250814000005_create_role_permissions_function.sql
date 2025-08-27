-- Create role permissions function
-- This function returns a comprehensive JSONB object with all user capabilities
-- Based on role hierarchy: admin (4) > genesis/instructor (3) > citizen/editor (2) > student/user (1)
-- Supports both new role names and existing database role names for compatibility

-- Drop function if it exists
DROP FUNCTION IF EXISTS get_role_permissions(UUID);

-- Create the role permissions function
CREATE OR REPLACE FUNCTION get_role_permissions(
    user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    role_level INTEGER;
    permissions JSONB;
    role_hierarchy JSONB;
BEGIN
    -- Input validation
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL';
    END IF;

    -- Define role hierarchy as JSON object (supporting both old and new role names)
    role_hierarchy := '{
        "student": 1,
        "user": 1,
        "citizen": 2,
        "editor": 2,
        "genesis": 3,
        "instructor": 3,
        "admin": 4
    }'::jsonb;

    -- Get user's current role from profiles table
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;

    -- Handle case where user doesn't exist or role is NULL - default to student
    IF user_role IS NULL THEN
        user_role := 'student';
    END IF;

    -- Validate user_role exists in hierarchy (should not happen with proper constraints)
    IF NOT role_hierarchy ? user_role THEN
        -- Default to student if somehow an invalid role exists
        user_role := 'student';
    END IF;

    -- Get role level from hierarchy
    role_level := (role_hierarchy ->> user_role)::INTEGER;

    -- Build permissions object based on role level
    CASE role_level
        WHEN 4 THEN -- admin
            permissions := '{
                "role": "admin",
                "level": 4,
                "content": {
                    "create_articles": true,
                    "edit_own_articles": true,
                    "edit_any_articles": true,
                    "delete_own_articles": true,
                    "delete_any_articles": true,
                    "publish_articles": true,
                    "manage_categories": true,
                    "manage_news": true,
                    "view_drafts": true,
                    "moderate_content": true
                },
                "users": {
                    "view_all_profiles": true,
                    "edit_any_profile": true,
                    "manage_user_roles": true,
                    "view_audit_logs": true,
                    "ban_users": true,
                    "delete_users": true
                },
                "admin": {
                    "access_admin_panel": true,
                    "manage_system_settings": true,
                    "view_analytics": true,
                    "manage_permissions": true,
                    "system_maintenance": true,
                    "database_access": true
                },
                "community": {
                    "create_announcements": true,
                    "moderate_comments": true,
                    "manage_events": true,
                    "feature_content": true
                }
            }'::jsonb;
        
        WHEN 3 THEN -- genesis/instructor
            permissions := '{
                "role": "genesis",
                "level": 3,
                "content": {
                    "create_articles": true,
                    "edit_own_articles": true,
                    "edit_any_articles": false,
                    "delete_own_articles": true,
                    "delete_any_articles": false,
                    "publish_articles": true,
                    "manage_categories": false,
                    "manage_news": false,
                    "view_drafts": true,
                    "moderate_content": true
                },
                "users": {
                    "view_all_profiles": true,
                    "edit_any_profile": false,
                    "manage_user_roles": false,
                    "view_audit_logs": false,
                    "ban_users": false,
                    "delete_users": false
                },
                "admin": {
                    "access_admin_panel": false,
                    "manage_system_settings": false,
                    "view_analytics": false,
                    "manage_permissions": false,
                    "system_maintenance": false,
                    "database_access": false
                },
                "community": {
                    "create_announcements": true,
                    "moderate_comments": true,
                    "manage_events": false,
                    "feature_content": false
                }
            }'::jsonb;
        
        WHEN 2 THEN -- citizen/editor
            permissions := '{
                "role": "citizen",
                "level": 2,
                "content": {
                    "create_articles": true,
                    "edit_own_articles": true,
                    "edit_any_articles": false,
                    "delete_own_articles": true,
                    "delete_any_articles": false,
                    "publish_articles": false,
                    "manage_categories": false,
                    "manage_news": false,
                    "view_drafts": false,
                    "moderate_content": false
                },
                "users": {
                    "view_all_profiles": false,
                    "edit_any_profile": false,
                    "manage_user_roles": false,
                    "view_audit_logs": false,
                    "ban_users": false,
                    "delete_users": false
                },
                "admin": {
                    "access_admin_panel": false,
                    "manage_system_settings": false,
                    "view_analytics": false,
                    "manage_permissions": false,
                    "system_maintenance": false,
                    "database_access": false
                },
                "community": {
                    "create_announcements": false,
                    "moderate_comments": false,
                    "manage_events": false,
                    "feature_content": false
                }
            }'::jsonb;
        
        ELSE -- student/user (level 1) or any other case
            permissions := '{
                "role": "student",
                "level": 1,
                "content": {
                    "create_articles": false,
                    "edit_own_articles": false,
                    "edit_any_articles": false,
                    "delete_own_articles": false,
                    "delete_any_articles": false,
                    "publish_articles": false,
                    "manage_categories": false,
                    "manage_news": false,
                    "view_drafts": false,
                    "moderate_content": false
                },
                "users": {
                    "view_all_profiles": false,
                    "edit_any_profile": false,
                    "manage_user_roles": false,
                    "view_audit_logs": false,
                    "ban_users": false,
                    "delete_users": false
                },
                "admin": {
                    "access_admin_panel": false,
                    "manage_system_settings": false,
                    "view_analytics": false,
                    "manage_permissions": false,
                    "system_maintenance": false,
                    "database_access": false
                },
                "community": {
                    "create_announcements": false,
                    "moderate_comments": false,
                    "manage_events": false,
                    "feature_content": false
                }
            }'::jsonb;
    END CASE;

    -- Add common permissions that all users have
    permissions := permissions || '{
        "common": {
            "read_published_articles": true,
            "read_news": true,
            "read_categories": true,
            "edit_own_profile": true,
            "view_own_profile": true,
            "comment_on_articles": true,
            "like_articles": true,
            "share_content": true
        }
    }'::jsonb;

    -- Add the original role name for reference
    permissions := permissions || jsonb_build_object('original_role', user_role);

    RETURN permissions;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return minimal student permissions for any unexpected errors
        RAISE LOG 'Error in get_role_permissions function: %', SQLERRM;
        RETURN '{
            "role": "student",
            "level": 1,
            "error": true,
            "content": {
                "create_articles": false,
                "edit_own_articles": false,
                "edit_any_articles": false,
                "delete_own_articles": false,
                "delete_any_articles": false,
                "publish_articles": false,
                "manage_categories": false,
                "manage_news": false,
                "view_drafts": false,
                "moderate_content": false
            },
            "users": {
                "view_all_profiles": false,
                "edit_any_profile": false,
                "manage_user_roles": false,
                "view_audit_logs": false,
                "ban_users": false,
                "delete_users": false
            },
            "admin": {
                "access_admin_panel": false,
                "manage_system_settings": false,
                "view_analytics": false,
                "manage_permissions": false,
                "system_maintenance": false,
                "database_access": false
            },
            "community": {
                "create_announcements": false,
                "moderate_comments": false,
                "manage_events": false,
                "feature_content": false
            },
            "common": {
                "read_published_articles": true,
                "read_news": true,
                "read_categories": true,
                "edit_own_profile": true,
                "view_own_profile": true,
                "comment_on_articles": true,
                "like_articles": true,
                "share_content": true
            }
        }'::jsonb;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_role_permissions(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_role_permissions(UUID) IS 
'Returns a comprehensive JSONB object with all user capabilities based on their role.
Role hierarchy: admin (4) > genesis/instructor (3) > citizen/editor (2) > student/user (1).
Returns student permissions with error flag for any errors or invalid inputs.
Defaults to student role if user role is NULL.
Includes content, users, admin, community, and common permission categories.
Supports both new role names (student, citizen, genesis, admin) and existing role names (user, editor, instructor, admin).';