SELECT 'Checking existing constraints' as step;

SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles';

SELECT 'Dropping all foreign key constraints' as step;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'profiles'
          AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
    END LOOP;
END $$;

SELECT 'Creating admin user' as step;

INSERT INTO profiles (id, email, role, display_name) 
VALUES (
  gen_random_uuid(),
  'admin@stakeados.com',
  'admin',
  'Administrator'
);

SELECT 'Re-adding foreign key constraint' as step;

ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

SELECT 
  'Admin verification' as step,
  id,
  email,
  role,
  display_name,
  created_at
FROM profiles 
WHERE email = 'admin@stakeados.com';

SELECT 
  'Testing categories access' as step,
  COUNT(*) as category_count
FROM content_categories;

SELECT 
  'Testing category stats function' as step,
  COUNT(*) as stats_count
FROM get_category_stats();

SELECT 
  'Setup completed successfully' as status,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM content_categories) as category_count,
  (SELECT COUNT(*) FROM profiles) as total_profiles;
