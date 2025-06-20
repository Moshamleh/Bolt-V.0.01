import { supabase } from '../supabase';
import { Part, Offer } from '../supabase';

/**
 * Subscribe to updates for a specific part
 * @param partId The ID of the part to subscribe to
 * @param onUpdate Callback function when the part is updated
 * @returns Unsubscribe function
 */
export function subscribeToPartUpdates(
  partId: string,
  onUpdate: (part: Part) => void
): () => void {
  const channel = supabase
    .channel(`part-updates-${partId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parts',
        filter: `id=eq.${partId}`,
      },
      (payload) => {
        onUpdate(payload.new as Part);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new offers for a specific part
 * @param partId The ID of the part to subscribe to offers for
 * @param onNewOffer Callback function when a new offer is created
 * @returns Unsubscribe function
 */
export function subscribeToPartOffers(
  partId: string,
  onNewOffer: (offer: Offer) => void
): () => void {
  const channel = supabase
    .channel(`part-offers-${partId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'offers',
        filter: `part_id=eq.${partId}`,
      },
      (payload) => {
        onNewOffer(payload.new as Offer);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to offer status updates
 * @param offerId The ID of the offer to subscribe to
 * @param onStatusChange Callback function when the offer status changes
 * @returns Unsubscribe function
 */
export function subscribeToOfferUpdates(
  offerId: string,
  onStatusChange: (offer: Offer) => void
): () => void {
  const channel = supabase
    .channel(`offer-updates-${offerId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'offers',
        filter: `id=eq.${offerId}`,
      },
      (payload) => {
        onStatusChange(payload.new as Offer);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all offers for a user (both sent and received)
 * @param userId The ID of the user
 * @param onOfferChange Callback function when any offer changes
 * @returns Unsubscribe function
 */
export function subscribeToUserOffers(
  userId: string,
  onOfferChange: (offer: Offer) => void
): () => void {
  const sentChannel = supabase
    .channel(`user-sent-offers-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'offers',
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => {
        onOfferChange(payload.new as Offer);
      }
    )
    .subscribe();

  const receivedChannel = supabase
    .channel(`user-received-offers-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'offers',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        onOfferChange(payload.new as Offer);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(sentChannel);
    supabase.removeChannel(receivedChannel);
  };
}

/**
 * Subscribe to all parts listed by a seller
 * @param sellerId The ID of the seller
 * @param onPartChange Callback function when any part changes
 * @returns Unsubscribe function
 */
export function subscribeToSellerParts(
  sellerId: string,
  onPartChange: (part: Part) => void
): () => void {
  const channel = supabase
    .channel(`seller-parts-${sellerId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'parts',
        filter: `seller_id=eq.${sellerId}`,
      },
      (payload) => {
        if (payload.eventType !== 'DELETE') {
          onPartChange(payload.new as Part);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}