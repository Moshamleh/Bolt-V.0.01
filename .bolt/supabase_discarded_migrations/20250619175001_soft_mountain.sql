-- =============================================
-- PART 1: ENSURE TABLES EXIST
-- =============================================

-- Create club_messages table
CREATE TABLE IF NOT EXISTS club_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email text,
  sender_avatar_url text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create reported_parts table
CREATE TABLE IF NOT EXISTS reported_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Create seller_reviews table
CREATE TABLE IF NOT EXISTS seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  part_id uuid REFERENCES parts(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, buyer_id, part_id)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  target_value integer NOT NULL,
  frequency text NOT NULL,
  xp_reward integer NOT NULL,
  badge_reward_id uuid REFERENCES badges(id),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  current_progress integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create boost_orders table
CREATE TABLE IF NOT EXISTS boost_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- PART 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add columns to parts table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='is_boosted') THEN
    ALTER TABLE parts ADD COLUMN is_boosted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='boost_expires_at') THEN
    ALTER TABLE parts ADD COLUMN boost_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='approved') THEN
    ALTER TABLE parts ADD COLUMN approved boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='part_number') THEN
    ALTER TABLE parts ADD COLUMN part_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parts' AND column_name='oem_number') THEN
    ALTER TABLE parts ADD COLUMN oem_number text;
  END IF;
END $$;

-- Add columns to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_diagnostic_completed') THEN
    ALTER TABLE profiles ADD COLUMN first_diagnostic_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_club_joined') THEN
    ALTER TABLE profiles ADD COLUMN first_club_joined boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_part_listed') THEN
    ALTER TABLE profiles ADD COLUMN first_part_listed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='wants_pro') THEN
    ALTER TABLE profiles ADD COLUMN wants_pro boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='invited_by') THEN
    ALTER TABLE profiles ADD COLUMN invited_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='listing_boost_until') THEN
    ALTER TABLE profiles ADD COLUMN listing_boost_until timestamptz;
  END IF;
END $$;

-- Add columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp') THEN
    ALTER TABLE users ADD COLUMN xp integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='level') THEN
    ALTER TABLE users ADD COLUMN level integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_trusted') THEN
    ALTER TABLE users ADD COLUMN is_trusted boolean DEFAULT false;
  END IF;
END $$;

-- =============================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_orders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PART 4: CREATE OR REPLACE POLICIES
-- =============================================

-- Club messages policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Club members can read messages' 
    AND tablename = 'club_messages'
  ) THEN
    CREATE POLICY "Club members can read messages"
      ON club_messages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = club_messages.club_id
          AND club_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Club members can send messages' 
    AND tablename = 'club_messages'
  ) THEN
    CREATE POLICY "Club members can send messages"
      ON club_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = club_messages.club_id
          AND club_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Reported parts policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Admins can read reports' 
    AND tablename = 'reported_parts'
  ) THEN
    CREATE POLICY "Admins can read reports"
      ON reported_parts
      FOR SELECT
      TO public
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can report parts' 
    AND tablename = 'reported_parts'
  ) THEN
    CREATE POLICY "Users can report parts"
      ON reported_parts
      FOR INSERT
      TO public
      WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

-- Seller reviews policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Anyone can read seller reviews' 
    AND tablename = 'seller_reviews'
  ) THEN
    CREATE POLICY "Anyone can read seller reviews"
      ON seller_reviews
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can create reviews as buyers' 
    AND tablename = 'seller_reviews'
  ) THEN
    CREATE POLICY "Users can create reviews as buyers"
      ON seller_reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update their own reviews' 
    AND tablename = 'seller_reviews'
  ) THEN
    CREATE POLICY "Users can update their own reviews"
      ON seller_reviews
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = buyer_id)
      WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can delete their own reviews' 
    AND tablename = 'seller_reviews'
  ) THEN
    CREATE POLICY "Users can delete their own reviews"
      ON seller_reviews
      FOR DELETE
      TO authenticated
      USING (auth.uid() = buyer_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Admins can manage all reviews' 
    AND tablename = 'seller_reviews'
  ) THEN
    CREATE POLICY "Admins can manage all reviews"
      ON seller_reviews
      FOR ALL
      TO authenticated
      USING (public.is_admin_user());
  END IF;
END $$;

