/*
  # Create mechanic chats table

  1. New Tables
    - `mechanic_chats`
      - `id` (uuid, primary key)
      - `mechanic_id` (uuid, references mechanics)
      - `user_id` (uuid, references auth.users)
      - `message` (text)
      - `is_from_mechanic` (boolean)
      - `timestamp` (timestamptz)
      - `read` (boolean)

  2. Security
    - Enable RLS on `mechanic_chats` table
    - Add policies for:
      - Users can read their own chats
      - Users can send messages
      - Mechanics can read/write their own chats
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own chats" ON mechanic_chats;
DROP POLICY IF EXISTS "Users can send messages" ON mechanic_chats;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS mechanic_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id uuid REFERENCES mechanics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_from_mechanic boolean NOT NULL,
  timestamp timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE mechanic_chats ENABLE ROW LEVEL SECURITY;

-- Users can read their own chats
CREATE POLICY "Users can read their own chats"
  ON mechanic_chats
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM mechanics
      WHERE mechanics.id = mechanic_chats.mechanic_id
      AND mechanics.user_id = auth.uid()
    )
  );

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON mechanic_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND NOT is_from_mechanic) OR
    (EXISTS (
      SELECT 1 FROM mechanics
      WHERE mechanics.id = mechanic_chats.mechanic_id
      AND mechanics.user_id = auth.uid()
    ) AND is_from_mechanic)
  );