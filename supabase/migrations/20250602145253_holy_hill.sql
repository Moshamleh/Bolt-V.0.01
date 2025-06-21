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