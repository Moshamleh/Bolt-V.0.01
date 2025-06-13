/*
  # Create kyc-documents storage bucket

  1. New Storage Bucket
    - `kyc-documents` bucket for storing KYC verification documents
    - Private bucket with authenticated access only
    - Users can only access their own documents
    - Admins can view all documents for verification purposes

  2. Security Policies
    - Users can upload documents to folders named after their user_id
    - Users can only read their own documents
    - Admins can read all documents for verification
    - Restrict uploads to common document file extensions (pdf, jpg, jpeg, png)

  3. Notes
    - Bucket is set to private for security of sensitive documents
    - File path structure: user_id/filename.ext
    - RLS policies ensure users can only manage their own uploads
    - Admin access is essential for the verification process
*/

-- Create the kyc-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload documents to their own folder
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png')
);

-- Allow users to read their own documents
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to read all documents
CREATE POLICY "Admins can read all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);