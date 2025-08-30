-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin role or higher
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'genesis')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role or higher
CREATE OR REPLACE FUNCTION auth.has_role_or_higher(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy JSONB := '{"student": 1, "citizen": 2, "genesis": 3, "admin": 4}';
  user_level INTEGER;
  required_level INTEGER;
BEGIN
  -- Get user's current role
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- If no user found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get numeric levels for comparison
  user_level := (role_hierarchy ->> user_role)::INTEGER;
  required_level := (role_hierarchy ->> required_role)::INTEGER;
  
  -- Return true if user level is equal or higher
  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE POLICIES
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    -- Prevent users from changing their own role
    (OLD.role = NEW.role OR auth.is_admin())
  );

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (auth.is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (auth.is_admin());

-- Admins can insert profiles (for admin user creation)
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.is_admin());

-- Allow profile creation during user registration
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES TABLE POLICIES
-- Anyone can read categories (public content)
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (auth.is_admin());

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (auth.is_admin());

-- ARTICLES TABLE POLICIES
-- Anyone can read published articles
CREATE POLICY "Anyone can read published articles" ON articles
  FOR SELECT USING (status = 'published');

-- Authors can read their own articles (any status)
CREATE POLICY "Authors can read own articles" ON articles
  FOR SELECT USING (auth.uid() = author_id);

-- Admins can read all articles
CREATE POLICY "Admins can read all articles" ON articles
  FOR SELECT USING (auth.is_admin());

-- Authors can create articles
CREATE POLICY "Authors can create articles" ON articles
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND 
    auth.has_role_or_higher('citizen')
  );

-- Authors can update their own articles
CREATE POLICY "Authors can update own articles" ON articles
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Admins can update any article
CREATE POLICY "Admins can update any article" ON articles
  FOR UPDATE USING (auth.is_admin());

-- Authors can delete their own articles
CREATE POLICY "Authors can delete own articles" ON articles
  FOR DELETE USING (auth.uid() = author_id);

-- Admins can delete any article
CREATE POLICY "Admins can delete any article" ON articles
  FOR DELETE USING (auth.is_admin());

-- NEWS TABLE POLICIES
-- Anyone can read news (public content)
CREATE POLICY "Anyone can read news" ON news
  FOR SELECT USING (true);

-- Only admins can manage news
CREATE POLICY "Admins can insert news" ON news
  FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update news" ON news
  FOR UPDATE USING (auth.is_admin());

CREATE POLICY "Admins can delete news" ON news
  FOR DELETE USING (auth.is_admin());

-- ROLE AUDIT LOG POLICIES
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON role_audit_log
  FOR SELECT USING (auth.is_admin());

-- System can insert audit logs (for role change tracking)
CREATE POLICY "System can insert audit logs" ON role_audit_log
  FOR INSERT WITH CHECK (true);

-- No updates or deletes allowed on audit logs (immutable)
-- (No policies needed - will be denied by default)

-- Grant necessary permissions to authenticated users
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON articles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON articles TO authenticated;
GRANT SELECT ON news TO authenticated;
GRANT SELECT ON role_audit_log TO authenticated;
GRANT INSERT ON role_audit_log TO authenticated;

-- Grant permissions to anon users for public content
GRANT SELECT ON categories TO anon;
GRANT SELECT ON articles TO anon;
GRANT SELECT ON news TO anon;