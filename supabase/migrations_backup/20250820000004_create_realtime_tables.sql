-- Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('article_status_change', 'news_processed', 'ai_processing_complete', 'system_alert', 'user_activity')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create background jobs table for process tracking
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT CHECK (job_type IN ('ai_processing', 'rss_fetch', 'bulk_operation', 'backup', 'maintenance')) NOT NULL,
    status TEXT CHECK (status IN ('started', 'progress', 'completed', 'failed', 'cancelled')) DEFAULT 'started',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    data JSONB DEFAULT '{}',
    started_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create article collaboration sessions table
CREATE TABLE IF NOT EXISTS article_collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    cursor_position JSONB,
    selection_range JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create real-time analytics cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    content_type TEXT CHECK (content_type IN ('article', 'news', 'category', 'global')),
    content_id UUID,
    metrics JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_expires_at ON admin_notifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_job_type ON background_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_at ON background_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_collaboration_article_id ON article_collaboration_sessions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_collaboration_user_id ON article_collaboration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_collaboration_active ON article_collaboration_sessions(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_content ON analytics_cache(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at) WHERE expires_at IS NOT NULL;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_notifications_updated_at 
    BEFORE UPDATE ON admin_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_background_jobs_updated_at 
    BEFORE UPDATE ON background_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_collaboration_sessions_updated_at 
    BEFORE UPDATE ON article_collaboration_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    DELETE FROM analytics_cache 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Clean up inactive collaboration sessions older than 24 hours
    UPDATE article_collaboration_sessions 
    SET is_active = FALSE, session_end = NOW()
    WHERE is_active = TRUE 
    AND last_activity < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_priority TEXT DEFAULT 'medium',
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO admin_notifications (
        user_id, type, title, message, data, priority, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_data, p_priority, p_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update background job progress
CREATE OR REPLACE FUNCTION update_background_job_progress(
    p_job_id UUID,
    p_status TEXT,
    p_progress INTEGER DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE background_jobs 
    SET 
        status = p_status,
        progress = COALESCE(p_progress, progress),
        message = COALESCE(p_message, message),
        data = COALESCE(p_data, data),
        completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start collaboration session
CREATE OR REPLACE FUNCTION start_collaboration_session(
    p_article_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- End any existing active sessions for this user on this article
    UPDATE article_collaboration_sessions 
    SET is_active = FALSE, session_end = NOW()
    WHERE article_id = p_article_id 
    AND user_id = p_user_id 
    AND is_active = TRUE;
    
    -- Create new session
    INSERT INTO article_collaboration_sessions (
        article_id, user_id
    ) VALUES (
        p_article_id, p_user_id
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_notifications
CREATE POLICY "Users can view their own notifications" ON admin_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for background_jobs
CREATE POLICY "Admins can view all background jobs" ON background_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'editor')
        )
    );

CREATE POLICY "Admins can manage background jobs" ON background_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for article_collaboration_sessions
CREATE POLICY "Users can view collaboration sessions for articles they can access" ON article_collaboration_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM articles a
            JOIN profiles p ON p.id = auth.uid()
            WHERE a.id = article_id
            AND (
                a.author_id = auth.uid() 
                OR p.role IN ('admin', 'super_admin', 'editor')
            )
        )
    );

CREATE POLICY "Users can manage their own collaboration sessions" ON article_collaboration_sessions
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for analytics_cache
CREATE POLICY "Admins can view analytics cache" ON analytics_cache
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'editor')
        )
    );

CREATE POLICY "Admins can manage analytics cache" ON analytics_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );