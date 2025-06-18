import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createSellerReview, updateSellerReview } from '../lib/supabase';
import SellerRatingStars from './SellerRatingStars';
import Textarea from './Textarea';
import { awardXp, XP_VALUES } from '../lib/xpSystem';

interface SellerReviewFormProps {
  sellerId: string;
  partId?: string;
  onReviewSubmitted: () => void;
  existingReviewId?: string;
  initialRating?: number;
  initialComment?: string;
  isEdit?: boolean;
}

const SellerReviewForm: React.FC<SellerReviewFormProps> = ({
  sellerId,
  partId,
  onReviewSubmitted,
  existingReviewId,
  initialRating = 0,
  initialComment = '',
  isEdit = false
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [comment, setComment] = useState<string>(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && existingReviewId) {
        await updateSellerReview(existingReviewId, {
          rating,
          comment: comment.trim() || null
        });
        toast.success('Review updated successfully');
      } else {
        await createSellerReview({
          seller_id: sellerId,
          part_id: partId,
          rating,
          comment: comment.trim() || null
        });
        toast.success('Review submitted successfully');
        
        // Award XP for submitting a review (only for new reviews, not edits)
        try {
          await awardXp(undefined, XP_VALUES.REVIEW_SELLER, "Submitted a seller review");
          toast.success(`🎉 +${XP_VALUES.REVIEW_SELLER} XP added to your profile!`);
        } catch (xpError) {
          console.error('Failed to award XP for review:', xpError);
          // Don't fail the review submission if XP awarding fails
        }
      }
      
      onReviewSubmitted();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rating
        </label>
        <div className="flex items-center gap-2">
          <SellerRatingStars 
            rating={0} 
            selectedRating={rating}
            size="lg" 
            interactive={true}
            onRatingChange={setRating}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select a rating'}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Comment (optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with this seller..."
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isEdit ? 'Updating...' : 'Submitting...'}</span>
            </div>
          ) : (
            <span>{isEdit ? 'Update Review' : 'Submit Review'}</span>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default SellerReviewForm;