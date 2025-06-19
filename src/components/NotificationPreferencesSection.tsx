import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Lightbulb, UsersRound, Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getProfile, updateNotificationPreferences, NotificationPreferences } from '../lib/supabase';
import { extractErrorMessage } from '../lib/errorHandling';

const NotificationPreferencesSection: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    chat_messages: true,
    ai_repair_tips: true,
    club_activity: true,
    service_reminders: true,
    marketplace_activity: true
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const profile = await getProfile();
        if (profile && profile.notification_preferences) {
          setPreferences(profile.notification_preferences);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        const errorMessage = extractErrorMessage(error);
        setError(`Failed to load preferences: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    setSaving(true);
    setError(null);
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: !preferences[key]
      };

      await updateNotificationPreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      toast.success('Preferences updated');
    } catch (err) {
      console.error('Failed to update preferences:', err);
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to update preferences: ${errorMessage}`);
      toast.error(`Failed to update preferences: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Chat Messages */}
        <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Chat Messages</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Notifications for new messages from sellers and mechanics</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.chat_messages}
              onChange={() => handleToggle('chat_messages')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* AI Repair Tips */}
        <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">AI Repair Tips</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Notifications for new maintenance suggestions</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.ai_repair_tips}
              onChange={() => handleToggle('ai_repair_tips')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Club Activity */}
        <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <UsersRound className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Club Activity</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Notifications for new club messages and events</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.club_activity}
              onChange={() => handleToggle('club_activity')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Service Reminders */}
        <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Service Reminders</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Notifications for upcoming maintenance and service records</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.service_reminders}
              onChange={() => handleToggle('service_reminders')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Marketplace Activity */}
        <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Marketplace Activity</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Notifications for part listings and sales</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketplace_activity}
              onChange={() => handleToggle('marketplace_activity')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {saving && (
        <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2">Saving preferences...</span>
        </div>
      )}
    </div>
  );
};

export default NotificationPreferencesSection;