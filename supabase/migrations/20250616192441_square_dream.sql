/*
  # Leaderboard Helper Functions

  1. New Functions
    - `get_user_rank_by_score` - Gets a user's rank in the overall leaderboard
    - `get_user_diagnostician_rank` - Gets a user's rank in the diagnostician leaderboard
    - `get_user_seller_rank` - Gets a user's rank in the seller leaderboard
    - `get_user_contributor_rank` - Gets a user's rank in the contributor leaderboard

  2. Purpose
    - These functions efficiently calculate a user's position in various leaderboards
    - Used by the leaderboard edge function to return personalized rank information
*/

-- Function to get a user's rank in the overall leaderboard
CREATE OR REPLACE FUNCTION get_user_rank_by_score(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT 
    COUNT(*) + 1 INTO user_rank
  FROM 
    user_leaderboard_stats
  WHERE 
    total_score > (
      SELECT total_score 
      FROM user_leaderboard_stats 
      WHERE id = user_id
    );
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get a user's rank in the diagnostician leaderboard
CREATE OR REPLACE FUNCTION get_user_diagnostician_rank(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT 
    COUNT(*) + 1 INTO user_rank
  FROM 
    user_leaderboard_stats
  WHERE 
    total_diagnoses > (
      SELECT total_diagnoses 
      FROM user_leaderboard_stats 
      WHERE id = user_id
    )
    AND total_diagnoses > 0;
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get a user's rank in the seller leaderboard
CREATE OR REPLACE FUNCTION get_user_seller_rank(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
  user_parts_sold INTEGER;
BEGIN
  -- Get the user's parts sold count
  SELECT parts_sold INTO user_parts_sold
  FROM user_leaderboard_stats
  WHERE id = user_id;
  
  -- If user hasn't sold any parts, return null
  IF user_parts_sold = 0 OR user_parts_sold IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate rank
  SELECT 
    COUNT(*) + 1 INTO user_rank
  FROM 
    user_leaderboard_stats
  WHERE 
    parts_sold > user_parts_sold;
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get a user's rank in the contributor leaderboard
CREATE OR REPLACE FUNCTION get_user_contributor_rank(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
  user_score INTEGER;
BEGIN
  -- Get the user's total score
  SELECT total_score INTO user_score
  FROM user_leaderboard_stats
  WHERE id = user_id;
  
  -- If user has no score, return null
  IF user_score = 0 OR user_score IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate rank
  SELECT 
    COUNT(*) + 1 INTO user_rank
  FROM 
    user_leaderboard_stats
  WHERE 
    total_score > user_score;
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql;