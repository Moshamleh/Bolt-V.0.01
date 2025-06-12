/*
  # Create user_badges table

  1. New Tables
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `badge_id` (uuid, references badges)
      - `awarded_at` (timestamp with time zone)
      - `note` (text, nullable)

  2. Security
    - Enable RLS on `user_badges` table
    - Add policies for:
      - Users can read their own awarded badges
      - Users can insert their own awarded badges
      - Admins can read all awarded badges

  3. Constraints
    - Unique constraint on (user_id, badge_id) to prevent duplicate awards
    - Foreign key constraints with CASCADE delete
*/

CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamp with time zone DEFAULT now(),
  note text,
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own awarded badges
CREATE POLICY "Users can read own awarded badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own awarded badges
CREATE POLICY "Users can insert own awarded badges"
  ON user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to read all awarded badges
CREATE POLICY "Admins can read all awarded badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Policy for service role to manage badges (for automated badge awarding)
CREATE POLICY "Service role can manage user badges"
  ON user_badges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);