/*
  # Add gig_id to mechanic_chats table

  1. Changes
    - Add `gig_id` column to mechanic_chats table
    - Column is nullable to support existing chats without gigs
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  -- Add gig_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanic_chats' AND column_name = 'gig_id'
  ) THEN
    ALTER TABLE mechanic_chats ADD COLUMN gig_id uuid;
  END IF;
END $$;

-- Add index for better query performance on gig_id
CREATE INDEX IF NOT EXISTS idx_mechanic_chats_gig_id ON mechanic_chats(gig_id);