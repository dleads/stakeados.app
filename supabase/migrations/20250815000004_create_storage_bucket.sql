-- Create storage bucket for content images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for content images
CREATE POLICY "Admin users can upload content images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Anyone can view content images" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-images');

CREATE POLICY "Admin users can update content images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'content-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin users can delete content images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );