import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Loader2, Calendar, Gauge, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Notification, getUserNotifications, markNotificationAsRead } from '../lib/supabase';
import MaintenanceReminder from './MaintenanceReminder';

interface MaintenanceRemindersPanelProps {
  className?: string;
}

const MaintenanceRemindersPanel: React.FC<MaintenanceRemindersPanelProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadReminders = async () => {
      try {
        setLoading(true);
        
        // Get service reminder notifications
        const notifications = await getUserNotifications(50, false);
        const serviceReminders = notifications.filter(
          notification => notification.type === 'service_reminder' && !notification.read
        );
        
        setReminders(serviceReminders);
      } catch (err) {
        console.error('Failed to load maintenance reminders:', err);
        setError('Failed to load maintenance reminders');
      } finally {
        setLoading(false);
      }
    };
    
    loadReminders();
  }, []);
  
  const handleDismissReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No maintenance reminders
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your vehicles are up to date on maintenance
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence initial={false}>
        {reminders.map((reminder) => (
          <MaintenanceReminder
            key={reminder.id}
            notification={reminder}
            onDismiss={() => handleDismissReminder(reminder.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MaintenanceRemindersPanel;