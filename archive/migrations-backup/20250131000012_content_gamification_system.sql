/*
  # Content Gamification System

  1. New Tables
    - `content_contributions` - Track all content contributions for points
    - `contributor_achievements` - Track badges and achievements
    - `contributor_stats` - Aggregate statistics for contributors
    - `content_quality_metrics` - Track content quality for bonus points

  2. Extensions to existing tables
    - Add gamification fields to articles and news tables

  3. Functions
    - Point calculation functions
    - Achievement checking functions
    - Leaderboard functions

  4. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Content contributions tracking table
CREATE TABLE IF NOT EXISTS content_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news', 'proposal', 'review')) NOT NULL,
  contribution_type text CHECK (contribution_type IN ('author', 'reviewer', 'editor', 'translator')) NOT NULL,
  base_points integer NOT NULL DEFAULT 0,
  bonus_points integer DEFAULT 0,
  total_points integer GENERATED ALWAYS AS (base_points + bonus_points) STORED,
  quality_score numeric(3,2) DEFAULT 0, -- 0-5 scale
  engagement_metrics jsonb DEFAULT '{}', -- views, likes, shares, etc.
  awarded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Contributor achievements/badges table
CREATE TABLE IF NOT EXISTS contributor_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#00FF88',
  points_threshold integer,
  content_count_threshold integer,
  quality_threshold numeric(3,2),
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Contributor statistics table
CREATE TABLE IF NOT EXISTS contributor_stats (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_articles integer DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_translations integer DEFAULT 0,
  total_content_points integer DEFAULT 0,
  average_quality_score numeric(3,2) DEFAULT 0,
  total_views integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_contribution_at timestamptz,
  rank_position integer,
  updated_at timestamptz DEFAULT now()
);

-- Content quality metrics table
CREATE TABLE IF NOT EXISTS content_quality_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  quality_score numeric(3,2) DEFAULT 0, -- 0-5 scale
  readability_score numeric(3,2) DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0,
  social_shares integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  time_on_page integer DEFAULT 0, -- seconds
  bounce_rate numeric(5,2) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add gamification fields to existing tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_score numeric(3,2) DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS bonus_points_awarded integer DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_at timestamptz;

ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS quality_score numeric(3,2) DEFAULT 0;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS curator_points integer DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE content_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributor_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for content_contributions
CREATE POLICY "Users can view their own contributions"
  ON content_contributions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert contributions"
  ON content_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for contributor_achievements
CREATE POLICY "Users can view their own achievements"
  ON contributor_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view achievements for leaderboards"
  ON contributor_achievements
  FOR SELECT
  TO public
  USING (true);

-- Policies for contributor_stats
CREATE POLICY "Users can view their own stats"
  ON contributor_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view stats for leaderboards"
  ON contributor_stats
  FOR SELECT
  TO public
  USING (true);

-- Policies for content_quality_metrics
CREATE POLICY "Quality metrics are viewable by authenticated users"
  ON content_quality_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS content_contributions_user_id_idx ON content_contributions(user_id);
CREATE INDEX IF NOT EXISTS content_contributions_content_idx ON content_contributions(content_id, content_type);
CREATE INDEX IF NOT EXISTS content_contributions_type_idx ON content_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS content_contributions_points_idx ON content_contributions(total_points DESC);
CREATE INDEX IF NOT EXISTS content_contributions_awarded_at_idx ON content_contributions(awarded_at DESC);

CREATE INDEX IF NOT EXISTS contributor_achievements_user_id_idx ON contributor_achievements(user_id);
CREATE INDEX IF NOT EXISTS contributor_achievements_type_idx ON contributor_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS contributor_achievements_earned_at_idx ON contributor_achievements(earned_at DESC);

CREATE INDEX IF NOT EXISTS contributor_stats_total_points_idx ON contributor_stats(total_content_points DESC);
CREATE INDEX IF NOT EXISTS contributor_stats_rank_idx ON contributor_stats(rank_position);
CREATE INDEX IF NOT EXISTS contributor_stats_quality_idx ON contributor_stats(average_quality_score DESC);

CREATE INDEX IF NOT EXISTS content_quality_metrics_content_idx ON content_quality_metrics(content_id, content_type);
CREATE INDEX IF NOT EXISTS content_quality_metrics_quality_idx ON content_quality_metrics(quality_score DESC);

-- Triggers for updated_at
CREATE TRIGGER contributor_stats_updated_at
  BEFORE UPDATE ON contributor_stats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER content_quality_metrics_updated_at
  BEFORE UPDATE ON content_quality_metrics
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to award content contribution points
CREATE OR REPLACE FUNCTION award_content_contribution_points(
  p_user_id uuid,
  p_content_id uuid,
  p_content_type text,
  p_contribution_type text,
  p_base_points integer DEFAULT 0,
  p_quality_score numeric DEFAULT 0
)
RETURNS uuid AS $$
DECLARE
  contribution_id uuid;
  bonus_points integer := 0;
  total_points integer;
BEGIN
  -- Calculate bonus points based on quality score
  IF p_quality_score >= 4.5 THEN
    bonus_points := p_base_points * 0.5; -- 50% bonus for excellent quality
  ELSIF p_quality_score >= 4.0 THEN
    bonus_points := p_base_points * 0.3; -- 30% bonus for high quality
  ELSIF p_quality_score >= 3.5 THEN
    bonus_points := p_base_points * 0.1; -- 10% bonus for good quality
  END IF;

  total_points := p_base_points + bonus_points;

  -- Insert contribution record
  INSERT INTO content_contributions (
    user_id,
    content_id,
    content_type,
    contribution_type,
    base_points,
    bonus_points,
    quality_score
  ) VALUES (
    p_user_id,
    p_content_id,
    p_content_type,
    p_contribution_type,
    p_base_points,
    bonus_points,
    p_quality_score
  ) RETURNING id INTO contribution_id;

  -- Update user's total points
  UPDATE profiles
  SET total_points = total_points + total_points
  WHERE id = p_user_id;

  -- Update contributor stats
  INSERT INTO contributor_stats (user_id, last_contribution_at)
  VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_content_points = contributor_stats.total_content_points + total_points,
    last_contribution_at = now(),
    updated_at = now();

  RETURN contribution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate content quality score
CREATE OR REPLACE FUNCTION calculate_content_quality_score(
  p_content_id uuid,
  p_content_type text
)
RETURNS numeric AS $$
DECLARE
  quality_score numeric := 0;
  engagement_score numeric := 0;
  view_count integer := 0;
  like_count integer := 0;
  share_count integer := 0;
  comment_count integer := 0;
  reading_time integer := 0;
BEGIN
  -- Get engagement metrics based on content type
  IF p_content_type = 'article' THEN
    SELECT 
      COALESCE(a.view_count, 0),
      COALESCE(a.like_count, 0),
      COALESCE(a.reading_time, 0)
    INTO view_count, like_count, reading_time
    FROM articles a
    WHERE a.id = p_content_id;
  ELSIF p_content_type = 'news' THEN
    SELECT 
      COALESCE(n.engagement_score, 0)
    INTO engagement_score
    FROM news_articles n
    WHERE n.id = p_content_id;
  END IF;

  -- Get interaction counts
  SELECT 
    COUNT(*) FILTER (WHERE interaction_type = 'share'),
    COUNT(*) FILTER (WHERE interaction_type = 'like')
  INTO share_count, like_count
  FROM content_interactions
  WHERE content_id = p_content_id::text AND content_type = p_content_type;

  -- Calculate quality score (0-5 scale)
  -- Base score from engagement
  IF view_count > 0 THEN
    engagement_score := (like_count::numeric / view_count::numeric) * 100;
  END IF;

  -- Quality score calculation
  quality_score := LEAST(5.0, 
    1.0 + -- Base score
    (engagement_score / 20.0) + -- Engagement component (0-5)
    (LEAST(share_count, 50) / 10.0) + -- Share component (0-5)
    (CASE WHEN reading_time > 300 THEN 0.5 ELSE 0 END) -- Length bonus
  );

  -- Update or insert quality metrics
  INSERT INTO content_quality_metrics (
    content_id,
    content_type,
    quality_score,
    engagement_rate,
    social_shares
  ) VALUES (
    p_content_id,
    p_content_type,
    quality_score,
    engagement_score,
    share_count
  )
  ON CONFLICT (content_id, content_type) DO UPDATE SET
    quality_score = EXCLUDED.quality_score,
    engagement_rate = EXCLUDED.engagement_rate,
    social_shares = EXCLUDED.social_shares,
    updated_at = now();

  RETURN quality_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update contributor statistics
CREATE OR REPLACE FUNCTION update_contributor_stats()
RETURNS trigger AS $$
DECLARE
  stats_record contributor_stats%ROWTYPE;
BEGIN
  -- Get current stats
  SELECT * INTO stats_record
  FROM contributor_stats
  WHERE user_id = NEW.user_id;

  -- Update counters based on contribution type
  IF NEW.contribution_type = 'author' AND NEW.content_type = 'article' THEN
    UPDATE contributor_stats
    SET total_articles = total_articles + 1
    WHERE user_id = NEW.user_id;
  ELSIF NEW.contribution_type = 'reviewer' THEN
    UPDATE contributor_stats
    SET total_reviews = total_reviews + 1
    WHERE user_id = NEW.user_id;
  ELSIF NEW.contribution_type = 'translator' THEN
    UPDATE contributor_stats
    SET total_translations = total_translations + 1
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update average quality score
  UPDATE contributor_stats
  SET average_quality_score = (
    SELECT AVG(quality_score)
    FROM content_contributions
    WHERE user_id = NEW.user_id AND quality_score > 0
  )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contributor stats update
CREATE TRIGGER content_contributions_stats_update
  AFTER INSERT ON content_contributions
  FOR EACH ROW EXECUTE FUNCTION update_contributor_stats();

-- Function to award article publication points
CREATE OR REPLACE FUNCTION award_article_publication_points()
RETURNS trigger AS $$
DECLARE
  base_points integer := 15; -- Base points for article publication
  quality_score numeric;
  contribution_id uuid;
BEGIN
  -- Only award points when article is published for the first time
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    
    -- Calculate quality score
    quality_score := calculate_content_quality_score(NEW.id, 'article');
    
    -- Award points to the author
    SELECT award_content_contribution_points(
      NEW.author_id,
      NEW.id,
      'article',
      'author',
      base_points,
      quality_score
    ) INTO contribution_id;

    -- Update article with quality score
    UPDATE articles
    SET quality_score = quality_score
    WHERE id = NEW.id;

    -- Check for featured article bonus
    IF NEW.is_featured THEN
      SELECT award_content_contribution_points(
        NEW.author_id,
        NEW.id,
        'article',
        'author',
        10, -- Bonus points for featured article
        quality_score
      ) INTO contribution_id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for article publication points
CREATE TRIGGER article_publication_points
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION award_article_publication_points();

-- Function to award review points
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS trigger AS $$
DECLARE
  base_points integer := 5; -- Base points for reviewing
  contribution_id uuid;
BEGIN
  -- Award points when review is completed (status changes to approved/rejected)
  IF NEW.status IN ('approved', 'rejected') AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    
    -- Award points to the reviewer
    IF NEW.reviewer_id IS NOT NULL THEN
      SELECT award_content_contribution_points(
        NEW.reviewer_id,
        NEW.id,
        'proposal',
        'reviewer',
        base_points,
        0 -- No quality score for reviews yet
      ) INTO contribution_id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for proposal review points
CREATE TRIGGER proposal_review_points
  AFTER UPDATE ON article_proposals
  FOR EACH ROW EXECUTE FUNCTION award_review_points();

-- Insert additional gamification rules for content
-- Note: This is commented out because gamification_rules table is created in a later migration
-- INSERT INTO gamification_rules (activity_type, points, description) VALUES
-- ('ARTICLE_PUBLISHED', 15, 'Publish an article'),
-- ('ARTICLE_FEATURED', 25, 'Have an article featured on the homepage'),
-- ('ARTICLE_HIGH_ENGAGEMENT', 10, 'Article receives high engagement (bonus)'),
-- ('ARTICLE_EXCELLENT_QUALITY', 20, 'Article receives excellent quality rating (4.5+)'),
-- ('PROPOSAL_REVIEWED', 5, 'Review an article proposal'),
-- ('CONTENT_TRANSLATED', 8, 'Translate content to another language'),
-- ('EDITORIAL_CONTRIBUTION', 3, 'Make editorial contributions'),
-- ('POPULAR_CONTENT_BONUS', 5, 'Content reaches popularity milestones')
-- ON CONFLICT (activity_type) DO UPDATE SET
--   points = EXCLUDED.points,
--   description = EXCLUDED.description;

-- Add citizenship fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citizenship_eligible boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citizenship_eligible_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citizenship_nft_claimed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citizenship_nft_claimed_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citizenship_nft_token_id text;

-- Create indexes for citizenship fields
CREATE INDEX IF NOT EXISTS profiles_citizenship_eligible_idx ON profiles(citizenship_eligible, citizenship_eligible_at DESC);
CREATE INDEX IF NOT EXISTS profiles_citizenship_claimed_idx ON profiles(citizenship_nft_claimed);

-- Create initial contributor stats for existing users
INSERT INTO contributor_stats (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;