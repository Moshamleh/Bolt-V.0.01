import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Loader2, CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { boostPart, createBoostOrder } from '../lib/supabase';
import { awardXp, XP_VALUES } from '../lib/xpSystem';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface BoostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  partTitle: string;
  onBoostComplete: () => void;
}

const BoostListingModal: React.FC<BoostListingModalProps> = ({
  isOpen,
  onClose,
  partId,
  partTitle,
  onBoostComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBoost = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create a boost order in the database with status 'pending'
      const boostOrder = await createBoostOrder(partId);
      
      // In a real implementation, redirect to Stripe Checkout
      // For now, we'll simulate a successful payment
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the boost order status to 'paid' and set expiry date
      // This would normally be done by a webhook from Stripe
      const durationInDays = 7;
      
      // Process the boost (in a real app, this would be triggered by a webhook)
      await boostPart(partId, durationInDays, boostOrder.id);
      
      // Award XP for boosting a listing
      await awardXp(undefined, 50, "Boosted a marketplace listing");
      
      // Show success state
      setIsSuccess(true);
      
      // Notify parent component
      onBoostComplete();
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Failed to boost listing:', err);
      setError('Failed to process your boost. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create a boost order in the database with status 'pending'
      const boostOrder = await createBoostOrder(partId);
      
      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }
      
      // In a real implementation, you would:
      // 1. Call your backend to create a Stripe Checkout Session
      // 2. Redirect to the Stripe Checkout page
      // 3. Handle the redirect back to your site
      // 4. Process the webhook from Stripe to confirm payment
      
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process the boost (in a real app, this would be triggered by a webhook)
      await boostPart(partId, 7, boostOrder.id);
      
      // Award XP for boosting a listing
      await awardXp(undefined, 50, "Boosted a marketplace listing");
      
      // Show success state
      setIsSuccess(true);
      
      // Notify parent component
      onBoostComplete();
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Failed to boost listing:', err);
      setError('Failed to process your boost. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Boost Your Listing</h2>
          </div>
          
          <p className="text-white/90">
            Get more visibility and sell faster with a 7-day boost
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Boost Activated!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your listing "{partTitle}" will appear at the top of search results for the next 7 days.
              </p>
              <div className="text-sm text-green-600 dark:text-green-400">
                +50 XP added to your profile!
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Listing: {partTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your listing will appear at the top of search results for 7 days, increasing visibility by up to 5x.
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-300">Boost Benefits</h4>
                    <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-200">
                      <li>• Premium placement at the top of search results</li>
                      <li>• "Boosted" badge for increased attention</li>
                      <li>• 5x more views on average</li>
                      <li>• 3x faster selling time</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">$2.99</div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  7-day boost
                </div>
              </div>
              
              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleBoost}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-70"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Boost for $2.99
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                By clicking "Boost", you agree to our Terms of Service and Privacy Policy.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BoostListingModal;