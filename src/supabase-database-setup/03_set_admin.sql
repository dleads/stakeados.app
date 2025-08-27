-- Sets a specific user to be an admin.
-- IMPORTANT: Make sure the UUID matches the user you want to elevate.

BEGIN;

UPDATE public.profiles
SET role = 'admin'
WHERE id = '1fa7b063-42f6-44ef-bc1b-c4c92726a0d5';

COMMIT;

-- Verification
SELECT 'Admin user set successfully for ID 1fa7b063-42f6-44ef-bc1b-c4c92726a0d5' as status;
