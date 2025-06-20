import { supabase } from '../supabase';

export interface Offer {
  id: string;
  part_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';
  message?: string;
  created_at: string;
  updated_at: string;
  parent_offer_id?: string;
}

/**
 * Create a new offer for a part
 */
export async function createOffer(offerData: {
  part_id: string;
  receiver_id: string;
  amount: number;
  message?: string;
  parent_offer_id?: string;
}): Promise<Offer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('offers')
    .insert({
      ...offerData,
      sender_id: user.id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all offers for a specific part
 */
export async function getPartOffers(partId: string): Promise<Offer[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('part_id', partId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all offers sent by the current user
 */
export async function getSentOffers(): Promise<Offer[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all offers received by the current user
 */
export async function getReceivedOffers(): Promise<Offer[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update an offer's status
 */
export async function updateOfferStatus(
  offerId: string, 
  status: 'accepted' | 'rejected' | 'withdrawn'
): Promise<Offer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', offerId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a counter offer
 */
export async function createCounterOffer(
  originalOfferId: string,
  amount: number,
  message?: string
): Promise<Offer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, get the original offer
  const { data: originalOffer, error: fetchError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', originalOfferId)
    .single();

  if (fetchError) throw fetchError;

  // Ensure the user is part of this offer
  if (originalOffer.sender_id !== user.id && originalOffer.receiver_id !== user.id) {
    throw new Error('Unauthorized to counter this offer');
  }

  // Create the counter offer
  const { data, error } = await supabase
    .from('offers')
    .insert({
      part_id: originalOffer.part_id,
      sender_id: user.id,
      receiver_id: user.id === originalOffer.sender_id ? originalOffer.receiver_id : originalOffer.sender_id,
      amount,
      message,
      status: 'pending',
      parent_offer_id: originalOfferId
    })
    .select()
    .single();

  if (error) throw error;

  // Update the original offer status to 'countered'
  await supabase
    .from('offers')
    .update({ status: 'countered' })
    .eq('id', originalOfferId);

  return data;
}

/**
 * Subscribe to offer updates
 */
export function subscribeToOfferUpdates(
  callback: (offer: Offer) => void
): () => void {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const channel = supabase
    .channel('offers-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'offers',
      filter: `sender_id=eq.${user.id}`,
    }, (payload) => {
      callback(payload.new as Offer);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'offers',
      filter: `receiver_id=eq.${user.id}`,
    }, (payload) => {
      callback(payload.new as Offer);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}