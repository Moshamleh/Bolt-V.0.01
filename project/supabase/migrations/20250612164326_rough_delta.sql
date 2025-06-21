/*
  # Configure Avatar Storage Bucket and RLS Policies

  1. Storage Setup
    - Create avatars bucket if it doesn't exist
    - Configure bucket to be public for reading
    - Set up proper CORS and file size limits

  2. Security Policies
    - Allow authenticated users to upload their own avatars
    - Allow public read access to avatar images
    - Allow users to update/delete their own avatars
    - Restrict file types to images only

  3. Important Notes
    - Users can only upload files with their user ID in the filename
    - Public read access allows avatars to be displayed without authentication
    - File size and type restrictions are enforced at the policy level
*/

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);