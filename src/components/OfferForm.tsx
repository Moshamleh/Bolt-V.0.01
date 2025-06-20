import React, { useState } from 'react';
import { Loader2, DollarSign, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createOffer } from '../lib/supabase_modules/offers';
import { awardXp, XP_VALUES } from '../lib/xpSystem';
import { playPopSound } from '../lib/utils';
import { extractErrorMessage } from '../lib/errorHandling';

interface OfferFormProps {
  partId: string;
  receiverId: string;
  partTitle: string;
  partPrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const OfferForm: React.FC<OfferFormProps> = ({
  partId,
  receiverId,
  partTitle,
  partPrice,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [amount, setAmount] = useState<string>(partPrice.toString());
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate amount
    const offerAmount = parseFloat(amount);
    if (isNaN(offerAmount) || offerAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOffer({
        part_id: partId,
        receiver_id: receiverId,
        amount: offerAmount,
        message: message.trim() || undefined
      });

      // Play sound effect
      playPopSound();

      // Award XP for making an offer
      try {
        await awardXp(undefined, XP_VALUES.SEND_CLUB_MESSAGE, "Made an offer on a part");
      } catch (xpError) {
        console.error('Failed to award XP for making offer:', xpError);
        // Don't fail the offer submission if XP awarding fails
      }

      toast.success('Offer sent successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to send offer:', err);
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to send offer: ${errorMessage}`);
      toast.error(`Failed to send offer: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Make an Offer for "{partTitle}"
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Offer Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Listing price: ${partPrice.toFixed(2)}
          </p>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message (Optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a message to the seller..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Offer
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default OfferForm;