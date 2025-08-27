/*
  # Editorial Workflow and Moderation System

  1. New Tables
    - `editorial_assignments` - Track content assignments to editors
    - `content_reviews` - Store review history and feedback
    - `moderation_queue` - Queue for content moderation
    - `publication_schedule` - Scheduled publication management
    - `editorial_workflow_states` - Track workflow state changes

  2. Functions
    - Content assignment functions
    - Review workflow functions
    - Moderation functions

  3. Security
    - RLS policies for editorial access
*/

-- Editorial assignments table
CREATE TABLE IF NOT EXISTS editorial_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news', 'proposal')) NOT NULL,
  assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_type text CHECK (assignment_type IN ('review', 'edit', 'moderate', 'approve')) NOT NULL,
  status text CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assigned',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date timestamptz,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content reviews table
CREATE TABLE IF NOT EXISTS content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news', 'proposal')) NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_type text CHECK (review_type IN ('editorial', 'technical', 'moderation', 'final')) NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')) NOT NULL,
  overall_score integer CHECK (overall_score >= 1 AND overall_score <= 5),
  feedback jsonb DEFAULT '{}', -- {general: "text", sections: [{section: "title", comment: "text", suggestion: "text"}]}
  checklist jsonb DEFAULT '{}', -- {grammar: true, factual: true, seo: false, etc.}
  changes_requested text[],
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news', 'proposal', 'comment')) NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  reason text CHECK (reason IN ('ai_flagged', 'user_reported', 'manual_review', 'policy_violation')) NOT NULL,
  ai_confidence numeric(3,2), -- AI confidence score 0.00-1.00
  ai_flags text[], -- Array of AI-detected issues
  user_reports integer DEFAULT 0,
  moderator_id uuid REFERENCES profiles(id),
  status text CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')) DEFAULT 'pending',
  moderation_result jsonb DEFAULT '{}', -- {action: "approve", reason: "text", automated: false}
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Publication schedule table
CREATE TABLE IF NOT EXISTS publication_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  scheduled_for timestamptz NOT NULL,
  timezone text DEFAULT 'UTC',
  status text CHECK (status IN ('scheduled', 'published', 'cancelled', 'failed')) DEFAULT 'scheduled',
  publisher_id uuid REFERENCES profiles(id),
  auto_publish boolean DEFAULT false,
  publish_channels text[] DEFAULT '{}', -- ['web', 'newsletter', 'social']
  metadata jsonb DEFAULT '{}',
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Editorial workflow states table
CREATE TABLE IF NOT EXISTS editorial_workflow_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news', 'proposal')) NOT NULL,
  previous_state text,
  current_state text NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  action text NOT NULL, -- 'submit', 'assign', 'review', 'approve', 'reject', 'publish'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE editorial_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_workflow_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for editorial_assignments
CREATE POLICY "Editors can view their assignments"
  ON editorial_assignments
  FOR SELECT
  TO authenticated
  USING (
    assignee_id = auth.uid() OR 
    assigner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Editors can create assignments"
  ON editorial_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Assignees can update their assignments"
  ON editorial_assignments
  FOR UPDATE
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- RLS Policies for content_reviews
CREATE POLICY "Reviewers can view relevant reviews"
  ON content_reviews
  FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Reviewers can create reviews"
  ON content_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'moderator'))
  );

CREATE POLICY "Reviewers can update their reviews"
  ON content_reviews
  FOR UPDATE
  TO authenticated
  USING (
    reviewer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for moderation_queue
CREATE POLICY "Moderators can view moderation queue"
  ON moderation_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'moderator'))
  );

CREATE POLICY "System can create moderation entries"
  ON moderation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Moderators can update moderation entries"
  ON moderation_queue
  FOR UPDATE
  TO authenticated
  USING (
    moderator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- RLS Policies for publication_schedule
CREATE POLICY "Editors can view publication schedule"
  ON publication_schedule
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Editors can manage publication schedule"
  ON publication_schedule
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- RLS Policies for editorial_workflow_states
CREATE POLICY "Editorial workflow states are viewable by editors"
  ON editorial_workflow_states
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'moderator'))
  );

CREATE POLICY "System can create workflow state entries"
  ON editorial_workflow_states
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX editorial_assignments_assignee_status_idx ON editorial_assignments(assignee_id, status, created_at DESC);
CREATE INDEX editorial_assignments_content_idx ON editorial_assignments(content_id, content_type);
CREATE INDEX editorial_assignments_due_date_idx ON editorial_assignments(due_date) WHERE status IN ('assigned', 'in_progress');

CREATE INDEX content_reviews_content_idx ON content_reviews(content_id, content_type);
CREATE INDEX content_reviews_reviewer_idx ON content_reviews(reviewer_id, created_at DESC);
CREATE INDEX content_reviews_status_idx ON content_reviews(status, review_type);

CREATE INDEX moderation_queue_status_priority_idx ON moderation_queue(status, priority, created_at);
CREATE INDEX moderation_queue_moderator_idx ON moderation_queue(moderator_id, status);
CREATE INDEX moderation_queue_content_idx ON moderation_queue(content_id, content_type);

