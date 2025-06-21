import React from 'react';
import Skeleton from './Skeleton';

interface PartCardSkeletonProps {
  className?: string;
}

const PartCardSkeleton: React.FC<PartCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Image placeholder */}
      <Skeleton className="w-full aspect-[4/3]" />
      
      <div className="p-4 space-y-4">
        {/* Title and price */}
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-16" />
        </div>
        
        {/* Condition badge */}
        <div className="flex justify-end">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        {/* Vehicle details */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Date */}
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
};

export default PartCardSkeleton;