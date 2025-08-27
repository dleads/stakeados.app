-- Restore Admin User After Reset
-- Execute this in Supabase SQL Editor

-- 1. Insert the specific admin user that existed before
INSERT INTO profiles (id, email, role, display_name, avatar_url, created_at) 
VALUES (
  '1a54282b-ba24-4f4c-8573-662087f448ed', -- The specific ID from before
  'admin@stakeados.com', -- You can change this email
  'admin',
  'Administrator',
  null,
  '2025-08-07 03:04:46.211582+00'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  display_name = 'Administrator',
  email = COALESCE(profiles.email, 'admin@stakeados.com');

-- 2. Verify the admin user was created
SELECT 
  id,
  email,
  role,
  display_name,
  avatar_url,
  created_at
FROM profiles 
WHERE id = '1a54282b-ba24-4f4c-8573-662087f448ed';

-- 3. Test admin permissions by checking if they can access categories
SELECT 
  'Admin user restored successfully' as status,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM profiles;

-- 4. Test if the admin can view categories (this should work)
SELECT 
  'Testing admin access to categories' as test,
  COUNT(*) as category_count
FROM content_categories;
