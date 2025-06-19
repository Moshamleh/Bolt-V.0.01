import React from 'react';
import Skeleton from './Skeleton';

interface VehicleCardSkeletonProps {
  className?: string;
}

const VehicleCardSkeleton: React.FC<VehicleCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-lg border border-neutral-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      
      <div className="space-y-3 mt-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default VehicleCardSkeleton;