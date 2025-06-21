/*
  # Add role column to club_members table

  1. Changes
    - Add role column to club_members table
    - Set default role to 'member'
    - Add check constraint to ensure valid roles

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE club_members
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
CHECK (role IN ('member', 'admin'));

-- Update existing members to have 'member' role
UPDATE club_members
SET role = 'member'
WHERE role IS NULL;