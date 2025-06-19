import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import ChatHistory from './ChatHistory';
import { Diagnosis } from '../lib/supabase';

interface MobileCollapsibleMenuProps {
  isOpen: boolean;
  onClose: () => void;
  diagnoses: Diagnosis[];
  loading: boolean;
  error: string | null;
  onStatusChange: (id: string, resolved: boolean) => void;
  onLoadDiagnosis?: (diagnosis: Diagnosis) => void;
  filterStatus: 'all' | 'active' | 'resolved';
  onFilterChange: (status: 'all' | 'active' | 'resolved') => void;
}

const MobileCollapsibleMenu: React.FC<MobileCollapsibleMenuProps> = ({
  isOpen,
  onClose,
  diagnoses,
  loading,
  error,
  onStatusChange,
  onLoadDiagnosis,
  filterStatus,
  onFilterChange
}) => {
  const handleLoadDiagnosis = (diagnosis: Diagnosis) => {
    if (onLoadDiagnosis) {
      onLoadDiagnosis(diagnosis);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-neutral-100 dark:bg-gray-800 shadow-xl z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Diagnostic History
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-neutral-500 dark:text-gray-400 hover:text-neutral-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <div className="flex mt-2 gap-2">
                <button
                  onClick={() => onFilterChange('all')}
                  className={`px-3 py-1.5 text-sm rounded-full ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Show All
                </button>
                <button
                  onClick={() => onFilterChange('active')}
                  className={`px-3 py-1.5 text-sm rounded-full ${
                    filterStatus === 'active'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Only Active
                </button>
                <button
                  onClick={() => onFilterChange('resolved')}
                  className={`px-3 py-1.5 text-sm rounded-full ${
                    filterStatus === 'resolved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Only Resolved
                </button>
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-144px)]">
              <ChatHistory
                diagnoses={diagnoses}
                loading={loading}
                error={error}
                onStatusChange={onStatusChange}
                onLoadDiagnosis={handleLoadDiagnosis}
                filterStatus={filterStatus}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileCollapsibleMenu;