/*
  # Add dark mode preference column

  1. Changes
    - Add `dark_mode_enabled` boolean column to profiles table with default value of false
    - Add comment to explain column purpose

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Sets default value to false for new profiles
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'dark_mode_enabled'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN dark_mode_enabled boolean DEFAULT false;

    COMMENT ON COLUMN profiles.dark_mode_enabled IS 'User preference for dark mode theme';
  END IF;
END $$;