/*
  # Create XP logs table

  1. New Tables
     - `xp_logs` - Tracks XP awards and level changes
       - `id` (uuid, primary key)
       - `user_id` (uuid, references auth.users)
       - `amount` (integer)
       - `reason` (text)
       - `previous_xp` (integer)
       - `new_xp` (integer)
       - `previous_level` (integer)
       - `new_level` (integer)
       - `created_at` (timestamp with time zone)
  
  2. Security
     - Enable RLS on `xp_logs` table
     - Add policy for users to read their own XP logs
     - Add policy for service role to insert XP logs
*/

-- Create XP logs table
CREATE TABLE IF NOT EXISTS xp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text,
  previous_xp integer NOT NULL,
  new_xp integer NOT NULL,
  previous_level integer NOT NULL,
  new_level integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own XP logs
CREATE POLICY "Users can read their own XP logs"
  ON xp_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for service role to insert XP logs
CREATE POLICY "Service role can insert XP logs"
  ON xp_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON xp_logs(created_at);