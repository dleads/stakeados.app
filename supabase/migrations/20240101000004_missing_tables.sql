-- Create missing tables that the code actually needs

-- Article collaboration sessions table
CREATE TABLE IF NOT EXISTS article_collaboration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  cursor_position jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Publication schedule table
CREATE TABLE IF NOT EXISTS publication_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  scheduled_for timestamptz NOT NULL,
  timezone text DEFAULT 'UTC',
  auto_publish boolean DEFAULT false,
  publish_channels jsonb DEFAULT '[]',
  status text CHECK (status IN ('scheduled', 'published', 'cancelled', 'failed')) DEFAULT 'scheduled',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Article history table
CREATE TABLE IF NOT EXISTS article_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Admin reports table
CREATE TABLE IF NOT EXISTS admin_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  config jsonb NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_run timestamptz,
  is_favorite boolean DEFAULT false
);

-- Content interactions table (for analytics)
CREATE TABLE IF NOT EXISTS content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  interaction_type text CHECK (interaction_type IN ('view', 'like', 'share', 'bookmark', 'comment')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_collaboration_sessions_article_id ON article_collaboration_sessions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_collaboration_sessions_user_id ON article_collaboration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_collaboration_sessions_active ON article_collaboration_sessions(is_active, last_activity);

CREATE INDEX IF NOT EXISTS idx_publication_schedule_content ON publication_schedule(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_publication_schedule_scheduled ON publication_schedule(scheduled_for, status);

CREATE INDEX IF NOT EXISTS idx_article_history_article ON article_history(article_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_reports_created_by ON admin_reports(created_by);

CREATE INDEX IF NOT EXISTS idx_content_interactions_content ON content_interactions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON content_interactions(user_id, created_at);
