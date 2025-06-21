/*
  # Add approved column to parts table

  1. Changes
    - Add `approved` boolean column to parts table with default value true
    - This allows admins to approve or disapprove parts in the marketplace
    - Default is true to maintain backward compatibility with existing parts

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' 
    AND column_name = 'approved'
  ) THEN
    ALTER TABLE parts ADD COLUMN approved boolean DEFAULT true;
  END IF;
END $$;

-- Add index for efficient filtering by approval status
CREATE INDEX IF NOT EXISTS idx_parts_approved ON parts(approved);