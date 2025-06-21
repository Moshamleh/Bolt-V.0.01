/*
  # Fix club_messages policy conflict

  1. Changes
    - Drop existing "Club members can read messages" policy if it exists
    - Recreate the policy with the same name and conditions
    - Ensures clean migration without policy conflicts

  2. Security
    - Maintains the same security model
    - Club members can still read messages from their clubs
*/

-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Club members can read messages" ON club_messages;

-- Recreate the policy
CREATE POLICY "Club members can read messages"
  ON club_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM club_members
      WHERE club_members.club_id = club_messages.club_id
      AND club_members.user_id = auth.uid()
    )
  );