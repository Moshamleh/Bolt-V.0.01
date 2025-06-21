/*
  # Add government_id_url column to kyc_requests table

  1. Changes
    - Add `government_id_url` column to kyc_requests table
    - This provides backward compatibility with existing code
    - Both gov_id_url and government_id_url can be used

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_requests' 
    AND column_name = 'government_id_url'
  ) THEN
    ALTER TABLE kyc_requests 
    ADD COLUMN government_id_url text;
  END IF;
END $$;