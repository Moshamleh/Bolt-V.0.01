/*
  # Achievement Tracker Schema

  1. New Tables
    - None needed, we'll use existing tables and add new badges
  
  2. Changes
    - Add achievement tracking columns to profiles table
    - Add new badges for achievements
  
  3. Security
    - No changes to security policies needed
*/

-- Add achievement tracking columns to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_diagnostic_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_diagnostic_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_club_joined'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_club_joined boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_part_listed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_part_listed boolean DEFAULT false;
  END IF;
END $$;

-- Insert achievement badges if they don't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Diagnosis', 'Awarded for completing your first AI diagnostic', 'common', 'https://cdn-icons-png.flaticon.com/512/2421/2421989.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Diagnosis');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Club Member', 'Awarded for joining your first car club', 'common', 'https://cdn-icons-png.flaticon.com/512/681/681494.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Club Member');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Listing', 'Awarded for listing your first part in the marketplace', 'common', 'https://cdn-icons-png.flaticon.com/512/3502/3502685.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Listing');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Referral Master', 'Awarded for inviting 5 friends to Bolt Auto', 'rare', 'https://cdn-icons-png.flaticon.com/512/1356/1356479.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Referral Master');