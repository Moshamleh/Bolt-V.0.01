/*
  # Create seller reviews table and rating stats view

  1. New Tables
    - `seller_reviews`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references auth.users)
      - `buyer_id` (uuid, references auth.users)
      - `part_id` (uuid, references parts)
      - `rating` (integer, 1-5)
      - `comment` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `seller_reviews` table
    - Add policies for:
      - Anyone can read seller reviews
      - Users can create reviews as buyers
      - Users can update their own reviews
      - Users can delete their own reviews
      - Admins can manage all reviews

  3. Views
    - `seller_rating_stats` - Aggregates seller ratings statistics
*/

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

-- Create policy for users to read all reviews
CREATE POLICY "Anyone can read seller reviews"
  ON seller_reviews
  FOR SELECT
  TO public
  USING (true);

-- Create policy for users to create their own reviews
CREATE POLICY "Users can create reviews as buyers"
  ON seller_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Create policy for users to update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON seller_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- Create policy for users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON seller_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Create policy for admins to manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON seller_reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin_user());

-- Create indexes for efficient querying
CREATE INDEX idx_seller_reviews_seller_id ON seller_reviews(seller_id);
CREATE INDEX idx_seller_reviews_buyer_id ON seller_reviews(buyer_id);
CREATE INDEX idx_seller_reviews_part_id ON seller_reviews(part_id);
CREATE INDEX idx_seller_reviews_rating ON seller_reviews(rating);

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