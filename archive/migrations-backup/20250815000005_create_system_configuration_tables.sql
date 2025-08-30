-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_backups table for tracking backups
CREATE TABLE IF NOT EXISTS system_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('automatic', 'manual')) DEFAULT 'manual',
    status TEXT CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
    size BIGINT DEFAULT 0,
    includes_media BOOLEAN DEFAULT FALSE,
    file_path TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create system_maintenance_tasks table for tracking maintenance tasks
CREATE TABLE IF NOT EXISTS system_maintenance_tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('idle', 'running', 'completed', 'failed')) DEFAULT 'idle',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_system_maintenance_tasks_status ON system_maintenance_tasks(status);

-- Create RLS policies for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view system settings" ON system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin users can modify system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for system_backups
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view system backups" ON system_backups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin users can modify system backups" ON system_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for system_maintenance_tasks
ALTER TABLE system_maintenance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view maintenance tasks" ON system_maintenance_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin users can modify maintenance tasks" ON system_maintenance_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_maintenance_tasks_updated_at 
    BEFORE UPDATE ON system_maintenance_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default maintenance tasks
INSERT INTO system_maintenance_tasks (id, name, description) VALUES
    ('cleanup-temp-files', 'Cleanup Temporary Files', 'Remove temporary files and cache older than 7 days'),
    ('optimize-database', 'Optimize Database', 'Analyze and optimize database tables for better performance'),
    ('cleanup-old-logs', 'Cleanup Old Logs', 'Remove log files older than 30 days'),
    ('update-search-index', 'Update Search Index', 'Rebuild search indexes for articles and news'),
    ('cleanup-unused-media', 'Cleanup Unused Media', 'Remove media files that are no longer referenced')
ON CONFLICT (id) DO NOTHING;