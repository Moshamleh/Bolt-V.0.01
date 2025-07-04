import React, { useState, useEffect } from 'react';
import { User, Phone, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mechanic, getPendingMechanicRequests, updateMechanicStatus } from '../lib/supabase';
import useSWR from 'swr';
import { subscribeToMechanicApplications } from '../lib/supabase_modules/adminRealtime';

const MechanicRequestsQueue: React.FC = () => {
  const { data: mechanics, error, mutate } = useSWR<Mechanic[]>(
    'pending-mechanics',
    getPendingMechanicRequests
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [hasNewApplication, setHasNewApplication] = useState(false);

  useEffect(() => {
    // Subscribe to new mechanic applications
    const unsubscribe = subscribeToMechanicApplications((newApplication) => {
      setHasNewApplication(true);
      // Refresh the data
      mutate();
      
      // Reset the notification after 5 seconds
      setTimeout(() => {
        setHasNewApplication(false);
      }, 5000);
    });
    
    return () => {
      unsubscribe();
    };
  }, [mutate]);

  const handleStatusUpdate = async (mechanicId: string, approve: boolean) => {
    setProcessingId(mechanicId);
    try {
      await updateMechanicStatus(mechanicId, approve ? 'approved' : 'rejected');
      await mutate();
      toast.success(approve ? 'Mechanic approved' : 'Mechanic rejected');
    } catch (err) {
      console.error('Failed to update mechanic status:', err);
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
        Failed to load mechanic requests
      </div>
    );
  }

  if (!mechanics) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-neutral-100 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-neutral-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-24 h-8 bg-neutral-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-8 bg-neutral-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mechanics.length === 0) {
    return (
      <div className="bg-neutral-100 dark:bg-gray-800 rounded-lg p-8 text-center">
        <User className="h-12 w-12 text-neutral-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
          No Pending Requests
        </h3>
        <p className="text-neutral-600 dark:text-gray-400">
          All mechanic requests have been processed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {mechanics.map((mechanic) => (
          <motion.div
            key={mechanic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-neutral-100 dark:bg-gray-800 rounded-lg shadow-sm border ${
              hasNewApplication ? 'border-blue-300 dark:border-blue-700 animate-pulse' : 'border-neutral-200 dark:border-gray-700'
            } p-4`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neutral-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-neutral-400 dark:text-gray-500" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-neutral-900 dark:text-white truncate flex items-center gap-2">
                  {mechanic.full_name}
                  {mechanic.is_certified && (
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </h4>
                <div className="text-sm text-neutral-500 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {mechanic.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    {mechanic.is_certified ? (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <Shield className="h-4 w-4 mr-1" />
                        <span>Certified Mechanic</span>
                      </div>
                    ) : (
                      <span>Freelance Mechanic</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(mechanic.id, true)}
                  disabled={processingId === mechanic.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === mechanic.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleStatusUpdate(mechanic.id, false)}
                  disabled={processingId === mechanic.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === mechanic.id ? (
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

export default MechanicRequestsQueue;