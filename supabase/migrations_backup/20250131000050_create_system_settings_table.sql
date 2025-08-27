-- Create system_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read system settings
CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert system settings
CREATE POLICY "Admins can insert system settings" ON system_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update system settings
CREATE POLICY "Admins can update system settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete system settings
CREATE POLICY "Admins can delete system settings" ON system_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert some default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('ai_processing_config', '{
    "openai": {
      "model": "gpt-4-turbo",
      "temperature": 0.7,
      "maxTokens": 2000,
      "timeout": 30
    },
    "processing": {
      "batchSize": 10,
      "retryAttempts": 3,
      "duplicateThreshold": 85,
      "autoProcessing": true,
      "processingSchedule": "0 * * * *"
    },
    "translation": {
      "enabled": true,
      "targetLanguages": ["es", "en"],
      "qualityThreshold": 80
    },
    "summarization": {
      "enabled": true,
      "maxLength": 300,
      "minLength": 100
    }
  }'::jsonb, 'AI Processing Configuration'),
  ('notification_settings', '{
    "email": {
      "enabled": true,
      "templates": {
        "welcome": "default",
        "article_published": "default",
        "role_change": "default"
      }
    },
    "push": {
      "enabled": false,
      "vapid_public_key": null
    }
  }'::jsonb, 'Notification Settings'),
  ('seo_settings', '{
    "default_title": "Stakeados - Plataforma de Aprendizaje Descentralizada",
    "default_description": "Descubre artículos, noticias y cursos sobre aprendizaje descentralizado",
    "default_keywords": "educación blockchain, aprendizaje descentralizado, cursos crypto",
    "og_image": "/images/og-default.jpg",
    "twitter_card": "summary_large_image"
  }'::jsonb, 'SEO Settings')
ON CONFLICT (key) DO NOTHING;
