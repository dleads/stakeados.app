/*
  # User Management System Enhancement

  1. Create user_roles table for custom roles
  2. Create user_activity_log table for activity monitoring
  3. Enhance existing role system with permissions
  4. Add indexes for performance
*/

-- Create custom user roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions text[] DEFAULT '{}',
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Admins can manage custom roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can view roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_activity_log
CREATE POLICY "Admins can view all activity logs"
  ON user_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own activity"
  ON user_activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON user_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO user_activity_log (
    user_id, action, resource_type, resource_id, 
    details, ip_address, user_agent
  )
  VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions from role
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS text[] AS $$
DECLARE
  user_role text;
  role_permissions text[];
  custom_permissions text[];
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM profiles WHERE id = p_user_id;
  
  -- Get permissions based on role
  CASE user_role
    WHEN 'admin' THEN
      role_permissions := ARRAY[
        'articles.create', 'articles.edit', 'articles.delete', 'articles.publish', 'articles.review',
        'news.create', 'news.edit', 'news.delete', 'news.process',
        'categories.manage', 'tags.manage', 'users.manage', 'settings.manage',
        'analytics.view', 'backup.manage'
      ];
    WHEN 'genesis' THEN
      role_permissions := ARRAY[
        'articles.create', 'articles.edit', 'articles.publish', 'articles.review',
        'news.create', 'news.edit', 'news.process',
        'categories.manage', 'tags.manage', 'analytics.view'
      ];
    WHEN 'citizen' THEN
      role_permissions := ARRAY[
        'articles.create', 'articles.edit',
        'news.create', 'news.edit'
      ];
    WHEN 'student' THEN
      role_permissions := ARRAY[]::text[];
    ELSE
      role_permissions := ARRAY[]::text[];
  END CASE;
  
  -- Get additional permissions from custom roles if any
  SELECT permissions INTO custom_permissions 
  FROM user_roles 
  WHERE name = user_role AND NOT is_system;
  
  -- Combine permissions
  IF custom_permissions IS NOT NULL THEN
    role_permissions := role_permissions || custom_permissions;
  END IF;
  
  RETURN role_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id uuid,
  p_permission text
)
RETURNS boolean AS $$
DECLARE
  user_permissions text[];
BEGIN
  user_permissions := get_user_permissions(p_user_id);
  RETURN p_permission = ANY(user_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on user_roles
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS user_roles_name_idx ON user_roles(name);
CREATE INDEX IF NOT EXISTS user_activity_log_user_id_idx ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS user_activity_log_action_idx ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS user_activity_log_created_at_idx ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS user_activity_log_resource_idx ON user_activity_log(resource_type, resource_id);

-- Insert default custom roles (non-system roles for content management)
INSERT INTO user_roles (name, description, permissions, is_system) VALUES
  ('editor', 'Content Editor', ARRAY[
    'articles.create', 'articles.edit', 'articles.publish', 'articles.review',
    'news.create', 'news.edit', 'news.process',
    'categories.manage', 'tags.manage', 'analytics.view'
  ], true),
  ('author', 'Content Author', ARRAY[
    'articles.create', 'articles.edit',
    'news.create', 'news.edit'
  ], true),
  ('moderator', 'Content Moderator', ARRAY[
    'articles.review', 'news.process', 'categories.manage', 'tags.manage'
  ], true)
ON CONFLICT (name) DO NOTHING;