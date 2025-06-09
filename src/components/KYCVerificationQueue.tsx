import React, { useState } from 'react';
import { User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { KYCUser, getPendingKycUsers, updateUserKycStatus } from '../lib/supabase';
import useSWR from 'swr';

const KYCVerificationQueue: React.FC = () => {
  const { data: users, error, mutate } = useSWR<KYCUser[]>('pending-kyc', getPendingKycUsers);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStatusUpdate = async (userId: string, approve: boolean) => {
    setProcessingId(userId);
    try {
      await updateUserKycStatus(userId, approve);
      await mutate();
      toast.success(approve ? 'User KYC approved' : 'User KYC rejected');
    } catch (err) {
      console.error('Failed to update KYC status:', err);
      toast.error('Failed to update KYC status');
    } finally {
      setProcessingId(null);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
        Failed to load KYC queue
      </div>
    );
  }

  if (!users) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Pending Verifications
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          All KYC verification requests have been processed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name || 'Anonymous User'}
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>{user.email}</p>
                  {user.location && <p>{user.location}</p>}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(user.id, true)}
                  disabled={processingId === user.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === user.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleStatusUpdate(user.id, false)}
                  disabled={processingId === user.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === user.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default KYCVerificationQueue;