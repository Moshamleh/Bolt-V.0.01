import React from 'react';
import Skeleton from './Skeleton';

interface ChatHistorySkeletonProps {
  count?: number;
  className?: string;
}

const ChatHistorySkeleton: React.FC<ChatHistorySkeletonProps> = ({ 
  count = 3,
  className = '' 
}) => {
  return (
    <div className={`space-y-4 p-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex justify-between items-start mb-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
};

export default ChatHistorySkeleton;