-- Challenges policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Enable read access for all users' 
    AND tablename = 'challenges'
  ) THEN
    CREATE POLICY "Enable read access for all users"
      ON challenges
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- User challenges policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can read their own challenge progress' 
    AND tablename = 'user_challenges'
  ) THEN
    CREATE POLICY "Users can read their own challenge progress"
      ON user_challenges
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update their own challenge progress' 
    AND tablename = 'user_challenges'
  ) THEN
    CREATE POLICY "Users can update their own challenge progress"
      ON user_challenges
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert their own challenge progress' 
    AND tablename = 'user_challenges'
  ) THEN
    CREATE POLICY "Users can insert their own challenge progress"
      ON user_challenges
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Boost orders policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can read own boost orders' 
    AND tablename = 'boost_orders'
  ) THEN
    CREATE POLICY "Users can read own boost orders"
      ON boost_orders
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can create boost orders' 
    AND tablename = 'boost_orders'
  ) THEN
    CREATE POLICY "Users can create boost orders"
      ON boost_orders
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update own boost orders' 
    AND tablename = 'boost_orders'
  ) THEN
    CREATE POLICY "Users can update own boost orders"
      ON boost_orders
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Service role can update boost orders' 
    AND tablename = 'boost_orders'
  ) THEN
    CREATE POLICY "Service role can update boost orders"
      ON boost_orders
      FOR UPDATE
      TO service_role
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Service role can insert boost orders' 
    AND tablename = 'boost_orders'
  ) THEN
    CREATE POLICY "Service role can insert boost orders"
      ON boost_orders
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Service role can read boost orders' 
    AND tablename = 'boost_orders'
  ) THEN
    CREATE POLICY "Service role can read boost orders"
      ON boost_orders
      FOR SELECT
      TO service_role
      USING (true);
  END IF;
END $$;

-- =============================================
-- PART 5: CREATE OR REPLACE FUNCTIONS AND TRIGGERS
-- =============================================

-- Create function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress() RETURNS TRIGGER AS $$
BEGIN
  -- Check if the challenge is completed
  IF NEW.current_progress >= (SELECT target_value FROM challenges WHERE id = NEW.challenge_id) AND NOT NEW.completed THEN
    -- Mark as completed
    NEW.completed := TRUE;
    NEW.completed_at := now();
    
    -- Update user's XP directly
    UPDATE users
    SET xp = xp + (SELECT xp_reward FROM challenges WHERE id = NEW.challenge_id)
    WHERE id = NEW.user_id;
    
    -- Award badge if applicable
    IF EXISTS (SELECT 1 FROM challenges WHERE id = NEW.challenge_id AND badge_reward_id IS NOT NULL) THEN
      -- Check if user already has this badge
      IF NOT EXISTS (
        SELECT 1 FROM user_badges 
        WHERE user_id = NEW.user_id AND badge_id = (SELECT badge_reward_id FROM challenges WHERE id = NEW.challenge_id)
      ) THEN
        -- Award the badge
        INSERT INTO user_badges (user_id, badge_id, note)
        VALUES (
          NEW.user_id, 
          (SELECT badge_reward_id FROM challenges WHERE id = NEW.challenge_id), 
          'Awarded for completing challenge: ' || (SELECT name FROM challenges WHERE id = NEW.challenge_id)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for challenge completion
DROP TRIGGER IF EXISTS check_challenge_completion ON user_challenges;
CREATE TRIGGER check_challenge_completion
BEFORE UPDATE OF current_progress ON user_challenges
FOR EACH ROW
EXECUTE FUNCTION update_challenge_progress();

-- Create function to check boost expiry
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
DROP TRIGGER IF EXISTS check_boost_expiry_trigger ON parts;
CREATE TRIGGER check_boost_expiry_trigger
BEFORE INSERT OR UPDATE ON parts
FOR EACH ROW
EXECUTE FUNCTION check_boost_expiry();

-- Create function to remove expired boosts
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
DROP TRIGGER IF EXISTS check_boost_expiry ON boost_orders;
CREATE TRIGGER check_boost_expiry
AFTER UPDATE OF expires_at ON boost_orders
FOR EACH ROW
EXECUTE FUNCTION remove_expired_boosts();

-- Create function to check and update trusted seller status
CREATE OR REPLACE FUNCTION check_trusted_seller_status() RETURNS TRIGGER AS $$
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
DROP TRIGGER IF EXISTS check_trusted_seller_trigger ON parts;
CREATE TRIGGER check_trusted_seller_trigger
AFTER UPDATE OF approved ON parts
FOR EACH ROW
WHEN (NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false))
EXECUTE FUNCTION check_trusted_seller_status();

-- =============================================
-- PART 6: ADD UNIQUE CONSTRAINTS
-- =============================================

-- Add unique constraint to badges name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'badges_name_key' 
    AND conrelid = 'badges'::regclass
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_name_key UNIQUE (name);
  END IF;
END $$;

-- =============================================
-- PART 7: INSERT INITIAL DATA
-- =============================================

