-- Create content_uploads table for tracking file uploads
CREATE TABLE IF NOT EXISTS content_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    upload_type TEXT NOT NULL DEFAULT 'general',
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    public_url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_uploads_uploaded_by ON content_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_content_uploads_upload_type ON content_uploads(upload_type);
CREATE INDEX IF NOT EXISTS idx_content_uploads_created_at ON content_uploads(created_at);

-- Enable RLS
ALTER TABLE content_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view all uploads" ON content_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admin users can insert uploads" ON content_uploads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admin users can update their uploads" ON content_uploads
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin users can delete uploads" ON content_uploads
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_content_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_uploads_updated_at
    BEFORE UPDATE ON content_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_content_uploads_updated_at();