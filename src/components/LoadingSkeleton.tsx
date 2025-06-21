import React from 'react';
import { cn } from '../lib/utils';
import Skeleton from './Skeleton';

interface LoadingSkeletonProps {
  type: 'card' | 'list' | 'table' | 'form' | 'profile';
  count?: number;
  className?: string;
  containerClassName?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type,
  count = 3,
  className = '',
  containerClassName = ''
}) => {
  const renderCardSkeleton = () => (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6", className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-16 h-8 rounded-lg" />
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden", className)}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <Skeleton className="h-6 w-1/4 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-16 h-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6", className)}>
      <Skeleton className="h-6 w-1/3 mb-6" />
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );

  const renderProfileSkeleton = () => (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6", className)}>
      <div className="flex items-center gap-6 mb-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'profile':
        return renderProfileSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <div className={cn("space-y-4", containerClassName)}>
      {Array.from({ length: type === 'table' ? 1 : count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LoadingSkeleton;