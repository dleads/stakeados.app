-- Setup Database Permissions
-- This migration sets up proper permissions for anon and authenticated roles

-- Grant basic schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant sequence usage for UUID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Profiles table permissions
GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

-- Categories table permissions (read-only for all users)
GRANT SELECT ON categories TO anon, authenticated;

-- Articles table permissions
GRANT SELECT ON articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON articles TO authenticated;

-- News table permissions (read-only for all users)
GRANT SELECT ON news TO anon, authenticated;

-- Role audit log permissions (read-only for authenticated users)
GRANT SELECT ON role_audit_log TO authenticated;

-- Function execution permissions
-- Role hierarchy function (needed for RLS policies)
GRANT EXECUTE ON FUNCTION has_role_or_higher(UUID, TEXT) TO anon, authenticated;

-- Role permissions function (needed for frontend)
GRANT EXECUTE ON FUNCTION get_role_permissions(UUID) TO authenticated;

-- Role update function (admin only, but grant to authenticated for RLS to work)
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT, TEXT) TO authenticated;

-- Timestamp trigger function (system use only)
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- Grant permissions on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- Ensure RLS is enabled on all tables (redundant but safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- Verification queries
DO $$
BEGIN
    -- Check if permissions are granted correctly
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE grantee = 'anon' AND table_name = 'profiles' AND privilege_type = 'SELECT'
    ) THEN
        RAISE EXCEPTION 'Failed to grant SELECT permission on profiles to anon role';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE grantee = 'authenticated' AND table_name = 'profiles' AND privilege_type = 'INSERT'
    ) THEN
        RAISE EXCEPTION 'Failed to grant INSERT permission on profiles to authenticated role';
    END IF;

    -- Check function permissions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routine_privileges 
        WHERE grantee = 'authenticated' AND routine_name = 'has_role_or_higher'
    ) THEN
        RAISE EXCEPTION 'Failed to grant EXECUTE permission on has_role_or_higher to authenticated role';
    END IF;

    RAISE NOTICE 'Database permissions setup completed successfully';
END $$;