/*
  # Create KYC documents storage bucket with policies

  1. Storage Setup
    - Create kyc-documents bucket if it doesn't exist
    - Configure bucket to be private for security
    - Set up proper access controls

  2. Security Policies
    - Check if policies exist before creating them
    - Allow authenticated users to upload their own KYC documents
    - Allow users to read their own documents
    - Allow admins to read all documents
    - Allow users to delete their own documents

  3. Notes
    - Uses DO blocks to check for existing policies before creating
    - Maintains same security model with proper error handling
    - Ensures bucket exists with correct configuration
*/

-- Create the kyc-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies only if they don't exist
DO $$ 
BEGIN
  -- Check and create upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload their own KYC documents'
  ) THEN
    CREATE POLICY "Users can upload their own KYC documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'kyc-documents' AND
      auth.uid()::text = (storage.foldername(name))[1] AND
      (storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png')
    );
  END IF;

  -- Check and create read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can read their own KYC documents'
  ) THEN
    CREATE POLICY "Users can read their own KYC documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'kyc-documents' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Check and create admin read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Admins can read all KYC documents'
  ) THEN
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
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can delete their own KYC documents'
  ) THEN
    CREATE POLICY "Users can delete their own KYC documents"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'kyc-documents' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;