CREATE INDEX publication_schedule_scheduled_for_idx ON publication_schedule(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX publication_schedule_content_idx ON publication_schedule(content_id, content_type);

CREATE INDEX editorial_workflow_states_content_idx ON editorial_workflow_states(content_id, content_type, created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER editorial_assignments_updated_at
  BEFORE UPDATE ON editorial_assignments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER content_reviews_updated_at
  BEFORE UPDATE ON content_reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER publication_schedule_updated_at
  BEFORE UPDATE ON publication_schedule
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to automatically create workflow state entries
CREATE OR REPLACE FUNCTION track_editorial_workflow()
RETURNS trigger AS $$
BEGIN
  -- Track article status changes
  IF TG_TABLE_NAME = 'articles' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO editorial_workflow_states (content_id, content_type, previous_state, current_state, actor_id, action)
    VALUES (NEW.id, 'article', OLD.status, NEW.status, auth.uid(), 
            CASE 
              WHEN NEW.status = 'published' THEN 'publish'
              WHEN NEW.status = 'review' THEN 'submit_for_review'
              WHEN NEW.status = 'draft' THEN 'save_draft'
              ELSE 'update_status'
            END);
  END IF;

  -- Track proposal status changes
  IF TG_TABLE_NAME = 'article_proposals' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO editorial_workflow_states (content_id, content_type, previous_state, current_state, actor_id, action)
    VALUES (NEW.id, 'proposal', OLD.status, NEW.status, auth.uid(),
            CASE 
              WHEN NEW.status = 'approved' THEN 'approve'
              WHEN NEW.status = 'rejected' THEN 'reject'
              WHEN NEW.status = 'changes_requested' THEN 'request_changes'
              ELSE 'update_status'
            END);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply workflow tracking triggers
CREATE TRIGGER articles_workflow_tracking
  AFTER UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION track_editorial_workflow();

CREATE TRIGGER proposals_workflow_tracking
  AFTER UPDATE ON article_proposals
  FOR EACH ROW EXECUTE FUNCTION track_editorial_workflow();

-- Function to auto-assign content for review
CREATE OR REPLACE FUNCTION auto_assign_for_review()
RETURNS trigger AS $$
DECLARE
  available_editor uuid;
BEGIN
  -- Auto-assign articles submitted for review
  IF TG_TABLE_NAME = 'articles' AND NEW.status = 'review' AND OLD.status != 'review' THEN
    -- Find an available editor (simple round-robin for now)
    SELECT id INTO available_editor
    FROM profiles 
    WHERE role IN ('editor', 'admin')
    AND id != NEW.author_id
    ORDER BY (
      SELECT COUNT(*) 
      FROM editorial_assignments 
      WHERE assignee_id = profiles.id 
      AND status IN ('assigned', 'in_progress')
    ) ASC
    LIMIT 1;

    IF available_editor IS NOT NULL THEN
      INSERT INTO editorial_assignments (
        content_id, content_type, assignee_id, assigner_id, assignment_type, due_date
      ) VALUES (
        NEW.id, 'article', available_editor, auth.uid(), 'review', 
        now() + interval '3 days'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-assignment trigger
CREATE TRIGGER articles_auto_assign
  AFTER UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION auto_assign_for_review();

-- Function to handle scheduled publishing
CREATE OR REPLACE FUNCTION process_scheduled_publications()
RETURNS void AS $$
DECLARE
  scheduled_item record;
BEGIN
  -- Process all items scheduled for publication
  FOR scheduled_item IN 
    SELECT * FROM publication_schedule 
    WHERE status = 'scheduled' 
    AND scheduled_for <= now()
  LOOP
    BEGIN
      -- Update article status to published
      IF scheduled_item.content_type = 'article' THEN
        UPDATE articles 
        SET status = 'published', published_at = now()
        WHERE id = scheduled_item.content_id;
      END IF;

      -- Update schedule status
      UPDATE publication_schedule
      SET status = 'published', published_at = now()
      WHERE id = scheduled_item.id;

    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed if there's an error
      UPDATE publication_schedule
      SET status = 'failed', metadata = metadata || jsonb_build_object('error', SQLERRM)
      WHERE id = scheduled_item.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate editorial workload
CREATE OR REPLACE FUNCTION get_editorial_workload(editor_id uuid)
RETURNS jsonb AS $$
DECLARE
  workload jsonb;
BEGIN
  SELECT jsonb_build_object(
    'assigned_count', COUNT(*) FILTER (WHERE status = 'assigned'),
    'in_progress_count', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'overdue_count', COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress') AND due_date < now()),
    'completed_this_week', COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= now() - interval '7 days'),
    'avg_completion_time', AVG(EXTRACT(epoch FROM (completed_at - created_at))/3600) FILTER (WHERE status = 'completed' AND completed_at >= now() - interval '30 days')
  ) INTO workload
  FROM editorial_assignments
  WHERE assignee_id = editor_id;

  RETURN workload;
END;
$$ LANGUAGE plpgsql;