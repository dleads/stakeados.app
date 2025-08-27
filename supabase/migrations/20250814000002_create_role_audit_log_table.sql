-- Create role audit log table for tracking role changes
-- This table tracks all role changes for audit purposes

-- Create the role_audit_log table
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_role TEXT,
    new_role TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add NOT NULL constraints after table creation to ensure they apply correctly
ALTER TABLE public.role_audit_log 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN new_role SET NOT NULL,
ALTER COLUMN changed_by SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_audit_user_id ON public.role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_created_at ON public.role_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_role_audit_changed_by ON public.role_audit_log(changed_by);

-- Add comments for documentation
COMMENT ON TABLE public.role_audit_log IS 'Tracks all role changes for audit purposes';
COMMENT ON COLUMN public.role_audit_log.user_id IS 'The user whose role was changed';
COMMENT ON COLUMN public.role_audit_log.old_role IS 'The previous role (NULL for initial role assignment)';
COMMENT ON COLUMN public.role_audit_log.new_role IS 'The new role assigned';
COMMENT ON COLUMN public.role_audit_log.changed_by IS 'The user who made the role change';
COMMENT ON COLUMN public.role_audit_log.reason IS 'Optional reason for the role change';
COMMENT ON COLUMN public.role_audit_log.created_at IS 'When the role change occurred';

-- Enable Row Level Security
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for role_audit_log
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON public.role_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System can insert audit logs (for automated logging)
CREATE POLICY "System can insert audit logs" ON public.role_audit_log
    FOR INSERT
    WITH CHECK (true);

-- Only admins can delete audit logs (for data retention)
CREATE POLICY "Admins can delete audit logs" ON public.role_audit_log
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );