import React from 'react';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { getModerationStatus } from '../lib/moderationStatus';

interface ModerationStatusDisplayProps {
  type: 'part' | 'kyc';
  userId?: string;
  partId?: string;
}

const ModerationStatusDisplay: React.FC<ModerationStatusDisplayProps> = ({ 
  type, 
  userId, 
  partId 
}) => {
  const { data: status, error, isLoading } = useSWR(
    [`moderation-status-${type}-${userId || partId}`, type, userId, partId],
    () => getModerationStatus({ 
      type, 
      user_id: userId, 
      part_id: partId 
    }),
    { 
      revalidateOnFocus: false,
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Checking...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Error checking status
      </div>
    );
  }

  switch (status) {
    case 'approved':
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Approved
        </div>
      );
    case 'rejected':
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Rejected
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
          <Clock className="h-3.5 w-3.5 mr-1" />
          Pending
        </div>
      );
  }
};

export default ModerationStatusDisplay;