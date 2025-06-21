import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SellerReview, SellerRatingStats, getSellerReviews, getSellerRatingStats, hasUserReviewedSeller, supabase } from '../lib/supabase';
import SellerRatingStars from './SellerRatingStars';
import SellerReviewItem from './SellerReviewItem';
import SellerReviewForm from './SellerReviewForm';

interface SellerReviewsPanelProps {
  sellerId: string;
  partId?: string;
}

const SellerReviewsPanel: React.FC<SellerReviewsPanelProps> = ({ sellerId, partId }) => {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [stats, setStats] = useState<SellerRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check if the current user is the seller
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsCurrentUser(user.id === sellerId);
          
          // Check if the user has already reviewed this seller
          if (user.id !== sellerId) {
            const hasReview = await hasUserReviewedSeller(sellerId, partId);
            setHasReviewed(hasReview);
          }
        }
        
        // Load reviews and stats in parallel
        const [reviewsData, statsData] = await Promise.all([
          getSellerReviews(sellerId),
          getSellerRatingStats(sellerId)
        ]);
        
        setReviews(reviewsData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load seller reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [sellerId, partId]);

  const handleReviewSubmitted = async () => {
    try {
      setLoading(true);
      
      // Reload reviews and stats
      const [reviewsData, statsData] = await Promise.all([
        getSellerReviews(sellerId),
        getSellerRatingStats(sellerId)
      ]);
      
      setReviews(reviewsData);
      setStats(statsData);
      setHasReviewed(true);
      setShowReviewForm(false);
    } catch (err) {
      console.error('Failed to reload reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reviews.length && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const renderRatingBar = (count: number, total: number, label: string) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600 dark:text-gray-400 w-16">{label}</div>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 dark:bg-yellow-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
          {count}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Seller Ratings & Reviews
        </h3>
        
        {stats ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center md:w-1/3">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {stats.average_rating}
              </div>
              <SellerRatingStars rating={stats.average_rating} size="lg" className="my-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Based on {stats.review_count} {stats.review_count === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {renderRatingBar(stats.five_star_count, stats.review_count, '5 stars')}
              {renderRatingBar(stats.four_star_count, stats.review_count, '4 stars')}
              {renderRatingBar(stats.three_star_count, stats.review_count, '3 stars')}
              {renderRatingBar(stats.two_star_count, stats.review_count, '2 stars')}
              {renderRatingBar(stats.one_star_count, stats.review_count, '1 star')}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Star className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              This seller has no reviews yet
            </p>
          </div>
        )}
        
        {/* Write Review Button */}
        {!isCurrentUser && !hasReviewed && !showReviewForm && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              Write a Review
            </button>
          </div>
        )}
        
        {/* Review Form */}
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Write a Review
              </h4>
              <SellerReviewForm
                sellerId={sellerId}
                partId={partId}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </h3>
          
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {reviews.map(review => (
                <SellerReviewItem
                  key={review.id}
                  review={review}
                  onReviewUpdated={handleReviewSubmitted}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No reviews yet. Be the first to review this seller!
          </p>
        </div>
      )}
    </div>
  );
};

export default SellerReviewsPanel;