/*
  # Add wants_pro flag to profiles

  1. Changes
     - Add wants_pro boolean column to profiles table with default value of false
     - This column will track users who have expressed interest in upgrading to Verified Seller Pro
*/

-- Add wants_pro column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_pro boolean DEFAULT false;