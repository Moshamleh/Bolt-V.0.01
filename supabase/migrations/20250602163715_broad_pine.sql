/*
  # Create user feedback table

  1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `message` (text)
      - `sentiment` (text)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on `user_feedback` table
    - Add policies for:
      - Users can create their own feedback
      - Users can read their own feedback
*/

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  message text NOT NULL,
  sentiment text CHECK (sentiment IN ('happy', 'neutral', 'angry')),
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for users to create their own feedback
CREATE POLICY "Users can create own feedback"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to read their own feedback
CREATE POLICY "Users can read own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);