-- Create role update function with audit logging
-- This function allows admins to update user roles with automatic audit logging
-- Requirements: 2.3, 2.4, 5.3, 5.4

-- Drop function if it exists
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT, TEXT);

-- Create the role update function
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT,
    reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
    target_user_current_role TEXT;
    valid_roles TEXT[] := ARRAY['student', 'citizen', 'genesis', 'admin'];
BEGIN
    -- Get the current user ID from auth context
    current_user_id := auth.uid();
    
    -- Input validation
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: No authenticated user found';
    END IF;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'target_user_id cannot be NULL';
    END IF;
    
    IF new_role IS NULL OR new_role = '' THEN
        RAISE EXCEPTION 'new_role cannot be NULL or empty';
    END IF;

    -- Validate new_role is in valid roles array
    IF NOT (new_role = ANY(valid_roles)) THEN
        RAISE EXCEPTION 'Invalid role: %. Valid roles are: %', new_role, array_to_string(valid_roles, ', ');
    END IF;

    -- Get current user's role for admin verification
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = current_user_id;

    -- Verify current user is admin
    IF current_user_role IS NULL OR current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only admins can update user roles. Current role: %', COALESCE(current_user_role, 'NULL');
    END IF;

    -- Check if target user exists and get their current role
    SELECT role INTO target_user_current_role
    FROM profiles
    WHERE id = target_user_id;

    IF target_user_current_role IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_id;
    END IF;

    -- Check if role is actually changing
    IF target_user_current_role = new_role THEN
        RAISE NOTICE 'User % already has role %. No change needed.', target_user_id, new_role;
        RETURN TRUE;
    END IF;

    -- Start transaction for atomic operation
    BEGIN
        -- Update the user's role
        UPDATE profiles
        SET 
            role = new_role,
            updated_at = NOW()
        WHERE id = target_user_id;

        -- Verify the update was successful
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to update role for user %', target_user_id;
        END IF;

        -- Log the role change to audit table
        INSERT INTO role_audit_log (
            user_id,
            old_role,
            new_role,
            changed_by,
            reason,
            created_at
        ) VALUES (
            target_user_id,
            target_user_current_role,
            new_role,
            current_user_id,
            reason,
            NOW()
        );

        -- Log success message
        RAISE NOTICE 'Successfully updated role for user % from % to % by admin %', 
            target_user_id, target_user_current_role, new_role, current_user_id;

        RETURN TRUE;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RAISE EXCEPTION 'Failed to update user role: %', SQLERRM;
    END;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false
        RAISE LOG 'Error in update_user_role function: %', SQLERRM;
        RAISE; -- Re-raise the exception to caller
END;
$$;

-- Grant execute permission to authenticated users (function will check admin role internally)
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION update_user_role(UUID, TEXT, TEXT) IS 
'Updates a user role with admin verification and automatic audit logging.
Parameters:
- target_user_id: UUID of the user whose role should be updated
- new_role: The new role to assign (student, citizen, genesis, admin)
- reason: Optional reason for the role change (for audit purposes)
Returns TRUE on success, raises exception on failure.
Only admins can call this function successfully.
All role changes are automatically logged to role_audit_log table.';