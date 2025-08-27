-- Comprehensive Schema Setup for Stakeados Platform
-- Version: 1.0
-- Author: Gemini
-- Description: This script builds the entire database schema from scratch based on the design document.

BEGIN;

-- 1. Custom Types for Enums
-- This improves data integrity and readability compared to using plain text with CHECK constraints.

CREATE TYPE public.user_role AS ENUM ('student', 'citizen', 'genesis', 'admin');
CREATE TYPE public.article_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE public.language_code AS ENUM ('es', 'en');

-- 2. Table Creation

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    wallet_address TEXT,
    is_genesis BOOLEAN DEFAULT FALSE NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    role public.user_role DEFAULT 'student' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'User profiles, extending the authentication users.';

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.categories IS 'Hierarchical categories for organizing content.';

-- Articles Table
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status public.article_status DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMPTZ,
    slug TEXT UNIQUE NOT NULL,
    reading_time INTEGER DEFAULT 0 NOT NULL,
    views INTEGER DEFAULT 0 NOT NULL,
    likes INTEGER DEFAULT 0 NOT NULL,
    language public.language_code DEFAULT 'es' NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    featured_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.articles IS 'User-generated educational content.';

-- News Table
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    source_url TEXT,
    source_name TEXT,
    published_at TIMESTAMPTZ,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    language public.language_code DEFAULT 'es' NOT NULL,
    processed BOOLEAN DEFAULT FALSE NOT NULL,
    trending_score INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.news IS 'Aggregated news content from various sources.';

-- Role Audit Log Table
CREATE TABLE public.role_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_role public.user_role,
    new_role public.user_role NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.role_audit_log IS 'Tracks changes to user roles for security and auditing.';

-- 3. Trigger for updated_at timestamps
-- This function is called by triggers on tables to automatically update the updated_at column.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with an updated_at column
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Indexes for Performance
-- Indexes are crucial for fast query performance, especially for RLS policies.

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_articles_author_id ON public.articles(author_id);
CREATE INDEX idx_articles_category_id ON public.articles(category_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_news_category_id ON public.news(category_id);
CREATE INDEX idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_role_audit_user_id ON public.role_audit_log(user_id);

-- 5. Role Management Functions
-- These functions centralize the logic for role-based access control.

-- Function to get the integer value of a role for comparison
CREATE OR REPLACE FUNCTION public.get_role_value(role_name public.user_role)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE role_name
        WHEN 'student' THEN 1
        WHEN 'citizen' THEN 2
        WHEN 'genesis' THEN 3
        WHEN 'admin' THEN 4
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a user has a certain role or higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(p_user_id UUID, p_required_role public.user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value INTEGER;
    required_role_value INTEGER;
BEGIN
    SELECT public.get_role_value(profiles.role) INTO user_role_value FROM public.profiles WHERE id = p_user_id;
    required_role_value := public.get_role_value(p_required_role);
    RETURN COALESCE(user_role_value, 0) >= required_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a user's role and log the change
CREATE OR REPLACE FUNCTION public.update_user_role(p_target_user_id UUID, p_new_role public.user_role, p_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_changer_id UUID := auth.uid();
    v_old_role public.user_role;
BEGIN
    -- Only admins can change roles
    IF NOT public.has_role_or_higher(v_changer_id, 'admin') THEN
        RAISE EXCEPTION 'Only admins can change user roles.';
        RETURN FALSE;
    END IF;

    -- Get the old role for auditing
    SELECT role INTO v_old_role FROM public.profiles WHERE id = p_target_user_id;

    -- Update the role
    UPDATE public.profiles SET role = p_new_role WHERE id = p_target_user_id;

    -- Log the change
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, reason)
    VALUES (p_target_user_id, v_old_role, p_new_role, v_changer_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security (RLS) Policies
-- Enable RLS on all tables first
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.has_role_or_higher(auth.uid(), 'admin'));

-- Categories Policies
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role_or_higher(auth.uid(), 'admin'));

-- Articles Policies
CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage their own articles" ON public.articles FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all articles" ON public.articles FOR ALL USING (public.has_role_or_higher(auth.uid(), 'admin'));

-- News Policies
CREATE POLICY "Anyone can read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Admins can manage news" ON public.news FOR ALL USING (public.has_role_or_higher(auth.uid(), 'admin'));

-- Role Audit Log Policies
CREATE POLICY "Admins can read audit logs" ON public.role_audit_log FOR SELECT USING (public.has_role_or_higher(auth.uid(), 'admin'));

-- 7. Default Data
-- Insert default categories to get the platform started.
INSERT INTO public.categories (name, slug, description, color, sort_order)
VALUES
    ('DeFi', 'defi', 'Decentralized Finance', '#00FF88', 1),
    ('NFTs', 'nfts', 'Non-Fungible Tokens', '#4D94FF', 2),
    ('Base', 'base', 'The Base ecosystem', '#0052FF', 3),
    ('Trading', 'trading', 'Crypto trading and markets', '#FF6B6B', 4),
    ('Technology', 'technology', 'Blockchain technology deep dives', '#FFA500', 5),
    ('Regulation', 'regulation', 'Regulatory news and analysis', '#B0B0B0', 6);

-- 8. Grant permissions to roles
-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
-- Grant insert, update, delete on specific tables to authenticated users
GRANT INSERT, UPDATE, DELETE ON public.articles, public.profiles TO authenticated;
-- Grant all permissions to service_role for backend operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;

-- Verification
SELECT 'Database setup complete.' as status;
