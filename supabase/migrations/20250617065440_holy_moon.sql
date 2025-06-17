/*
  # Fix Leaderboard Views

  1. Changes
     - Corrects the GROUP BY clause issue in the user_leaderboard_stats view
     - Properly aggregates helpful_feedback in the diag_stats subquery
     - Creates specialized leaderboard views for different categories
     - Adds performance indexes for better query execution

  2. Security
     - No security changes (views only)
*/

-- Create comprehensive user leaderboard stats view
CREATE OR REPLACE VIEW user_leaderboard_stats AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.location,
  p.created_at as joined_at,
  
  -- Diagnostic stats
  COALESCE(diag_stats.total_diagnoses, 0) as total_diagnoses,
  COALESCE(diag_stats.resolved_diagnoses, 0) as resolved_diagnoses,
  COALESCE(diag_stats.helpful_feedback, 0) as helpful_feedback,
  
  -- Marketplace stats
  COALESCE(market_stats.parts_listed, 0) as parts_listed,
  COALESCE(market_stats.parts_sold, 0) as parts_sold,
  COALESCE(market_stats.total_sales_value, 0) as total_sales_value,
  
  -- Community stats
  COALESCE(community_stats.clubs_founded, 0) as clubs_founded,
  COALESCE(community_stats.clubs_joined, 0) as clubs_joined,
  COALESCE(badge_stats.total_badges, 0) as total_badges,
  COALESCE(badge_stats.rare_badges, 0) as rare_badges,
  
  -- Service tracking stats
  COALESCE(service_stats.service_records, 0) as service_records,
  COALESCE(service_stats.total_maintenance_cost, 0) as total_maintenance_cost,
  
  -- Calculate overall score (weighted combination of activities)
  (
    COALESCE(diag_stats.total_diagnoses, 0) * 10 +
    COALESCE(diag_stats.resolved_diagnoses, 0) * 5 +
    COALESCE(diag_stats.helpful_feedback, 0) * 15 +
    COALESCE(market_stats.parts_listed, 0) * 8 +
    COALESCE(market_stats.parts_sold, 0) * 20 +
    COALESCE(community_stats.clubs_founded, 0) * 50 +
    COALESCE(community_stats.clubs_joined, 0) * 5 +
    COALESCE(badge_stats.total_badges, 0) * 12 +
    COALESCE(badge_stats.rare_badges, 0) * 25 +
    COALESCE(service_stats.service_records, 0) * 3
  ) as total_score

FROM profiles p

-- Diagnostic statistics
LEFT JOIN (
  SELECT 
    d.user_id,
    COUNT(d.id) as total_diagnoses,
    COUNT(d.id) FILTER (WHERE d.resolved = true) as resolved_diagnoses,
    COALESCE(SUM(feedback_stats.helpful_feedback), 0) as helpful_feedback
  FROM diagnoses d
  LEFT JOIN (
    SELECT 
      diagnosis_id,
      COUNT(*) FILTER (WHERE was_helpful = true) as helpful_feedback
    FROM ai_logs
    GROUP BY diagnosis_id
  ) feedback_stats ON d.id = feedback_stats.diagnosis_id
  GROUP BY d.user_id
) diag_stats ON p.id = diag_stats.user_id

-- Marketplace statistics
LEFT JOIN (
  SELECT 
    seller_id as user_id,
    COUNT(*) as parts_listed,
    COUNT(*) FILTER (WHERE sold = true) as parts_sold,
    COALESCE(SUM(price) FILTER (WHERE sold = true), 0) as total_sales_value
  FROM parts
  GROUP BY seller_id
) market_stats ON p.id = market_stats.user_id

-- Community statistics
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE role = 'admin') as clubs_founded,
    COUNT(*) as clubs_joined
  FROM club_members
  GROUP BY user_id
) community_stats ON p.id = community_stats.user_id

-- Badge statistics
LEFT JOIN (
  SELECT 
    ub.user_id,
    COUNT(*) as total_badges,
    COUNT(*) FILTER (WHERE b.rarity IN ('rare', 'exclusive')) as rare_badges
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  GROUP BY ub.user_id
) badge_stats ON p.id = badge_stats.user_id

-- Service record statistics
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as service_records,
    COALESCE(SUM(cost), 0) as total_maintenance_cost
  FROM service_records
  GROUP BY user_id
) service_stats ON p.id = service_stats.user_id

WHERE p.full_name IS NOT NULL; -- Only include users with names

-- Create specialized leaderboard views
CREATE OR REPLACE VIEW top_diagnosticians AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  location,
  total_diagnoses,
  resolved_diagnoses,
  helpful_feedback,
  ROW_NUMBER() OVER (ORDER BY total_diagnoses DESC, helpful_feedback DESC) as rank
FROM user_leaderboard_stats
WHERE total_diagnoses > 0
ORDER BY total_diagnoses DESC, helpful_feedback DESC
LIMIT 100;

CREATE OR REPLACE VIEW top_sellers AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  location,
  parts_listed,
  parts_sold,
  total_sales_value,
  ROW_NUMBER() OVER (ORDER BY parts_sold DESC, total_sales_value DESC) as rank
FROM user_leaderboard_stats
WHERE parts_listed > 0
ORDER BY parts_sold DESC, total_sales_value DESC
LIMIT 100;

CREATE OR REPLACE VIEW top_contributors AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  location,
  total_score,
  total_badges,
  clubs_founded,
  clubs_joined,
  ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
FROM user_leaderboard_stats
WHERE total_score > 0
ORDER BY total_score DESC
LIMIT 100;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_resolved ON diagnoses(user_id, resolved);
CREATE INDEX IF NOT EXISTS idx_parts_seller_sold ON parts(seller_id, sold);
CREATE INDEX IF NOT EXISTS idx_club_members_user_role ON club_members(user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_user_cost ON service_records(user_id, cost);
CREATE INDEX IF NOT EXISTS idx_ai_logs_diagnosis_helpful ON ai_logs(diagnosis_id, was_helpful);