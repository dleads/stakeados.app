-- Create bulk operations tracking table
CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('articles', 'news', 'categories', 'tags')),
    operation_action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    progress DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
    errors JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user_id ON bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at ON bulk_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_operation_type ON bulk_operations(operation_type);

-- Create RLS policies
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bulk operations
CREATE POLICY "Users can view own bulk operations" ON bulk_operations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create bulk operations
CREATE POLICY "Users can create bulk operations" ON bulk_operations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bulk operations
CREATE POLICY "Users can update own bulk operations" ON bulk_operations
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update progress
CREATE OR REPLACE FUNCTION update_bulk_operation_progress(
    job_id UUID,
    new_processed_items INTEGER,
    new_success_count INTEGER,
    new_error_count INTEGER,
    new_errors JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    total_items INTEGER;
    new_progress DECIMAL(5,2);
    new_status TEXT;
BEGIN
    -- Get total items
    SELECT bulk_operations.total_items INTO total_items
    FROM bulk_operations
    WHERE id = job_id;

    -- Calculate progress
    IF total_items > 0 THEN
        new_progress := (new_processed_items::DECIMAL / total_items::DECIMAL) * 100;
    ELSE
        new_progress := 0;
    END IF;

    -- Determine status
    IF new_processed_items >= total_items THEN
        new_status := 'completed';
    ELSE
        new_status := 'running';
    END IF;

    -- Update the record
    UPDATE bulk_operations
    SET 
        processed_items = new_processed_items,
        success_count = new_success_count,
        error_count = new_error_count,
        progress = new_progress,
        status = new_status,
        errors = COALESCE(new_errors, errors),
        completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new bulk operation job
CREATE OR REPLACE FUNCTION create_bulk_operation_job(
    user_id UUID,
    operation_type TEXT,
    operation_action TEXT,
    total_items INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    job_id UUID;
BEGIN
    INSERT INTO bulk_operations (
        user_id,
        operation_type,
        operation_action,
        total_items,
        metadata,
        status,
        started_at
    )
    VALUES (
        user_id,
        operation_type,
        operation_action,
        total_items,
        metadata,
        'running',
        NOW()
    )
    RETURNING id INTO job_id;

    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_bulk_operation_progress TO authenticated;
GRANT EXECUTE ON FUNCTION create_bulk_operation_job TO authenticated;