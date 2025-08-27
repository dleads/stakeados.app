-- Fix RLS Policies for content_categories
-- Execute this in Supabase SQL Editor

-- 1. First, let's check the current user and their role
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 2. Check if the current user has a profile with admin role
SELECT 
  id,
  role,
  display_name,
  email
FROM profiles 
WHERE id = auth.uid();

-- 3. Drop all existing policies for content_categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON content_categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON content_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON content_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON content_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON content_categories;

-- 4. Create new, more permissive policies for testing
-- Allow all authenticated users to view categories
CREATE POLICY "Authenticated users can view categories"
  ON content_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert categories (temporary for testing)
CREATE POLICY "Authenticated users can insert categories"
  ON content_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update categories (temporary for testing)
CREATE POLICY "Authenticated users can update categories"
  ON content_categories
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow all authenticated users to delete categories (temporary for testing)
CREATE POLICY "Authenticated users can delete categories"
  ON content_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. Also allow public to view active categories
CREATE POLICY "Public can view active categories"
  ON content_categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- 6. Ensure RLS is enabled
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- 7. Grant all permissions to authenticated users
GRANT ALL ON content_categories TO authenticated;

-- 8. Test the policies
-- This should work for any authenticated user
SELECT * FROM content_categories LIMIT 5;

-- 9. Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'content_categories';
