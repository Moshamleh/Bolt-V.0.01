-- Add is_trusted column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_trusted') THEN
    ALTER TABLE users ADD COLUMN is_trusted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create function to check and update trusted seller status
CREATE OR REPLACE FUNCTION check_trusted_seller_status()
RETURNS TRIGGER AS $$
DECLARE
  kyc_verified BOOLEAN;
  approved_parts_count INTEGER;
BEGIN
  -- Get KYC verification status
  SELECT profiles.kyc_verified INTO kyc_verified
  FROM profiles
  WHERE profiles.id = NEW.seller_id;
  
  -- Count approved parts by this seller
  SELECT COUNT(*) INTO approved_parts_count
  FROM parts
  WHERE parts.seller_id = NEW.seller_id
  AND parts.approved = true;
  
  -- If KYC is verified and seller has at least 3 approved parts, mark as trusted
  IF kyc_verified = true AND approved_parts_count >= 3 THEN
    UPDATE users
    SET is_trusted = true
    WHERE id = NEW.seller_id;
    
    -- Create notification for the user
    INSERT INTO notifications (
      user_id,
      type,
      message,
      read
    ) VALUES (
      NEW.seller_id,
      'trusted_seller',
      'Congratulations! You are now a Verified Seller. Your listings will display a verification badge.',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check trusted seller status when a part is approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_trusted_seller_trigger'
  ) THEN
    CREATE TRIGGER check_trusted_seller_trigger
    AFTER UPDATE OF approved ON parts
    FOR EACH ROW
    WHEN (NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false))
    EXECUTE FUNCTION check_trusted_seller_status();
  END IF;
END $$;