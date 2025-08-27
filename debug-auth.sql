-- Debug Authentication Issues
-- Execute this in Supabase SQL Editor

-- 1. Check if we're authenticated in the SQL Editor
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'Authenticated'
    ELSE 'Not Authenticated'
  END as auth_status,
  auth.uid() as user_id,
  auth.email() as user_email,
  auth.role() as user_role;

-- 2. Check if the user exists in profiles table
SELECT 
  id,
  email,
  role,
  display_name,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- 3. Check all users in profiles table (to see what users exist)
SELECT 
  id,
  email,
  role,
  display_name,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Test if we can insert into content_categories (this should work if authenticated)
INSERT INTO content_categories (name, slug, description, color, order_index) 
VALUES (
  '{"en": "Test Category", "es": "Categoría de Prueba"}',
  'test-category',
  '{"en": "Test Description", "es": "Descripción de Prueba"}',
  '#FF0000',
  999
) RETURNING id, name, slug;

-- 5. Clean up the test record
DELETE FROM content_categories WHERE slug = 'test-category';

-- 6. Show current RLS status for content_categories
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'content_categories';

-- 7. Show all policies for content_categories
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'content_categories'
ORDER BY cmd;
