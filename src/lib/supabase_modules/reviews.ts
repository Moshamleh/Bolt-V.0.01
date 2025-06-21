import { supabase } from '../supabase';
import { Profile, SellerReview, SellerRatingStats } from '../supabase'; // Import types from main supabase.ts

export async function createSellerReview(review: {
  seller_id: string;
  part_id?: string;
  rating: number;
  comment?: string | null;
}): Promise<SellerReview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('seller_reviews')
    .insert({
      seller_id: review.seller_id,
      buyer_id: user.id,
      part_id: review.part_id || null,
      rating: review.rating,
      comment: review.comment || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSellerReview(reviewId: string, updates: Partial<SellerReview>): Promise<SellerReview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('seller_reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('buyer_id', user.id) // Ensure only the reviewer can update their review
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSellerReview(reviewId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('seller_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('buyer_id', user.id); // Ensure only the reviewer can delete their review

  if (error) throw error;
}

export async function getSellerReviews(sellerId: string): Promise<SellerReview[]> {
  const { data, error } = await supabase
    .from('seller_reviews')
    .select(`
      *,
      buyer:profiles(id, full_name, username, avatar_url)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSellerRatingStats(sellerId: string): Promise<SellerRatingStats | null> {
  const { data, error } = await supabase
    .from('seller_rating_stats')
    .select('*')
    .eq('seller_id', sellerId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function hasUserReviewedSeller(sellerId: string, partId?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  let query = supabase
    .from('seller_reviews')
    .select('id')
    .eq('seller_id', sellerId)
    .eq('buyer_id', user.id);

  if (partId) {
    query = query.eq('part_id', partId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}