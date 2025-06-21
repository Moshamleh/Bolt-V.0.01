import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Calendar, Gauge, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { markNotificationAsRead } from '../lib/supabase';

interface MaintenanceReminderProps {
  notification: {
    id: string;
    message: string;
    link?: string;
    created_at: string;
  };
  onDismiss?: () => void;
  className?: string;
}

const MaintenanceReminder: React.FC<MaintenanceReminderProps> = ({
  notification,
  onDismiss,
  className = ''
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  
  // Determine priority based on message content
  const getPriority = () => {
    const message = notification.message.toLowerCase();
    if (message.includes('overdue') || message.includes('urgent')) {
      return 'high';
    } else if (message.includes('soon') || message.includes('approaching')) {
      return 'medium';
    }
    return 'low';
  };
  
  const priority = getPriority();
  
  // Get appropriate styling based on priority
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };
  
  const getPriorityIconStyles = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400';
    }
  };
  
  const handleDismiss = async () => {
    setIsVisible(false);
    
    // Mark notification as read
    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    
    // Call onDismiss callback if provided
    if (onDismiss) {
      setTimeout(() => {
        onDismiss();
      }, 300); // Wait for exit animation to complete
    }
  };
  
  const handleAction = async () => {
    // Mark notification as read
    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    
    // Navigate to the link if provided
    if (notification.link) {
      navigate(notification.link);
    }
    
    // Call onDismiss callback if provided
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`rounded-lg border p-4 ${getPriorityStyles()} ${className}`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getPriorityIconStyles()}`}>
              {priority === 'high' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Wrench className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Maintenance Reminder
                </h3>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {notification.message}
              </p>
              
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleAction}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Schedule Service
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaintenanceReminder;