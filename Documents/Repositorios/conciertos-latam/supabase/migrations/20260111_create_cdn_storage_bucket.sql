-- Create Storage bucket for CDN sequence files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fan-project-cdn',
  'fan-project-cdn',
  true, -- Public access for CDN functionality
  5242880, -- 5MB limit per file
  ARRAY['application/json']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for fan-project-cdn bucket

-- Allow admins to upload/update/delete CDN files
CREATE POLICY "Admins can manage CDN files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'fan-project-cdn' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow public read access to CDN files (for all users)
CREATE POLICY "Public read access to CDN files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'fan-project-cdn');
