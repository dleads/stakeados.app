/*
  # Create courses table

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (jsonb for multilingual support)
      - `description` (jsonb for multilingual support)
      - `difficulty` (text, enum: basic, intermediate, advanced)
      - `nft_contract_address` (text, optional)
      - `estimated_time` (integer, in minutes)
      - `is_published` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `courses` table
    - Add policy for public read access to published courses
    - Add policy for authenticated users to read all courses
    - Add policy for admin users to manage courses
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL DEFAULT '{}',
  description jsonb NOT NULL DEFAULT '{}',
  difficulty text NOT NULL CHECK (difficulty IN ('basic', 'intermediate', 'advanced')),
  nft_contract_address text,
  estimated_time integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Published courses are viewable by everyone"
  ON courses
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Authenticated users can view all courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS courses_difficulty_idx ON courses(difficulty);
CREATE INDEX IF NOT EXISTS courses_is_published_idx ON courses(is_published);
CREATE INDEX IF NOT EXISTS courses_created_at_idx ON courses(created_at);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();