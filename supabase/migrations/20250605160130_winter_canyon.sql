/*
  # Add diagnostic suggestions preference

  1. Changes
    - Add `diagnostic_suggestions_enabled` column to profiles table with default value true
    
  2. Notes
    - This preference controls whether users receive diagnostic suggestions
    - Defaults to true to maintain existing behavior for current users
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'diagnostic_suggestions_enabled'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN diagnostic_suggestions_enabled boolean DEFAULT true;
  END IF;
END $$;