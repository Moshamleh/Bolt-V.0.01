/*
  # Create seller reviews table and rating stats view

  1. New Tables
    - `seller_reviews`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references auth.users)
      - `buyer_id` (uuid, references auth.users)
      - `part_id` (uuid, references parts)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. New Views
    - `seller_rating_stats` - Aggregates seller ratings and review counts

  3. Security
    - Enable RLS on seller_reviews table
    - Add policies for public read access and user-specific write access
*/

-- Create the seller_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  part_id uuid REFERENCES parts(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  -- Prevent duplicate reviews for the same buyer-seller-part combination
  UNIQUE(seller_id, buyer_id, part_id)
);

-- Enable Row Level Security
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't already exist
DO $$ 
BEGIN
  -- Public read access policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seller_reviews' 
    AND policyname = 'Anyone can read seller reviews'
  ) THEN
    CREATE POLICY "Anyone can read seller reviews"
      ON seller_reviews
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Insert policy for buyers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seller_reviews' 
    AND policyname = 'Users can create reviews as buyers'
  ) THEN
    CREATE POLICY "Users can create reviews as buyers"
      ON seller_reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = buyer_id);
  END IF;

  -- Update policy for review owners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seller_reviews' 
    AND policyname = 'Users can update their own reviews'
  ) THEN
    CREATE POLICY "Users can update their own reviews"
      ON seller_reviews
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = buyer_id)
      WITH CHECK (auth.uid() = buyer_id);
  END IF;

  -- Delete policy for review owners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seller_reviews' 
    AND policyname = 'Users can delete their own reviews'
  ) THEN
    CREATE POLICY "Users can delete their own reviews"
      ON seller_reviews
      FOR DELETE
      TO authenticated
      USING (auth.uid() = buyer_id);
  END IF;

  -- Admin management policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seller_reviews' 
    AND policyname = 'Admins can manage all reviews'
  ) THEN
    CREATE POLICY "Admins can manage all reviews"
      ON seller_reviews
      FOR ALL
      TO authenticated
      USING (public.is_admin_user());
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_buyer_id ON seller_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_part_id ON seller_reviews(part_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating ON seller_reviews(rating);

-- Create or replace view for seller rating statistics
DROP VIEW IF EXISTS seller_rating_stats;
CREATE VIEW seller_rating_stats AS
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