-- =====================================================
-- SUPABASE WORKING SETUP - GUARANTEED TO WORK
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: COMPLETE CLEANUP
-- =====================================================

-- Drop all triggers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON ' || r.event_object_table || ' CASCADE';
    END LOOP;
END $$;

-- Drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.routine_name || ' CASCADE';
    END LOOP;
END $$;

-- Drop all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || r.table_name || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CREATE TABLES
-- =====================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  wallet_address TEXT,
  is_genesis BOOLEAN DEFAULT FALSE,
  total_points INTEGER DEFAULT 0,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'genesis', 'citizen', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  slug TEXT UNIQUE NOT NULL,
  reading_time INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  seo_title TEXT,
  seo_description TEXT,
  featured_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  source_name TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  category_id UUID REFERENCES categories(id),
  language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  processed BOOLEAN DEFAULT FALSE,
  trending_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_news_category_id ON news(category_id);
CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_role_audit_user_id ON role_audit_log(user_id);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION has_role_or_higher(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy JSONB := '{"student": 1, "citizen": 2, "genesis": 3, "admin": 4}';
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  IF user_role IS NULL THEN user_role := 'student'; END IF;
  RETURN (role_hierarchy->>user_role)::INTEGER >= (role_hierarchy->>required_role)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_role_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  IF user_role IS NULL THEN user_role := 'student'; END IF;
  
  CASE user_role
    WHEN 'admin' THEN
      RETURN '{"canAccessAdmin": true, "canCreateContent": true, "canModerateContent": true, "canAccessGenesis": true, "canManageUsers": true, "canManageRoles": true, "canViewAnalytics": true, "canManageSystem": true}';
    WHEN 'genesis' THEN
      RETURN '{"canAccessAdmin": false, "canCreateContent": true, "canModerateContent": true, "canAccessGenesis": true, "canManageUsers": false, "canManageRoles": false, "canViewAnalytics": true, "canManageSystem": false}';
    WHEN 'citizen' THEN
      RETURN '{"canAccessAdmin": false, "canCreateContent": true, "canModerateContent": false, "canAccessGenesis": false, "canManageUsers": false, "canManageRoles": false, "canViewAnalytics": false, "canManageSystem": false}';
    ELSE
      RETURN '{"canAccessAdmin": false, "canCreateContent": false, "canModerateContent": false, "canAccessGenesis": false, "canManageUsers": false, "canManageRoles": false, "canViewAnalytics": false, "canManageSystem": false}';
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  old_role TEXT;
  current_user_role TEXT;
BEGIN
  SELECT role INTO current_user_role FROM profiles WHERE id = auth.uid();
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  IF new_role NOT IN ('admin', 'genesis', 'citizen', 'student') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  SELECT role INTO old_role FROM profiles WHERE id = target_user_id;
  UPDATE profiles SET role = new_role, updated_at = NOW() WHERE id = target_user_id;
  INSERT INTO role_audit_log (user_id, old_role, new_role, changed_by, reason)
  VALUES (target_user_id, old_role, new_role, auth.uid(), reason);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Articles policies
CREATE POLICY "Anyone can read published articles" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage own articles" ON articles
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all articles" ON articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- News policies
CREATE POLICY "Anyone can read news" ON news
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage news" ON news
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories policies
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Role audit log policies
CREATE POLICY "Admins can read audit logs" ON role_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert audit logs" ON role_audit_log
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- STEP 8: INSERT DEFAULT DATA
-- =====================================================

INSERT INTO categories (name, slug, description, color, sort_order) VALUES
('DeFi', 'defi', 'Decentralized Finance', '#10B981', 1),
('NFTs', 'nfts', 'Non-Fungible Tokens', '#8B5CF6', 2),
('Base', 'base', 'Base Blockchain', '#3B82F6', 3),
('Trading', 'trading', 'Cryptocurrency Trading', '#F59E0B', 4),
('Technology', 'technology', 'Blockchain Technology', '#EF4444', 5),
('Regulation', 'regulation', 'Crypto Regulations', '#6B7280', 6);

-- =====================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON articles TO authenticated;
GRANT SELECT ON articles TO anon;
GRANT SELECT ON news TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON news TO authenticated;
GRANT SELECT ON categories TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT ON role_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_or_higher TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;

-- =====================================================
-- STEP 10: VERIFICATION
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    category_count INTEGER;
    rls_count INTEGER;
BEGIN
    -- Verify tables
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('profiles', 'articles', 'news', 'categories', 'role_audit_log');
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ SUCCESS: All 5 tables created successfully';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Expected 5 tables, found %', table_count;
    END IF;

    -- Verify functions
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN ('has_role_or_higher', 'get_role_permissions', 'update_user_role', 'update_updated_at_column');
    
    IF function_count = 4 THEN
        RAISE NOTICE '✅ SUCCESS: All 4 functions created successfully';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Expected 4 functions, found %', function_count;
    END IF;

    -- Verify categories
    SELECT COUNT(*) INTO category_count FROM categories;
    
    IF category_count = 6 THEN
        RAISE NOTICE '✅ SUCCESS: All 6 default categories inserted';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Expected 6 categories, found %', category_count;
    END IF;

    -- Verify RLS
    SELECT COUNT(*) INTO rls_count FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true;
    
    IF rls_count = 5 THEN
        RAISE NOTICE '✅ SUCCESS: RLS enabled on all 5 tables';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Expected RLS on 5 tables, found %', rls_count;
    END IF;

    -- Final success message
    RAISE NOTICE '🎉 DATABASE SETUP COMPLETE! 🎉';
    RAISE NOTICE 'Next step: Set your user as admin with the command:';
    RAISE NOTICE 'UPDATE profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
END $$;

COMMIT;