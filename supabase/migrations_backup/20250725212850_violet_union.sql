/*
  # Create user progress table

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses)
      - `content_id` (text, for lesson/quiz identification)
      - `completed_at` (timestamp, optional)
      - `score` (integer, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_progress` table
    - Add policy for users to view their own progress
    - Add policy for users to create their own progress entries
    - Add policy for users to update their own progress
*/

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  completed_at timestamptz,
  score integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id, content_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_course_id_idx ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS user_progress_completed_at_idx ON user_progress(completed_at);

-- Function to update user points when progress is made
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS trigger AS $$
DECLARE
  course_difficulty text;
  points_to_add integer := 0;
BEGIN
  -- Only award points when completing content for the first time
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD IS NULL) THEN
    -- Get course difficulty
    SELECT difficulty INTO course_difficulty
    FROM courses
    WHERE id = NEW.course_id;
    
    -- Award points based on difficulty
    CASE course_difficulty
      WHEN 'basic' THEN points_to_add := 5;
      WHEN 'intermediate' THEN points_to_add := 10;
      WHEN 'advanced' THEN points_to_add := 15;
      ELSE points_to_add := 5;
    END CASE;
    
    -- Update user's total points
    UPDATE profiles
    SET total_points = total_points + points_to_add
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for points update
DROP TRIGGER IF EXISTS user_progress_points_trigger ON user_progress;
CREATE TRIGGER user_progress_points_trigger
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_user_points();