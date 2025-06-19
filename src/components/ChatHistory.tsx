import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, MessageSquare, Loader2, ArrowUpRight } from 'lucide-react';
import { Diagnosis, updateDiagnosisResolved } from '../lib/supabase';

interface ChatHistoryProps {
  diagnoses: Diagnosis[];
  loading: boolean;
  error: string | null;
  onStatusChange: (id: string, resolved: boolean) => void;
  onLoadDiagnosis?: (diagnosis: Diagnosis) => void;
  filterStatus?: 'all' | 'active' | 'resolved';
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  diagnoses, 
  loading, 
  error,
  onStatusChange,
  onLoadDiagnosis,
  filterStatus = 'all'
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(prevId => prevId === id ? null : id);
  };

  const handleResolvedToggle = async (id: string, currentStatus: boolean) => {
    try {
      setUpdatingId(id);
      await updateDiagnosisResolved(id, !currentStatus);
      onStatusChange(id, !currentStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter diagnoses based on filterStatus
  const filteredDiagnoses = diagnoses.filter(diagnosis => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return !diagnosis.resolved;
    if (filterStatus === 'resolved') return diagnosis.resolved;
    return true;
  });

  if (loading && diagnoses.length === 0) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {filteredDiagnoses.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {filterStatus === 'all' 
            ? 'No diagnostic history yet.' 
            : filterStatus === 'active' 
              ? 'No active diagnostics found.' 
              : 'No resolved diagnostics found.'}
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {filteredDiagnoses.map((diagnosis) => (
              <motion.div
                key={diagnosis.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`border rounded-lg overflow-hidden transition-all ${
                  diagnosis.resolved 
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  onClick={() => toggleExpanded(diagnosis.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                      {diagnosis.prompt}
                    </div>
                    {diagnosis.resolved ? (
                      <span className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        ✅ Fixed
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        ⏳ Unresolved
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {format(new Date(diagnosis.timestamp), 'MMM d, yyyy • h:mm a')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {diagnosis.response.substring(0, 100)}
                    {diagnosis.response.length > 100 ? '...' : ''}
                  </div>
                </div>
                
                {expandedId === diagnosis.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Issue:</h4>
                      <p className="text-gray-900 dark:text-white">{diagnosis.prompt}</p>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Diagnosis:</h4>
                      <p className="text-gray-900 dark:text-white">{diagnosis.response}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(diagnosis.timestamp).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        {onLoadDiagnosis && (
                          <button
                            onClick={() => onLoadDiagnosis(diagnosis)}
                            className="flex items-center gap-1 text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Continue Chat
                          </button>
                        )}
                        <button
                          onClick={() => handleResolvedToggle(diagnosis.id, diagnosis.resolved)}
                          disabled={updatingId === diagnosis.id}
                          className={`text-sm px-3 py-1 rounded-full transition-colors ${
                            diagnosis.resolved
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } ${updatingId === diagnosis.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {updatingId === diagnosis.id ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : diagnosis.resolved ? (
                            'Mark as Unresolved'
                          ) : (
                            'Mark as Fixed'
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default ChatHistory;