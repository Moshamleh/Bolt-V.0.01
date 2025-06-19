/*
  # Add is_boosted column to parts table

  1. New Columns
    - `is_boosted` (boolean) - Flag to indicate if a part listing is boosted
*/

-- Add is_boosted column to parts table if it doesn't exist
ALTER TABLE parts ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;