import React, { useState } from 'react';
import { User, Edit, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { SellerReview, deleteSellerReview, supabase } from '../lib/supabase';
import SellerRatingStars from './SellerRatingStars';
import SellerReviewForm from './SellerReviewForm';

interface SellerReviewItemProps {
  review: SellerReview;
  onReviewUpdated: () => void;
}

const SellerReviewItem: React.FC<SellerReviewItemProps> = ({ review, onReviewUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check if the current user is the reviewer
  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    
    checkUser();
  }, []);

  const isReviewer = currentUserId === review.buyer_id;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSellerReview(review.id);
      toast.success('Review deleted successfully');
      onReviewUpdated();
    } catch (err) {
      console.error('Failed to delete review:', err);
      toast.error('Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Edit Your Review</h4>
        <SellerReviewForm
          sellerId={review.seller_id}
          existingReviewId={review.id}
          initialRating={review.rating}
          initialComment={review.comment || ''}
          isEdit={true}
          onReviewSubmitted={() => {
            setIsEditing(false);
            onReviewUpdated();
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {review.buyer?.avatar_url ? (
              <img
                src={review.buyer.avatar_url}
                alt={review.buyer.full_name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {review.buyer?.full_name || review.buyer?.username || 'Anonymous User'}
              </h4>
              <SellerRatingStars rating={review.rating} size="sm" showEmpty={false} />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </p>
            
            {review.comment && (
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                {review.comment}
              </p>
            )}
          </div>
        </div>
        
        {isReviewer && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              title="Edit review"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete review"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SellerReviewItem;