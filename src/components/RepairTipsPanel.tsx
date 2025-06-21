import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2, ThumbsUp, ThumbsDown, ChevronRight, AlertCircle, Battery, Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, ServiceRecord, getUserVehicles, getAllServiceRecords, Notification, getUserNotifications, markNotificationAsRead } from '../lib/supabase';
import MaintenanceReminder from './MaintenanceReminder';
import MaintenanceRemindersPanel from './MaintenanceRemindersPanel';
import { generatePersonalizedTips } from '../lib/maintenanceUtils';
import { useAuth } from '../context/AuthContext';

const RepairTipsPanel: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [repairTips, setRepairTips] = useState<ReturnType<typeof generatePersonalizedTips>>([]);
  const [maintenanceReminders, setMaintenanceReminders] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiclesData, recordsData, notificationsResponse] = await Promise.all([
          getUserVehicles(user),
          getAllServiceRecords(),
          getUserNotifications(50, false, user)
        ]);
        
        setVehicles(vehiclesData);
        setServiceRecords(recordsData);
        
        // Filter notifications to only include service reminders
        const serviceReminders = notificationsResponse.data.filter(
          notification => notification.type === 'service_reminder' && !notification.read
        );
        setMaintenanceReminders(serviceReminders);
        
        // Generate personalized tips based on vehicle data and service history
        const tips = generatePersonalizedTips(vehiclesData, recordsData);
        setRepairTips(tips);
      } catch (err) {
        console.error('Failed to load repair tips data:', err);
        setError('Failed to load repair tips');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleFeedback = (tipId: string, helpful: boolean) => {
    setFeedbackSubmitting(tipId);
    
    // Simulate feedback submission
    setTimeout(() => {
      // In a real implementation, this would send feedback to the server
      console.log(`Feedback for tip ${tipId}: ${helpful ? 'helpful' : 'not helpful'}`);
      
      // Remove the tip after feedback
      setRepairTips(prev => prev.filter(tip => tip.id !== tipId));
      setFeedbackSubmitting(null);
    }, 500);
  };

  const getPriorityStyles = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityBarColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 dark:bg-red-600';
      case 'medium':
        return 'bg-amber-500 dark:bg-amber-600';
      case 'low':
        return 'bg-green-500 dark:bg-green-600';
      default:
        return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error Loading Repair Tips</h3>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  // Show maintenance reminders first, then repair tips
  return (
    <div className="space-y-6">
      {/* Maintenance Reminders Section */}
      {maintenanceReminders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Maintenance Reminders
            </h3>
          </div>
          
          <MaintenanceRemindersPanel />
        </div>
      )}
      
      {/* Repair Tips Section */}
      {repairTips.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Repair Tips
            </h3>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {repairTips.map((tip) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden pl-3"
                >
                  {/* Colored vertical bar based on priority */}
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-3 ${getPriorityBarColor(tip.priority)}`}
                  />
                  
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getPriorityStyles(tip.priority)}`}>
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {tip.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityStyles(tip.priority)}`}>
                            {tip.priority.charAt(0).toUpperCase() + tip.priority.slice(1)} Priority
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          For: {tip.vehicleName}
                        </p>
                        
                        <div className="mt-2">
                          <button
                            onClick={() => setExpandedTipId(expandedTipId === tip.id ? null : tip.id)}
                            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            {expandedTipId === tip.id ? 'Show less' : 'Show more'}
                            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${
                              expandedTipId === tip.id ? 'rotate-90' : ''
                            }`} />
                          </button>
                        </div>
                        
                        <AnimatePresence>
                          {expandedTipId === tip.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                            >
                              <p className="text-gray-700 dark:text-gray-300 mb-3">
                                {tip.description}
                              </p>
                              
                              {tip.dueDate && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <span className="font-medium">Recommended by:</span> {tip.dueDate}
                                </p>
                              )}
                              
                              {tip.mileage && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <span className="font-medium">Recommended mileage:</span> {tip.mileage.toLocaleString()} miles
                                </p>
                              )}
                              
                              <div className="flex items-center gap-3 mt-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Was this tip helpful?
                                </span>
                                <button
                                  onClick={() => handleFeedback(tip.id, true)}
                                  disabled={!!feedbackSubmitting}
                                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <ThumbsUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(tip.id, false)}
                                  disabled={!!feedbackSubmitting}
                                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <ThumbsDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                
                                {feedbackSubmitting === tip.id && (
                                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin ml-2" />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    {/* AI Suggested tag */}
                    <div className="absolute bottom-2 right-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        AI Suggested
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Empty state if no tips or reminders */}
      {repairTips.length === 0 && maintenanceReminders.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No maintenance reminders or repair tips at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default RepairTipsPanel;