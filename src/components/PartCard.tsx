import React from 'react';
import { Car, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
        return 'bg-gray-100/90 text-gray-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image || 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg'}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm
            ${getConditionStyles(condition)}
          `}>
            {condition.charAt(0).toUpperCase() + condition.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <span className="flex-shrink-0 text-lg font-bold text-blue-600">
            {formatPrice(price)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Car className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {year} {make} {model}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="text-xs text-gray-500 pt-1">
            Listed {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartCard;