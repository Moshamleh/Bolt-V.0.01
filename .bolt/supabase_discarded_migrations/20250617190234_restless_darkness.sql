/*
  # Fix Club Creation Errors

  1. New Tables
    - `club_messages` table for storing club chat messages
      - `id` (uuid, primary key)
      - `club_id` (uuid, references clubs)
      - `sender_id` (uuid, references auth.users)
      - `sender_email` (text)
      - `sender_avatar_url` (text)
      - `content` (text)
      - `created_at` (timestamp)

  2. New Data
    - Insert "Club Founder" badge into badges table
    - Fix club_members foreign key relationship

  3. Security
    - Enable RLS on club_messages table
    - Add policies for club members to read/write messages
*/

-- Create club_messages table
CREATE TABLE IF NOT EXISTS club_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email text,
  sender_avatar_url text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for club members to read messages
CREATE POLICY "Club members can read messages"
  ON club_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_messages.club_id
      AND club_members.user_id = auth.uid()
    )
  );

-- Create policy for club members to send messages
CREATE POLICY "Club members can send messages"
  ON club_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_messages.club_id
      AND club_members.user_id = auth.uid()
    )
  );

-- Insert Club Founder badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
VALUES (
  'Club Founder', 
  'Awarded for founding a car enthusiast club', 
  'milestone',
  'https://cdn-icons-png.flaticon.com/512/3176/3176395.png'
)
ON CONFLICT (name) DO NOTHING;