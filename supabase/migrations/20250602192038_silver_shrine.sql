/*
  # Add initial setup tracking column

  1. Changes
    - Add `initial_setup_complete` boolean column to profiles table
    - Set default value to false for new profiles
    - Add comment explaining column purpose

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'initial_setup_complete'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN initial_setup_complete boolean DEFAULT false;

    COMMENT ON COLUMN profiles.initial_setup_complete IS 'Tracks whether user has completed initial setup flow';
  END IF;
END $$;