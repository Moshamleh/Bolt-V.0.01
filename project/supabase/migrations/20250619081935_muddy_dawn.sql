/*
  # Create user achievements table

  1. New Tables
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `achievement_id` (text, achievement identifier)
      - `xp_awarded` (integer)
      - `badge_awarded` (uuid, references badges)
      - `awarded_at` (timestamp)
  2. Security
    - Enable RLS on `user_achievements` table
    - Add policy for users to read their own achievements
    - Add policy for service role to insert achievements
*/

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  xp_awarded integer NOT NULL,
  badge_awarded uuid REFERENCES badges(id),
  awarded_at timestamptz DEFAULT now(),
  
  -- Ensure a user can only have each achievement once
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own achievements
CREATE POLICY "Users can read their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for service role to insert achievements
CREATE POLICY "Service role can insert achievements"
  ON user_achievements
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Create badges for achievements if they don't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Profile Complete', 'Completed your user profile', 'common', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Profile Complete');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Diagnosis', 'Completed your first AI diagnostic', 'common', 'https://cdn-icons-png.flaticon.com/512/2421/2421213.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Diagnosis');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Club Member', 'Joined your first car club', 'common', 'https://cdn-icons-png.flaticon.com/512/681/681494.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Club Member');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Listing', 'Listed your first part in the marketplace', 'common', 'https://cdn-icons-png.flaticon.com/512/679/679821.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Listing');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'First Vehicle', 'Added your first vehicle to Bolt Auto', 'common', 'https://cdn-icons-png.flaticon.com/512/741/741407.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'First Vehicle');