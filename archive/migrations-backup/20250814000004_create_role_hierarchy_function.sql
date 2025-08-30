-- Create role hierarchy checking function
-- This function checks if a user has a specific role or higher in the hierarchy
-- Role hierarchy: admin (4) > genesis (3) > citizen (2) > student (1)

-- Drop function if it exists
DROP FUNCTION IF EXISTS has_role_or_higher(UUID, TEXT);

-- Create the role hierarchy checking function
CREATE OR REPLACE FUNCTION has_role_or_higher(
    user_id UUID,
    required_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_role_level INTEGER;
    required_role_level INTEGER;
    role_hierarchy JSONB;
BEGIN
    -- Input validation
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL';
    END IF;
    
    IF required_role IS NULL OR required_role = '' THEN
        RAISE EXCEPTION 'required_role cannot be NULL or empty';
    END IF;

    -- Define role hierarchy as JSON object
    role_hierarchy := '{
        "student": 1,
        "citizen": 2,
        "genesis": 3,
        "admin": 4
    }'::jsonb;

    -- Validate required_role exists in hierarchy
    IF NOT role_hierarchy ? required_role THEN
        RAISE EXCEPTION 'Invalid required_role: %. Valid roles are: student, citizen, genesis, admin', required_role;
    END IF;

    -- Get user's current role from profiles table
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id;

    -- Handle case where user doesn't exist or role is NULL - default to student
    IF user_role IS NULL THEN
        user_role := 'student';
    END IF;

    -- Validate user_role exists in hierarchy (should not happen with proper constraints)
    IF NOT role_hierarchy ? user_role THEN
        -- Default to student if somehow an invalid role exists
        user_role := 'student';
    END IF;

    -- Get role levels from hierarchy
    user_role_level := (role_hierarchy ->> user_role)::INTEGER;
    required_role_level := (role_hierarchy ->> required_role)::INTEGER;

    -- Return true if user's role level is greater than or equal to required level
    RETURN user_role_level >= required_role_level;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false for any unexpected errors
        RAISE LOG 'Error in has_role_or_higher function: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_role_or_higher(UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION has_role_or_higher(UUID, TEXT) IS 
'Checks if a user has a specific role or higher in the role hierarchy. 
Role hierarchy: admin (4) > genesis (3) > citizen (2) > student (1).
Returns FALSE for any errors or invalid inputs.
Defaults to student role if user role is NULL.';