-- Insert badges with ON CONFLICT DO NOTHING to prevent duplicates
INSERT INTO badges (name, description, rarity, icon_url)
VALUES 
  ('Club Founder', 'Awarded for founding a car enthusiast club', 'milestone', 'https://cdn-icons-png.flaticon.com/512/3176/3176395.png'),
  ('First Vehicle', 'Awarded for adding your first vehicle to Bolt Auto', 'common', 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png'),
  ('Profile Complete', 'Awarded for completing your user profile', 'common', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'),
  ('First Diagnosis', 'Awarded for completing your first AI diagnostic', 'common', 'https://cdn-icons-png.flaticon.com/512/2421/2421989.png'),
  ('Club Member', 'Awarded for joining your first car club', 'common', 'https://cdn-icons-png.flaticon.com/512/681/681494.png'),
  ('First Listing', 'Awarded for listing your first part in the marketplace', 'common', 'https://cdn-icons-png.flaticon.com/512/3502/3502685.png'),
  ('Street Starter Badge', 'Awarded for referring a new user to Bolt Auto', 'rare', 'https://cdn-icons-png.flaticon.com/512/3176/3176396.png'),
  ('Road Wrench', 'Reached level 2 in Bolt Auto', 'common', 'https://cdn-icons-png.flaticon.com/512/1995/1995470.png'),
  ('Engine Expert', 'Reached level 5 in Bolt Auto', 'milestone', 'https://cdn-icons-png.flaticon.com/512/2061/2061956.png'),
  ('Master Mechanic', 'Reached level 10 in Bolt Auto', 'rare', 'https://cdn-icons-png.flaticon.com/512/1995/1995450.png'),
  ('Weekly Warrior', 'Awarded for consistent activity over a week', 'milestone', 'https://cdn-icons-png.flaticon.com/512/3176/3176397.png'),
  ('Diagnostic Detective', 'Awarded for running multiple diagnostics in a week', 'milestone', 'https://cdn-icons-png.flaticon.com/512/2421/2421990.png'),
  ('Parts Pro', 'Awarded for listing multiple parts in a week', 'milestone', 'https://cdn-icons-png.flaticon.com/512/3502/3502686.png'),
  ('Club Champion', 'Awarded for active participation in clubs', 'milestone', 'https://cdn-icons-png.flaticon.com/512/681/681494.png'),
  ('Referral Master', 'Awarded for inviting 5 friends to Bolt Auto', 'rare', 'https://cdn-icons-png.flaticon.com/512/1356/1356479.png')
ON CONFLICT (name) DO NOTHING;

-- Insert initial challenges with ON CONFLICT DO NOTHING to prevent duplicates
INSERT INTO challenges (name, description, type, target_value, frequency, xp_reward)
VALUES 
  ('First Diagnosis', 'Complete your first diagnostic session', 'diagnostic_count', 1, 'one_time', 50),
  ('Diagnostic Expert', 'Complete 10 diagnostic sessions', 'diagnostic_count', 10, 'one_time', 200),
  ('Marketplace Seller', 'List 5 parts for sale', 'part_listing_count', 5, 'one_time', 150),
  ('Community Builder', 'Send 20 messages in clubs', 'club_message_count', 20, 'one_time', 100),
  ('Daily Diagnostics', 'Complete 3 diagnostics today', 'daily_diagnostic_count', 3, 'daily', 75),
  ('Weekly Mechanic', 'Complete 10 diagnostics this week', 'weekly_diagnostic_count', 10, 'weekly', 150),
  ('Service Tracker', 'Add 3 service records', 'service_record_count', 3, 'one_time', 100),
  ('Vehicle Collector', 'Add 3 vehicles to your garage', 'vehicle_count', 3, 'one_time', 125),
  ('Social Butterfly', 'Join 3 different clubs', 'club_join_count', 3, 'one_time', 100),
  ('Feedback Provider', 'Provide feedback on 5 AI diagnostics', 'feedback_count', 5, 'one_time', 75)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- PART 8: CREATE SELLER RATING STATS VIEW
-- =============================================

-- Create view for seller rating statistics
CREATE OR REPLACE VIEW seller_rating_stats AS
SELECT 
  seller_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating), 1) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
  COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
  COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
  COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
  COUNT(*) FILTER (WHERE rating = 1) as one_star_count
FROM seller_reviews
GROUP BY seller_id;

-- =============================================
-- PART 9: CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Create indexes for seller_reviews
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_buyer_id ON seller_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_part_id ON seller_reviews(part_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating ON seller_reviews(rating);

-- Create indexes for parts
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_oem_number ON parts(oem_number);
CREATE INDEX IF NOT EXISTS idx_parts_approved ON parts(approved);
CREATE INDEX IF NOT EXISTS idx_parts_seller_sold ON parts(seller_id, sold);

-- Create indexes for user_challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);

-- =============================================
-- PART 10: FIX FOREIGN KEY RELATIONSHIP BETWEEN PARTS AND PROFILES
-- =============================================

-- Add foreign key constraint from parts to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parts_seller_id_fkey' 
    AND table_name = 'parts'
  ) THEN
    ALTER TABLE parts 
    ADD CONSTRAINT parts_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create profiles for any users who don't have them yet
INSERT INTO profiles (id)
SELECT 
  au.id
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Fix user_logins RLS policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can access only their own login data' 
    AND tablename = 'user_logins'
  ) THEN
    DROP POLICY "Users can access only their own login data" ON user_logins;
  END IF;
END $$;

-- Create new policies for user_logins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert their own login data' 
    AND tablename = 'user_logins'
  ) THEN
    CREATE POLICY "Users can insert their own login data"
      ON user_logins
      FOR INSERT
      TO public
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can read their own login data' 
    AND tablename = 'user_logins'
  ) THEN
    CREATE POLICY "Users can read their own login data"
      ON user_logins
      FOR SELECT
      TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;