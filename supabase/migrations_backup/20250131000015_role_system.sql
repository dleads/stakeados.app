/*
  # Role System Implementation

  1. Add role field to profiles table
  2. Create role audit log table
  3. Add role-based policies
  4. Create role management functions
  5. Insert default admin user
*/

-- Add role field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('admin', 'genesis', 'citizen', 'student')) DEFAULT 'citizen';

-- Create role audit log table
CREATE TABLE IF NOT EXISTS role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role text,
  new_role text,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create role permissions cache table
CREATE TABLE IF NOT EXISTS role_permissions_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  permissions jsonb,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions_cache ENABLE ROW LEVEL SECURITY;

-- Policies for role_audit_log
CREATE POLICY "Admins can view all role audit logs"
  ON role_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own role changes"
  ON role_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert role audit logs"
  ON role_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for role_permissions_cache
CREATE POLICY "Users can manage their own permission cache"
  ON role_permissions_cache
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Update existing profiles policies to include role
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile (except role)"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = OLD.role);

-- Add policy for admin role updates
CREATE POLICY "Admins can update roles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role with audit
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id uuid,
  new_role text,
  reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  old_role text;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = current_user_id AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  -- Get old role
  SELECT role INTO old_role FROM profiles WHERE id = target_user_id;
  
  -- Update role
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
  
  -- Log the change
  INSERT INTO role_audit_log (user_id, old_role, new_role, changed_by, reason)
  VALUES (target_user_id, old_role, new_role, current_user_id, reason);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check role hierarchy
CREATE OR REPLACE FUNCTION has_role_or_higher(
  user_id uuid,
  required_role text
)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  CASE required_role
    WHEN 'admin' THEN
      RETURN user_role = 'admin';
    WHEN 'genesis' THEN
      RETURN user_role IN ('admin', 'genesis');
    WHEN 'citizen' THEN
      RETURN user_role IN ('admin', 'genesis', 'citizen');
    WHEN 'student' THEN
      RETURN user_role IN ('admin', 'genesis', 'citizen', 'student');
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get role permissions
CREATE OR REPLACE FUNCTION get_role_permissions(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_role text;
  permissions jsonb;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  CASE user_role
    WHEN 'admin' THEN
      permissions := '{
        "canAccessAdmin": true,
        "canCreateContent": true,
        "canModerateContent": true,
        "canAccessGenesis": true,
        "canManageUsers": true,
        "canManageRoles": true,
        "canViewAnalytics": true,
        "canManageSystem": true
      }';
    WHEN 'genesis' THEN
      permissions := '{
        "canAccessAdmin": false,
        "canCreateContent": true,
        "canModerateContent": true,
        "canAccessGenesis": true,
        "canManageUsers": false,
        "canManageRoles": false,
        "canViewAnalytics": true,
        "canManageSystem": false
      }';
    WHEN 'citizen' THEN
      permissions := '{
        "canAccessAdmin": false,
        "canCreateContent": true,
        "canModerateContent": false,
        "canAccessGenesis": false,
        "canManageUsers": false,
        "canManageRoles": false,
        "canViewAnalytics": false,
        "canManageSystem": false
      }';
    WHEN 'student' THEN
      permissions := '{
        "canAccessAdmin": false,
        "canCreateContent": false,
        "canModerateContent": false,
        "canAccessGenesis": false,
        "canManageUsers": false,
        "canManageRoles": false,
        "canViewAnalytics": false,
        "canManageSystem": false
      }';
    ELSE
      permissions := '{
        "canAccessAdmin": false,
        "canCreateContent": false,
        "canModerateContent": false,
        "canAccessGenesis": false,
        "canManageUsers": false,
        "canManageRoles": false,
        "canViewAnalytics": false,
        "canManageSystem": false
      }';
  END CASE;
  
  RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS role_audit_log_user_id_idx ON role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS role_audit_log_created_at_idx ON role_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS role_permissions_cache_expires_idx ON role_permissions_cache(expires_at);

-- Function to clean expired permission cache
CREATE OR REPLACE FUNCTION clean_expired_permission_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM role_permissions_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean expired cache (if using pg_cron)
-- SELECT cron.schedule('clean-permission-cache', '0 2 * * *', 'SELECT clean_expired_permission_cache();');

-- Insert default admin user (replace with your email)
-- This will be done via the application, not in migration
-- INSERT INTO profiles (id, email, role, display_name) 
-- VALUES ('your-admin-user-id', 'your-admin@email.com', 'admin', 'Admin User')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Update the handle_new_user function to set default role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'citizen' -- Default role for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
