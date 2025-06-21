import React from 'react';
import Skeleton from './Skeleton';

interface ProfileSkeletonProps {
  className?: string;
}

const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;