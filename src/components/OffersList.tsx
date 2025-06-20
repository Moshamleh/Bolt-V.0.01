import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, DollarSign } from 'lucide-react';
import { Offer, getPartOffers, subscribeToOfferUpdates } from '../lib/supabase_modules/offers';
import OfferItem from './OfferItem';
import CounterOfferModal from './CounterOfferModal';

interface OffersListProps {
  partId: string;
  className?: string;
}

const OffersList: React.FC<OffersListProps> = ({ partId, className = '' }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        const data = await getPartOffers(partId);
        setOffers(data);
      } catch (err) {
        console.error('Failed to load offers:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };

    loadOffers();

    // Set up real-time subscription
    const unsubscribe = subscribeToOfferUpdates((updatedOffer) => {
      if (updatedOffer.part_id === partId) {
        setOffers(prev => {
          const offerIndex = prev.findIndex(o => o.id === updatedOffer.id);
          if (offerIndex >= 0) {
            // Update existing offer
            const newOffers = [...prev];
            newOffers[offerIndex] = updatedOffer;
            return newOffers;
          } else {
            // Add new offer
            return [updatedOffer, ...prev];
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [partId]);

  const handleStatusChange = async () => {
    try {
      const data = await getPartOffers(partId);
      setOffers(data);
    } catch (err) {
      console.error('Failed to refresh offers:', err);
    }
  };

  const handleCounterOffer = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      setShowCounterOfferModal(true);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 ${className}`}>
        {error}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No offers yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          When offers are made, they will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Offers ({offers.length})
      </h3>
      
      <AnimatePresence initial={false}>
        {offers.map((offer) => (
          <OfferItem
            key={offer.id}
            offer={offer}
            onStatusChange={handleStatusChange}
            onCounterOffer={handleCounterOffer}
          />
        ))}
      </AnimatePresence>

      {selectedOffer && (
        <CounterOfferModal
          isOpen={showCounterOfferModal}
          onClose={() => setShowCounterOfferModal(false)}
          originalOfferId={selectedOffer.id}
          originalAmount={selectedOffer.amount}
          onSuccess={handleStatusChange}
        />
      )}
    </div>
  );
};

export default OffersList;