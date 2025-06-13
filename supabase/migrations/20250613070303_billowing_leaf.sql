/*
  # Create service-invoices storage bucket

  1. New Storage Bucket
    - `service-invoices` bucket for storing service record invoices and receipts
    - Private bucket with authenticated access only
    - Users can only access their own invoices

  2. Security Policies
    - Users can upload invoices to folders named after their user_id
    - Users can only read their own invoices
    - Users can update/delete their own invoices
    - Restrict uploads to common document file extensions (pdf, jpg, jpeg, png)

  3. Notes
    - Bucket is set to private for security
    - File path structure: user_id/filename.ext
    - RLS policies ensure users can only manage their own uploads
*/

-- Create the service-invoices bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-invoices', 'service-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload invoices to their own folder
CREATE POLICY "Users can upload their own invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png')
);

-- Allow users to read their own invoices
CREATE POLICY "Users can read their own invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'service-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own invoices
CREATE POLICY "Users can update their own invoices"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'service-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png')
);

-- Allow users to delete their own invoices
CREATE POLICY "Users can delete their own invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);