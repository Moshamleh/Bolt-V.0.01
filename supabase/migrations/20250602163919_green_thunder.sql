/*
  # Create AI feedback logs table

  1. New Tables
    - `ai_logs`
      - `id` (uuid, primary key)
      - `diagnosis_id` (uuid, references diagnoses)
      - `user_id` (uuid, references auth.users)
      - `was_helpful` (boolean)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on `ai_logs` table
    - Add policies for:
      - Users can create their own feedback
      - Users can read their own feedback
*/

CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id uuid REFERENCES diagnoses NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  was_helpful boolean NOT NULL,
  timestamp timestamptz DEFAULT now(),
  UNIQUE(diagnosis_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to create their own feedback
CREATE POLICY "Users can create own feedback"
  ON ai_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to read their own feedback
CREATE POLICY "Users can read own feedback"
  ON ai_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);