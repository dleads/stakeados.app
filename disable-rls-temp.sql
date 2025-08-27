-- Temporarily disable RLS for content_categories
-- Execute this in Supabase SQL Editor
-- WARNING: This is a temporary solution for development only

-- 1. Disable RLS on content_categories table
ALTER TABLE content_categories DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions to public (temporary)
GRANT ALL ON content_categories TO public;

-- 3. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'content_categories';

-- 4. Test insertion (should work now)
INSERT INTO content_categories (name, slug, description, color, order_index) 
VALUES (
  '{"en": "Test Category", "es": "Categoría de Prueba"}',
  'test-category-temp',
  '{"en": "Test Description", "es": "Descripción de Prueba"}',
  '#FF0000',
  999
) RETURNING id, name, slug;

-- 5. Clean up test record
DELETE FROM content_categories WHERE slug = 'test-category-temp';

-- 6. Show current permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'content_categories'
ORDER BY grantee, privilege_type;
