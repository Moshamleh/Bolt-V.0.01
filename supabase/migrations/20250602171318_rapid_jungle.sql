/*
  # Create AI Context Log Table

  1. New Tables
    - `ai_context_log`
      - `id` (uuid, primary key)
      - `diagnosis_id` (uuid, references diagnoses)
      - `context_json` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_context_log` table
    - Add policies for:
      - Users can read their own context logs
      - Users can create context logs for their own diagnoses

  3. Notes
    - Stores the vehicle context sent to AI for each diagnosis
    - Uses JSONB for flexible context storage
    - Links to diagnoses table for tracking
*/

CREATE TABLE IF NOT EXISTS ai_context_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id uuid REFERENCES diagnoses NOT NULL,
  context_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_context_log ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own context logs
CREATE POLICY "Users can read own context logs"
  ON ai_context_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagnoses d
      WHERE d.id = ai_context_log.diagnosis_id
      AND d.user_id = auth.uid()
    )
  );

-- Create policy for users to create context logs for their own diagnoses
CREATE POLICY "Users can create context logs for own diagnoses"
  ON ai_context_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnoses d
      WHERE d.id = ai_context_log.diagnosis_id
      AND d.user_id = auth.uid()
    )
  );