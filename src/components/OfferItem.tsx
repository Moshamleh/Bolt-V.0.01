import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, CornerDownLeft, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Offer, updateOfferStatus } from '../lib/supabase_modules/offers';
import { supabase } from '../lib/supabase';
import { extractErrorMessage } from '../lib/errorHandling';

interface OfferItemProps {
  offer: Offer;
  onStatusChange: () => void;
  onCounterOffer?: (offerId: string) => void;
  showActions?: boolean;
}

const OfferItem: React.FC<OfferItemProps> = ({
  offer,
  onStatusChange,
  onCounterOffer,
  showActions = true
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check if the current user is the sender or receiver
  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    
    checkUser();
  }, []);

  const isReceiver = currentUserId === offer.receiver_id;
  const isSender = currentUserId === offer.sender_id;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = () => {
    switch (offer.status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
            Rejected
          </span>
        );
      case 'countered':
        return (
          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
            Countered
          </span>
        );
      case 'withdrawn':
        return (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
            Withdrawn
          </span>
        );
      default:
        return null;
    }
  };

  const handleAcceptOffer = async () => {
    if (!isReceiver || offer.status !== 'pending') return;
    
    setIsUpdating(true);
    try {
      await updateOfferStatus(offer.id, 'accepted');
      toast.success('Offer accepted!');
      onStatusChange();
    } catch (err) {
      console.error('Failed to accept offer:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to accept offer: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!isReceiver || offer.status !== 'pending') return;
    
    setIsUpdating(true);
    try {
      await updateOfferStatus(offer.id, 'rejected');
      toast.success('Offer rejected');
      onStatusChange();
    } catch (err) {
      console.error('Failed to reject offer:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to reject offer: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdrawOffer = async () => {
    if (!isSender || offer.status !== 'pending') return;
    
    setIsUpdating(true);
    try {
      await updateOfferStatus(offer.id, 'withdrawn');
      toast.success('Offer withdrawn');
      onStatusChange();
    } catch (err) {
      console.error('Failed to withdraw offer:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to withdraw offer: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCounterOffer = () => {
    if (onCounterOffer) {
      onCounterOffer(offer.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {isSender ? 'Your Offer' : 'Offer from Buyer'}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {formatPrice(offer.amount)}
        </div>
      </div>

      {offer.message && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {offer.message}
          </p>
        </div>
      )}

      {showActions && offer.status === 'pending' && (
        <div className="flex flex-wrap gap-2 mt-4">
          {isReceiver && (
            <>
              <button
                onClick={handleAcceptOffer}
                disabled={isUpdating}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Accept
              </button>
              <button
                onClick={handleRejectOffer}
                disabled={isUpdating}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </button>
              <button
                onClick={handleCounterOffer}
                disabled={isUpdating}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CornerDownLeft className="h-4 w-4" />
                Counter
              </button>
            </>
          )}
          {isSender && (
            <button
              onClick={handleWithdrawOffer}
              disabled={isUpdating}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Withdraw
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default OfferItem;