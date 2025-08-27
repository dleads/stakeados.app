-- Notification and Subscription System Migration
-- This migration creates the database schema for user subscriptions and notifications

-- User subscriptions table (already partially defined in design.md)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type TEXT CHECK (subscription_type IN ('category', 'tag', 'author')) NOT NULL,
  subscription_target TEXT NOT NULL, -- category_id, tag_name, or author_id
  frequency TEXT CHECK (frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'immediate',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subscription_type, subscription_target)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('new_article', 'new_news', 'article_approved', 'proposal_reviewed', 'breaking_news')) NOT NULL,
  title JSONB NOT NULL, -- {en: "Title", es: "Título"}
  message JSONB NOT NULL, -- {en: "Message", es: "Mensaje"}
  data JSONB DEFAULT '{}', -- Additional data like article_id, news_id, etc.
  is_read BOOLEAN DEFAULT false,
  delivery_status JSONB DEFAULT '{"in_app": "pending", "email": "pending", "push": "pending"}',
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT CHECK (digest_frequency IN ('none', 'daily', 'weekly')) DEFAULT 'daily',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'UTC',
  categories JSONB DEFAULT '{}', -- Per-category notification settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification digest queue table
CREATE TABLE IF NOT EXISTS notification_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  digest_type TEXT CHECK (digest_type IN ('daily', 'weekly')) NOT NULL,
  content JSONB NOT NULL, -- Aggregated notifications
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User push subscriptions table
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, endpoint)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_type_target ON user_subscriptions(subscription_type, subscription_target);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_digests_user_scheduled ON notification_digests(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_digests_pending ON notification_digests(status, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_endpoint ON user_push_subscriptions(endpoint);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own digests
CREATE POLICY "Users can view own digests" ON notification_digests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON user_push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Functions for subscription management
CREATE OR REPLACE FUNCTION get_user_subscriptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  subscription_type TEXT,
  subscription_target TEXT,
  frequency TEXT,
  is_active BOOLEAN,
  target_name TEXT,
  target_metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.subscription_type,
    us.subscription_target,
    us.frequency,
    us.is_active,
    CASE 
      WHEN us.subscription_type = 'category' THEN 
        COALESCE((cc.name->>'en'), us.subscription_target)
      WHEN us.subscription_type = 'author' THEN 
        COALESCE(p.full_name, p.email, us.subscription_target)
      ELSE us.subscription_target
    END as target_name,
    CASE 
      WHEN us.subscription_type = 'category' THEN 
        jsonb_build_object('color', cc.color, 'icon', cc.icon)
      WHEN us.subscription_type = 'author' THEN 
        jsonb_build_object('avatar_url', p.avatar_url)
      ELSE '{}'::jsonb
    END as target_metadata
  FROM user_subscriptions us
  LEFT JOIN content_categories cc ON us.subscription_type = 'category' AND us.subscription_target = cc.id::text
  LEFT JOIN profiles p ON us.subscription_type = 'author' AND us.subscription_target = p.id::text
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC;
END;
$$;

-- Function to create or update subscription
CREATE OR REPLACE FUNCTION upsert_user_subscription(
  p_user_id UUID,
  p_subscription_type TEXT,
  p_subscription_target TEXT,
  p_frequency TEXT DEFAULT 'immediate',
  p_is_active BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_id UUID;
BEGIN
  INSERT INTO user_subscriptions (
    user_id, 
    subscription_type, 
    subscription_target, 
    frequency, 
    is_active,
    updated_at
  )
  VALUES (
    p_user_id, 
    p_subscription_type, 
    p_subscription_target, 
    p_frequency, 
    p_is_active,
    NOW()
  )
  ON CONFLICT (user_id, subscription_type, subscription_target)
  DO UPDATE SET
    frequency = EXCLUDED.frequency,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING id INTO subscription_id;
  
  RETURN subscription_id;
END;
$$;

-- Function to get notification preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  in_app_enabled BOOLEAN,
  email_enabled BOOLEAN,
  push_enabled BOOLEAN,
  digest_frequency TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT,
  categories JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(np.in_app_enabled, true) as in_app_enabled,
    COALESCE(np.email_enabled, true) as email_enabled,
    COALESCE(np.push_enabled, false) as push_enabled,
    COALESCE(np.digest_frequency, 'daily') as digest_frequency,
    COALESCE(np.quiet_hours_start, '22:00'::time) as quiet_hours_start,
    COALESCE(np.quiet_hours_end, '08:00'::time) as quiet_hours_end,
    COALESCE(np.timezone, 'UTC') as timezone,
    COALESCE(np.categories, '{}'::jsonb) as categories
  FROM profiles pr
  LEFT JOIN notification_preferences np ON pr.id = np.user_id
  WHERE pr.id = p_user_id;
END;
$$;

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    in_app_enabled,
    email_enabled,
    push_enabled,
    digest_frequency,
    quiet_hours_start,
    quiet_hours_end,
    timezone,
    categories,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE((p_preferences->>'in_app_enabled')::boolean, true),
    COALESCE((p_preferences->>'email_enabled')::boolean, true),
    COALESCE((p_preferences->>'push_enabled')::boolean, false),
    COALESCE(p_preferences->>'digest_frequency', 'daily'),
    COALESCE((p_preferences->>'quiet_hours_start')::time, '22:00'::time),
    COALESCE((p_preferences->>'quiet_hours_end')::time, '08:00'::time),
    COALESCE(p_preferences->>'timezone', 'UTC'),
    COALESCE(p_preferences->'categories', '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    in_app_enabled = EXCLUDED.in_app_enabled,
    email_enabled = EXCLUDED.email_enabled,
    push_enabled = EXCLUDED.push_enabled,
    digest_frequency = EXCLUDED.digest_frequency,
    quiet_hours_start = EXCLUDED.quiet_hours_start,
    quiet_hours_end = EXCLUDED.quiet_hours_end,
    timezone = EXCLUDED.timezone,
    categories = EXCLUDED.categories,
    updated_at = NOW();
    
  RETURN true;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();