import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, ThumbsUp, ThumbsDown, User, 
  Car, MessageSquare, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import { useProfile } from '../hooks/useProfile';
import { getAllAiFeedback, AiFeedbackLog, PaginatedResponse } from '../lib/supabase';

const ITEMS_PER_PAGE = 10;

const AdminAiFeedback: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: profileLoading } = useProfile();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: paginatedData, error, isLoading } = useSWR<PaginatedResponse<AiFeedbackLog>>(
    ['ai-feedback', currentPage],
    () => getAllAiFeedback(currentPage, ITEMS_PER_PAGE),
    {
      keepPreviousData: true, // Keep previous data while loading new page
      revalidateOnFocus: false
    }
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (paginatedData?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const PaginationControls = () => {
    if (!paginatedData || paginatedData.totalPages <= 1) return null;

    const { page, totalPages, hasPreviousPage, hasNextPage } = paginatedData;

    // Generate page numbers to show
    const getPageNumbers = () => {
      const delta = 2; // Number of pages to show on each side of current page
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
        range.push(i);
      }

      if (page - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (page + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-between mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!hasPreviousPage || isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum as number)}
                    disabled={isLoading}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasNextPage || isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, paginatedData.total)} of {paginatedData.total} results
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Feedback Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor user feedback on AI diagnostic responses
          </p>
          {paginatedData && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Total feedback entries: {paginatedData.total}
            </p>
          )}
        </motion.div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
            Failed to load feedback logs
          </div>
        ) : !paginatedData ? (
          <LoadingSkeleton />
        ) : paginatedData.data.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Feedback Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Users haven't provided any feedback on AI responses
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {paginatedData.data.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {log.user.avatar_url ? (
                          <img
                            src={log.user.avatar_url}
                            alt={log.user.full_name || 'User'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {log.user.full_name || 'Anonymous User'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{log.user.email}</p>
                      </div>
                    </div>

                    <div className={`
                      p-2 rounded-full ${
                        log.was_helpful
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                      }
                    `}>
                      {log.was_helpful ? (
                        <ThumbsUp className="h-5 w-5" />
                      ) : (
                        <ThumbsDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle</h4>
                      <div className="flex items-center text-gray-900 dark:text-white">
                        <Car className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                        {log.diagnosis.vehicle.other_vehicle_description || (
                          `${log.diagnosis.vehicle.year} ${log.diagnosis.vehicle.make} ${log.diagnosis.vehicle.model}`
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">User's Issue</h4>
                      <p className="text-gray-900 dark:text-white">{log.diagnosis.prompt}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">AI Response</h4>
                      <p className="text-gray-900 dark:text-white">{log.diagnosis.response}</p>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <PaginationControls />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAiFeedback;