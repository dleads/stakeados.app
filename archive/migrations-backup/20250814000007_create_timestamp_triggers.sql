-- Create timestamp update triggers
-- This migration creates a reusable trigger function and applies it to all tables with updated_at columns

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to handle conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
DROP TRIGGER IF EXISTS update_news_updated_at ON news;

-- Create triggers on all tables with updated_at columns
-- Profiles table trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Categories table trigger
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Articles table trigger
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- News table trigger
CREATE TRIGGER update_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verification queries
DO $$
BEGIN
    -- Check if trigger function exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        RAISE EXCEPTION 'Trigger function update_updated_at_column was not created';
    END IF;

    -- Check if all triggers exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        RAISE EXCEPTION 'Trigger update_profiles_updated_at was not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_categories_updated_at'
    ) THEN
        RAISE EXCEPTION 'Trigger update_categories_updated_at was not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_articles_updated_at'
    ) THEN
        RAISE EXCEPTION 'Trigger update_articles_updated_at was not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_news_updated_at'
    ) THEN
        RAISE EXCEPTION 'Trigger update_news_updated_at was not created';
    END IF;

    RAISE NOTICE 'All timestamp update triggers created successfully';
END $$;