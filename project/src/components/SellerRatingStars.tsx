import React from 'react';
import { Star } from 'lucide-react';

interface SellerRatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  selectedRating?: number;
}

const SellerRatingStars: React.FC<SellerRatingStarsProps> = ({
  rating,
  size = 'md',
  showEmpty = true,
  className = '',
  interactive = false,
  onRatingChange,
  selectedRating
}) => {
  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const starSize = starSizes[size];
  const displayRating = selectedRating !== undefined ? selectedRating : rating;
  
  const handleStarClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(5)].map((_, index) => {
        const isFilled = index < Math.floor(displayRating);
        const isHalfFilled = !isFilled && index < Math.ceil(displayRating) && displayRating % 1 !== 0;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
            disabled={!interactive}
            aria-label={`${index + 1} star${index !== 0 ? 's' : ''}`}
          >
            <Star 
              className={`${starSize} ${
                isFilled 
                  ? 'text-yellow-400 fill-current' 
                  : isHalfFilled
                  ? 'text-yellow-400 fill-yellow-400 half-star'
                  : showEmpty
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'hidden'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default SellerRatingStars;