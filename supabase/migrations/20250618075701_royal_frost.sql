/*
  # Add Referral System

  1. New Fields
    - Add `invited_by` column to `profiles` table
    - Add `listing_boost_until` column to `profiles` table
    - Add "Street Starter Badge" to `badges` table
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add invited_by column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invited_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add listing_boost_until column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'listing_boost_until'
  ) THEN
    ALTER TABLE profiles ADD COLUMN listing_boost_until timestamp with time zone;
  END IF;
END $$;

-- Insert Street Starter Badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Street Starter Badge', 'Awarded for referring a new user to Bolt Auto', 'rare', 'https://cdn-icons-png.flaticon.com/512/3176/3176396.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Street Starter Badge');

-- Create or replace function to handle new user referrals
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS trigger AS $$
DECLARE
  invited_by_id uuid;
  badge_id uuid;
BEGIN
  -- Extract invited_by from user metadata if it exists
  invited_by_id := (NEW.raw_user_meta_data->>'invited_by')::uuid;
  
  -- If invited_by exists, update the user's profile
  IF invited_by_id IS NOT NULL THEN
    -- Update the new user's profile with the referrer's ID
    INSERT INTO public.profiles (id, invited_by)
    VALUES (NEW.id, invited_by_id)
    ON CONFLICT (id) DO UPDATE
    SET invited_by = EXCLUDED.invited_by;
    
    -- Get the Street Starter Badge ID
    SELECT id INTO badge_id FROM public.badges WHERE name = 'Street Starter Badge' LIMIT 1;
    
    -- Award the badge to the referrer if not already awarded
    IF badge_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id, note)
      VALUES (invited_by_id, badge_id, 'Awarded for referring a new user to Bolt Auto')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Set the listing boost for the referrer (24 hours from now)
    UPDATE public.profiles
    SET listing_boost_until = NOW() + INTERVAL '24 hours'
    WHERE id = invited_by_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_referral();
  END IF;
END $$;