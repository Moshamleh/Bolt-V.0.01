/*
  # Fix Club Messages Migration

  1. Changes
     - Add existence checks before creating policies
     - Ensure table and policies are only created if they don't exist
     - Keep the Club Founder badge insertion

  2. Security
     - Maintains the same RLS policies for club messages
*/

-- Create club_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS club_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email text,
  sender_avatar_url text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'club_messages' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policy for club members to read messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'club_messages' 
    AND policyname = 'Club members can read messages'
  ) THEN
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
  END IF;
END
$$;

-- Create policy for club members to send messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'club_messages' 
    AND policyname = 'Club members can send messages'
  ) THEN
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
  END IF;
END
$$;

-- Insert Club Founder badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Club Founder', 'Awarded for founding a car enthusiast club', 'milestone', 'https://cdn-icons-png.flaticon.com/512/3176/3176395.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Club Founder');