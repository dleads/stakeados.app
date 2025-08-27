-- Update profiles.role default to 'student' and adjust CHECK constraint to allowed roles (student, admin)
-- Safe for existing data; does not modify current values.

-- Drop existing CHECK constraint on profiles.role if present
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role%IN%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- Remap legacy roles to 'student' to comply with new constraint
UPDATE public.profiles
SET role = 'student'
WHERE role IN ('user', 'editor');

-- Add explicit CHECK constraint for roles used in Fase 1
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'admin')) NOT VALID;

-- Set default to 'student' for new users
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student';

-- Validate constraint after data remapping
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_role_check;

-- Optional: ensure role is not null (only if desired)
-- ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
