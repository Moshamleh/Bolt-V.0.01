/*
  # Create diagnoses table for car diagnostic system

  1. New Tables
    - `diagnoses`
      - `id` (uuid, primary key)
      - `user_id` (text, references auth.users)
      - `vehicle_id` (text)
      - `prompt` (text)
      - `response` (text)
      - `timestamp` (timestamptz)
      - `resolved` (boolean)

  2. Security
    - Enable RLS on `diagnoses` table
    - Add policies for:
      - Users can read their own diagnoses
      - Users can create their own diagnoses
      - Users can update resolved status of their own diagnoses
*/

CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  vehicle_id text NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own diagnoses
CREATE POLICY "Users can read own diagnoses"
  ON diagnoses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to create their own diagnoses
CREATE POLICY "Users can create own diagnoses"
  ON diagnoses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update resolved status
CREATE POLICY "Users can update own diagnoses"
  ON diagnoses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);