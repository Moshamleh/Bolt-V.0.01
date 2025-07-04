import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, MessageSquare, Loader2, ArrowUpRight, ChevronDown, ChevronUp, Car, Repeat } from 'lucide-react';
import { Diagnosis, updateDiagnosisResolved, Vehicle } from '../lib/supabase';

interface ChatHistoryProps {
  diagnoses: Diagnosis[];
  loading: boolean;
  error: string | null;
  onStatusChange: (id: string, resolved: boolean) => void;
  onLoadDiagnosis?: (diagnosis: Diagnosis) => void;
  onRecheckDiagnosis?: (prompt: string) => void;
  filterStatus?: 'all' | 'active' | 'resolved';
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  diagnoses, 
  loading, 
  error,
  onStatusChange,
  onLoadDiagnosis,
  onRecheckDiagnosis,
  filterStatus = 'all'
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(prevId => prevId === id ? null : id);
  };

  const toggleVehicleExpanded = (vehicleId: string) => {
    setExpandedVehicleId(prevId => prevId === vehicleId ? null : vehicleId);
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

  // Group diagnoses by vehicle
  const groupedByVehicle: Record<string, { vehicle: Vehicle; diagnoses: Diagnosis[] }> = {};
  
  filteredDiagnoses.forEach(diagnosis => {
    if (diagnosis.vehicle) {
      const vehicleId = diagnosis.vehicle.id;
      
      if (!groupedByVehicle[vehicleId]) {
        groupedByVehicle[vehicleId] = {
          vehicle: diagnosis.vehicle,
          diagnoses: []
        };
      }
      
      groupedByVehicle[vehicleId].diagnoses.push(diagnosis);
    }
  });

  // Convert to array and sort by most recent diagnosis
  const groupedArray = Object.values(groupedByVehicle).sort((a, b) => {
    const aLatest = new Date(a.diagnoses[0]?.timestamp || 0).getTime();
    const bLatest = new Date(b.diagnoses[0]?.timestamp || 0).getTime();
    return bLatest - aLatest;
  });

  if (loading && diagnoses.length === 0) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 h-24 rounded-lg"></div>
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

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    if (vehicle.other_vehicle_description) {
      return vehicle.other_vehicle_description;
    }
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  };

  return (
    <div className="p-4 space-y-4">
      {groupedArray.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {filterStatus === 'all' 
            ? 'No diagnostic history yet.' 
            : filterStatus === 'active' 
              ? 'No active diagnostics found.' 
              : 'No resolved diagnostics found.'}
        </div>
      ) : (
        <AnimatePresence>
          {groupedArray.map((group) => (
            <motion.div
              key={group.vehicle.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
            >
              {/* Vehicle Header */}
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700"
                onClick={() => toggleVehicleExpanded(group.vehicle.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getVehicleDisplayName(group.vehicle)}
                    </h3>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                      {group.diagnoses.length} {group.diagnoses.length === 1 ? 'diagnosis' : 'diagnoses'}
                    </span>
                    {expandedVehicleId === group.vehicle.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnoses List */}
              <AnimatePresence>
                {expandedVehicleId === group.vehicle.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {group.diagnoses.map((diagnosis) => (
                        <div key={diagnosis.id} className="p-3">
                          <div 
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            onClick={() => toggleExpanded(diagnosis.id)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                {diagnosis.prompt}
                              </div>
                              {diagnosis.resolved ? (
                                <span className="flex items-center text-green-600 dark:text-green-400 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fixed
                                </span>
                              ) : (
                                <span className="flex items-center text-amber-600 dark:text-amber-400 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Unresolved
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {format(new Date(diagnosis.timestamp), 'MMM d, yyyy • h:mm a')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                              {diagnosis.response.substring(0, 100)}
                              {diagnosis.response.length > 100 ? '...' : ''}
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedId === diagnosis.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                              >
                                <div className="mb-3">
                                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Issue:</h4>
                                  <p className="text-sm text-gray-900 dark:text-white">{diagnosis.prompt}</p>
                                </div>
                                <div className="mb-3">
                                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Diagnosis:</h4>
                                  <p className="text-sm text-gray-900 dark:text-white">{diagnosis.response}</p>
                                </div>
                                
                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(diagnosis.timestamp).toLocaleString()}
                                  </span>
                                  <div className="flex gap-2">
                                    {onLoadDiagnosis && (
                                      <button
                                        onClick={() => onLoadDiagnosis(diagnosis)}
                                        className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                                      >
                                        <ArrowUpRight className="h-3 w-3" />
                                        Continue
                                      </button>
                                    )}
                                    {diagnosis.resolved && onRecheckDiagnosis && (
                                      <button
                                        onClick={() => onRecheckDiagnosis(diagnosis.prompt)}
                                        className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                      >
                                        <Repeat className="h-3 w-3" />
                                        Recheck
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleResolvedToggle(diagnosis.id, diagnosis.resolved)}
                                      disabled={updatingId === diagnosis.id}
                                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                        diagnosis.resolved
                                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                      } ${updatingId === diagnosis.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      {updatingId === diagnosis.id ? (
                                        <div className="flex items-center gap-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
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
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ChatHistory;