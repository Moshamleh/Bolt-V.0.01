/*
  # Add boost expiration functionality
  
  1. New Columns
    - `boost_expires_at` timestamp with time zone - Stores when a boosted listing's promotion expires
  
  2. Functions
    - `check_boost_expiry()` - Trigger function to manage boost status based on expiration date
  
  3. Triggers
    - `check_boost_expiry_trigger` - Runs before insert/update on parts table
*/

-- Add boost_expires_at column to parts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'boost_expires_at'
  ) THEN
    ALTER TABLE parts ADD COLUMN boost_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create or replace the trigger function to check boost expiry
CREATE OR REPLACE FUNCTION check_boost_expiry() RETURNS TRIGGER AS $$
BEGIN
  -- If boost_expires_at is set and in the future, ensure is_boosted is true
  IF NEW.boost_expires_at IS NOT NULL AND NEW.boost_expires_at > NOW() THEN
    NEW.is_boosted := TRUE;
  END IF;
  
  -- If boost_expires_at is in the past or NULL, ensure is_boosted is false
  IF NEW.boost_expires_at IS NULL OR NEW.boost_expires_at <= NOW() THEN
    NEW.is_boosted := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_boost_expiry_trigger'
  ) THEN
    CREATE TRIGGER check_boost_expiry_trigger
    BEFORE INSERT OR UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION check_boost_expiry();
  END IF;
END $$;

-- Create a function to remove expired boosts (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION remove_expired_boosts() RETURNS TRIGGER AS $$
BEGIN
  -- Update parts where boost has expired
  UPDATE parts
  SET is_boosted = FALSE
  WHERE boost_expires_at IS NOT NULL 
    AND boost_expires_at <= NOW() 
    AND is_boosted = TRUE;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on boost_orders to remove expired boosts when expiry date changes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_boost_expiry'
  ) THEN
    CREATE TRIGGER check_boost_expiry
    AFTER UPDATE OF expires_at ON boost_orders
    FOR EACH ROW
    EXECUTE FUNCTION remove_expired_boosts();
  END IF;
END $$;