/*
  # Create club-covers storage bucket

  1. New Storage Bucket
    - `club-covers` bucket for storing club cover images
    - Public read access for all club cover images
    - Authenticated users can upload covers to their own folders

  2. Security Policies
    - Users can upload club covers to folders named after their user_id
    - Public read access to all club cover images
    - Users can update/delete their own club covers
    - Restrict uploads to common image file extensions (jpg, jpeg, png, gif, webp)

  3. Notes
    - Bucket is set to public for easy image access
    - File path structure: user_id/filename.ext
    - RLS policies ensure users can only manage their own uploads
*/

-- Create the club-covers bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-covers', 'club-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload club covers to their own folder
CREATE POLICY "Users can upload club covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'club-covers' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

-- Allow public read access to club covers
CREATE POLICY "Public can view club covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'club-covers');

-- Allow users to update their own club covers
CREATE POLICY "Users can update their own club covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'club-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'club-covers' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

-- Allow users to delete their own club covers
CREATE POLICY "Users can delete their own club covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'club-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);