-- Force Complete Supabase Reset
-- Execute this in Supabase SQL Editor
-- This will force delete everything and start fresh

-- 1. Disable RLS on all tables first
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS article_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS article_tags DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view active categories" ON content_categories;
DROP POLICY IF EXISTS "Authenticated users can view all categories" ON content_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON content_categories;
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
DROP POLICY IF EXISTS "Authors can manage their articles" ON articles;
DROP POLICY IF EXISTS "Admins can manage all articles" ON articles;
DROP POLICY IF EXISTS "Users can manage their own interactions" ON content_interactions;

-- 3. Drop ALL triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_content_categories_updated_at ON content_categories;
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;

-- 4. Drop ALL functions
DROP FUNCTION IF EXISTS get_category_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 5. Drop ALL tables with CASCADE (this will handle dependencies)
DROP TABLE IF EXISTS article_tags CASCADE;
DROP TABLE IF EXISTS content_tags CASCADE;
DROP TABLE IF EXISTS content_interactions CASCADE;
DROP TABLE IF EXISTS news_categories CASCADE;
DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS content_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 6. Drop any remaining tables that might exist
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS role_audit_log CASCADE;
DROP TABLE IF EXISTS role_permissions_cache CASCADE;
DROP TABLE IF EXISTS news_sources CASCADE;
DROP TABLE IF EXISTS news_source_categories CASCADE;

-- 7. Drop ALL indexes (in case any remain)
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_wallet;
DROP INDEX IF EXISTS idx_content_categories_slug;
DROP INDEX IF EXISTS idx_content_categories_active;
DROP INDEX IF EXISTS idx_content_categories_parent;
DROP INDEX IF EXISTS idx_articles_slug;
DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_articles_author;
DROP INDEX IF EXISTS idx_articles_published;
DROP INDEX IF EXISTS idx_articles_featured;
DROP INDEX IF EXISTS idx_article_categories_article;
DROP INDEX IF EXISTS idx_article_categories_category;
DROP INDEX IF EXISTS idx_content_interactions_user;
DROP INDEX IF EXISTS idx_content_interactions_content;
DROP INDEX IF EXISTS idx_content_interactions_type;
DROP INDEX IF EXISTS idx_content_tags_slug;
DROP INDEX IF EXISTS idx_content_tags_usage;

-- 8. Revoke ALL permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- 9. Verify everything is clean
SELECT 
  'Tables remaining:' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

SELECT 
  'Functions remaining:' as check_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public';

SELECT 
  'Policies remaining:' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- 10. Show final status
SELECT 'Supabase completely reset - ready for fresh start' as status;
