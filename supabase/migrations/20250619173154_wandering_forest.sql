/*
  # Create challenges and user_challenges tables with ON CONFLICT handling

  1. New Tables
    - `challenges` - Defines gamified challenges available in the application
    - `user_challenges` - Tracks user progress on challenges

  2. Security
    - Enable RLS on both tables
    - Add policies for users to read challenges
    - Add policies for users to manage their own challenge progress
*/

-- Create the challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'diagnostic_count', 'part_listing_count', 'club_message_count'
  target_value INTEGER NOT NULL,
  frequency TEXT NOT NULL, -- e.g., 'daily', 'weekly', 'one_time'
  xp_reward INTEGER NOT NULL,
  badge_reward_id UUID REFERENCES public.badges(id), -- Optional foreign key to badges table
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS to challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to challenges
DROP POLICY IF EXISTS "Enable read access for all users" ON public.challenges;
CREATE POLICY "Enable read access for all users" ON public.challenges
  FOR SELECT
  TO public
  USING (true);

-- Create the user_challenges table
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, challenge_id) -- Ensure a user can only have one entry per challenge
);

-- Add RLS to user_challenges table
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own challenge progress
DROP POLICY IF EXISTS "Users can read their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can read their own challenge progress" ON public.user_challenges
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to update their own challenge progress (e.g., via functions)
DROP POLICY IF EXISTS "Users can update their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can update their own challenge progress" ON public.user_challenges
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to insert their own challenge progress (e.g., when starting a new challenge)
DROP POLICY IF EXISTS "Users can insert their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can insert their own challenge progress" ON public.user_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress() RETURNS TRIGGER AS $$
BEGIN
  -- Check if the challenge is completed
  IF NEW.current_progress >= (SELECT target_value FROM challenges WHERE id = NEW.challenge_id) AND NOT NEW.completed THEN
    -- Mark as completed
    NEW.completed := TRUE;
    NEW.completed_at := now();
    
    -- The award_xp function will be created in a separate migration
    -- For now, we'll just update the user's XP directly
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
DROP TRIGGER IF EXISTS check_challenge_completion ON public.user_challenges;
CREATE TRIGGER check_challenge_completion
BEFORE UPDATE OF current_progress ON public.user_challenges
FOR EACH ROW
EXECUTE FUNCTION update_challenge_progress();

-- Insert initial challenges with ON CONFLICT DO NOTHING to avoid duplicate key errors
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