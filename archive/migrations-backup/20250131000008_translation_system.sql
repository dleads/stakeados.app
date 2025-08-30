-- Translation System Migration
-- This migration adds support for content translation workflow

-- Create translation tasks table
CREATE TABLE IF NOT EXISTS translation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT CHECK (content_type IN ('article', 'news')) NOT NULL,
  source_locale TEXT CHECK (source_locale IN ('en', 'es')) NOT NULL,
  target_locale TEXT CHECK (target_locale IN ('en', 'es')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'needs_review')) DEFAULT 'pending',
  
  -- Content data
  original_content JSONB NOT NULL,
  translated_content JSONB,
  ai_suggestion JSONB,
  
  -- Assignment and tracking
  translator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Feedback and notes
  feedback TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(content_id, content_type, target_locale),
  CHECK (source_locale != target_locale)
);

-- Create indexes for translation tasks
CREATE INDEX idx_translation_tasks_content ON translation_tasks(content_id, content_type);
CREATE INDEX idx_translation_tasks_status ON translation_tasks(status);
CREATE INDEX idx_translation_tasks_translator ON translation_tasks(translator_id);
CREATE INDEX idx_translation_tasks_created_by ON translation_tasks(created_by);
CREATE INDEX idx_translation_tasks_target_locale ON translation_tasks(target_locale);
CREATE INDEX idx_translation_tasks_created_at ON translation_tasks(created_at DESC);

-- Create translation activity log
CREATE TABLE IF NOT EXISTS translation_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES translation_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('created', 'assigned', 'started', 'updated', 'completed', 'reviewed')) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for translation activity
CREATE INDEX idx_translation_activity_task ON translation_activity(task_id);
CREATE INDEX idx_translation_activity_user ON translation_activity(user_id);
CREATE INDEX idx_translation_activity_created_at ON translation_activity(created_at DESC);

-- Function to update translation task updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for translation tasks updated_at
CREATE TRIGGER trigger_translation_tasks_updated_at
  BEFORE UPDATE ON translation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_task_updated_at();

-- Function to log translation activity
CREATE OR REPLACE FUNCTION log_translation_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO translation_activity (task_id, user_id, action, details)
    VALUES (NEW.id, NEW.created_by, 'created', jsonb_build_object(
      'content_id', NEW.content_id,
      'content_type', NEW.content_type,
      'target_locale', NEW.target_locale
    ));
    RETURN NEW;
  END IF;
  
  -- Log updates
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status != NEW.status THEN
      INSERT INTO translation_activity (task_id, user_id, action, details)
      VALUES (NEW.id, COALESCE(NEW.translator_id, NEW.created_by), NEW.status, jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ));
    END IF;
    
    -- Assignment change
    IF OLD.translator_id IS DISTINCT FROM NEW.translator_id THEN
      INSERT INTO translation_activity (task_id, user_id, action, details)
      VALUES (NEW.id, NEW.created_by, 'assigned', jsonb_build_object(
        'old_translator_id', OLD.translator_id,
        'new_translator_id', NEW.translator_id
      ));
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging translation activity
CREATE TRIGGER trigger_log_translation_activity
  AFTER INSERT OR UPDATE ON translation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_translation_activity();

-- Function to get translation completeness for content
CREATE OR REPLACE FUNCTION get_translation_completeness(
  p_content_id UUID,
  p_content_type TEXT
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  total_locales INTEGER,
  translated_locales INTEGER,
  completeness_percentage NUMERIC,
  missing_locales TEXT[]
) AS $$
DECLARE
  available_locales TEXT[] := ARRAY['en', 'es'];
  missing_locales TEXT[];
  translated_count INTEGER;
BEGIN
  -- Count translated locales
  SELECT COUNT(DISTINCT target_locale)
  INTO translated_count
  FROM translation_tasks
  WHERE translation_tasks.content_id = p_content_id
    AND translation_tasks.content_type = p_content_type
    AND status = 'completed';
  
  -- Find missing locales
  SELECT ARRAY(
    SELECT locale
    FROM unnest(available_locales) AS locale
    WHERE locale NOT IN (
      SELECT target_locale
      FROM translation_tasks
      WHERE translation_tasks.content_id = p_content_id
        AND translation_tasks.content_type = p_content_type
        AND status = 'completed'
    )
  ) INTO missing_locales;
  
  RETURN QUERY
  SELECT 
    p_content_id,
    p_content_type,
    array_length(available_locales, 1) as total_locales,
    translated_count as translated_locales,
    CASE 
      WHEN array_length(available_locales, 1) > 0 
      THEN (translated_count::NUMERIC / array_length(available_locales, 1)::NUMERIC) * 100
      ELSE 0 
    END as completeness_percentage,
    missing_locales;
END;
$$ LANGUAGE plpgsql;

-- Function to get global translation statistics
CREATE OR REPLACE FUNCTION get_global_translation_stats()
RETURNS TABLE (
  total_tasks INTEGER,
  pending_tasks INTEGER,
  in_progress_tasks INTEGER,
  completed_tasks INTEGER,
  needs_review_tasks INTEGER,
  completion_rate NUMERIC,
  average_completion_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH task_stats AS (
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
      COUNT(*) FILTER (WHERE status = 'needs_review') as needs_review_tasks
    FROM translation_tasks
  ),
  completion_time AS (
    SELECT 
      AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) as avg_hours
    FROM translation_tasks
    WHERE status = 'completed' AND completed_at IS NOT NULL
  )
  SELECT 
    ts.total_tasks,
    ts.pending_tasks,
    ts.in_progress_tasks,
    ts.completed_tasks,
    ts.needs_review_tasks,
    CASE 
      WHEN ts.total_tasks > 0 
      THEN (ts.completed_tasks::NUMERIC / ts.total_tasks::NUMERIC) * 100
      ELSE 0 
    END as completion_rate,
    COALESCE(ct.avg_hours, 0) as average_completion_time
  FROM task_stats ts, completion_time ct;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on translation tables
ALTER TABLE translation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies for translation_tasks
CREATE POLICY "Users can view their own translation tasks"
  ON translation_tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    translator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Users can create translation tasks"
  ON translation_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their assigned translation tasks"
  ON translation_tasks
  FOR UPDATE
  TO authenticated
  USING (
    translator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- RLS policies for translation_activity
CREATE POLICY "Users can view translation activity for their tasks"
  ON translation_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM translation_tasks 
      WHERE translation_tasks.id = translation_activity.task_id
        AND (translation_tasks.created_by = auth.uid() OR 
             translation_tasks.translator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')))
    )
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_translation_completeness(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_translation_stats() TO authenticated;