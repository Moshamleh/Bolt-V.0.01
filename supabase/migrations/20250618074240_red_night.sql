/*
  # Add First Vehicle badge

  This migration adds a new badge for users who add their first vehicle to the system.
*/

-- Insert First Vehicle badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Vehicle', 'Awarded for adding your first vehicle to Bolt Auto', 'common', 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Vehicle');

-- Insert Profile Complete badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Profile Complete', 'Awarded for completing your user profile', 'common', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Profile Complete');

-- Insert First Diagnosis badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Diagnosis', 'Awarded for completing your first AI diagnostic', 'common', 'https://cdn-icons-png.flaticon.com/512/2421/2421989.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Diagnosis');

-- Add nickname and mileage columns to vehicles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN nickname text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'mileage'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN mileage integer;
  END IF;
END $$;