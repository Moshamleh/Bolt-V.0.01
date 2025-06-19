import React from 'react';
import { Car, MapPin, CheckCircle, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import BlurImage from './BlurImage';

export interface PartCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  year: number;
  make: string;
  model: string;
  location: string;
  createdAt: string;
  isTrustedSeller?: boolean;
  isBoosted?: boolean;
  onClick?: () => void;
}

const PartCard: React.FC<PartCardProps> = ({
  image,
  title,
  price,
  condition,
  year,
  make,
  model,
  location,
  createdAt,
  isTrustedSeller,
  isBoosted,
  onClick
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getConditionStyles = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-green-100/90 text-green-800';
      case 'used':
        return 'bg-yellow-100/90 text-yellow-800';
      case 'refurbished':
        return 'bg-blue-100/90 text-blue-800';
      default:
        return 'bg-neutral-100/90 text-neutral-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <BlurImage
          src={image || 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg'}
          alt={title}
          className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-300"
          objectFit="cover"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm
            ${getConditionStyles(condition)}
          `}>
            {condition.charAt(0).toUpperCase() + condition.slice(1)}
          </span>
          
          {isTrustedSeller && (
            <div 
              className="group flex items-center gap-1 px-2 py-1 bg-blue-100/90 text-blue-800 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm group-hover:shadow-glow group-hover:scale-105 transition-all duration-300"
              title="Verified seller – 3+ approved listings + KYC passed"
            >
              <CheckCircle className="h-3 w-3" />
              <span>Verified Seller</span>
            </div>
          )}
        </div>
        
        {/* Boosted Badge */}
        {isBoosted && (
          <div className="absolute top-2 left-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white rounded-full text-xs font-medium shadow-lg backdrop-blur-sm flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span>Boosted</span>
          </div>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <span className="flex-shrink-0 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(price)}
          </span>
        </div>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <Car className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {year} {make} {model}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            Listed {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartCard;