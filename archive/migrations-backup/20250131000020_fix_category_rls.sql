-- Fix RLS policies for content_categories table
-- This migration ensures that admins and editors can properly manage categories

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON content_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON content_categories;

-- Create comprehensive policies for content_categories
CREATE POLICY "Categories are viewable by everyone"
  ON content_categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins and editors can view all categories"
  ON content_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can insert categories"
  ON content_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can update categories"
  ON content_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can delete categories"
  ON content_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Also fix policies for junction tables
DROP POLICY IF EXISTS "Article categories are viewable by everyone" ON article_categories;
DROP POLICY IF EXISTS "Article tags are viewable by everyone" ON article_tags;
DROP POLICY IF EXISTS "News categories are viewable by everyone" ON news_categories;

CREATE POLICY "Article categories are viewable by everyone"
  ON article_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Article tags are viewable by everyone"
  ON article_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "News categories are viewable by everyone"
  ON news_categories
  FOR SELECT
  TO public
  USING (true);

-- Add admin policies for junction tables
CREATE POLICY "Admins and editors can manage article categories"
  ON article_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can manage article tags"
  ON article_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can manage news categories"
  ON news_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );
