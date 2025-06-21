/*
  # Add boost_expires_at column to parts table

  1. Changes
     - Add `boost_expires_at` timestamp column to the `parts` table
     - This column will store when a boosted listing's promotion expires
     - Create a trigger to automatically update the `is_boosted` flag based on expiration time

  2. Security
     - No changes to RLS policies
*/

-- Add boost_expires_at column to parts table
ALTER TABLE parts ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE;

-- Create a function to check and update is_boosted status based on expiration
CREATE OR REPLACE FUNCTION check_boost_expiry() RETURNS TRIGGER AS $$
BEGIN
  -- If boost has expired, set is_boosted to false
  IF NEW.boost_expires_at IS NOT NULL AND NEW.boost_expires_at <= NOW() THEN
    NEW.is_boosted = false;
    NEW.boost_expires_at = NULL;
  END IF;
  
  -- If boost_expires_at is set and in the future, ensure is_boosted is true
  IF NEW.boost_expires_at IS NOT NULL AND NEW.boost_expires_at > NOW() THEN
    NEW.is_boosted = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the function before insert or update
DROP TRIGGER IF EXISTS check_boost_expiry_trigger ON parts;
CREATE TRIGGER check_boost_expiry_trigger
BEFORE INSERT OR UPDATE ON parts
FOR EACH ROW
EXECUTE FUNCTION check_boost_expiry();

-- Create a scheduled function to periodically check for expired boosts
CREATE OR REPLACE FUNCTION update_expired_boosts() RETURNS void AS $$
BEGIN
  UPDATE parts
  SET is_boosted = false, boost_expires_at = NULL
  WHERE boost_expires_at IS NOT NULL AND boost_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;