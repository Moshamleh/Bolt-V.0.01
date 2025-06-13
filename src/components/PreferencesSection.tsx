import React, { useState } from 'react';
import { Moon, Zap, Loader2, Bell, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updatePreferences } from '../lib/supabase';
import { useTheme } from '../lib/theme';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
] as const;

const PreferencesSection: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const [preferences, setPreferences] = useState({
    diagnosticSuggestions: true,
    pushNotifications: true,
    emailUpdates: true,
    aiRepairTips: true
  });
  const [saving, setSaving] = useState(false);

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as typeof theme;
    setTheme(newTheme);
    
    try {
      await updatePreferences({
        dark_mode_enabled: newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
        diagnostic_suggestions_enabled: preferences.diagnosticSuggestions,
        push_notifications_enabled: preferences.pushNotifications,
        email_updates_enabled: preferences.emailUpdates,
        ai_repair_tips_enabled: preferences.aiRepairTips
      });
      toast.success('Theme updated');
    } catch (err) {
      console.error('Failed to update theme preference:', err);
      toast.error('Failed to update theme');
    }
  };

  const handleToggle = async (key: 'diagnosticSuggestions' | 'pushNotifications' | 'emailUpdates' | 'aiRepairTips') => {
    setSaving(true);
    try {
      const updatedPreferences = {
        dark_mode_enabled: theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
        diagnostic_suggestions_enabled: key === 'diagnosticSuggestions' ? !preferences.diagnosticSuggestions : preferences.diagnosticSuggestions,
        push_notifications_enabled: key === 'pushNotifications' ? !preferences.pushNotifications : preferences.pushNotifications,
        email_updates_enabled: key === 'emailUpdates' ? !preferences.emailUpdates : preferences.emailUpdates,
        ai_repair_tips_enabled: key === 'aiRepairTips' ? !preferences.aiRepairTips : preferences.aiRepairTips
      };

      await updatePreferences(updatedPreferences);
      setPreferences(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
      toast.success('Preferences updated');
    } catch (err) {
      console.error('Failed to update preferences:', err);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-white">Theme</h3>
            <p className="text-sm text-neutral-500 dark:text-gray-400">Choose your preferred theme</p>
          </div>
        </div>
        <select
          value={theme}
          onChange={handleThemeChange}
          className="rounded-lg border border-neutral-300 dark:border-gray-600 px-3 py-2 bg-neutral-100 dark:bg-gray-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {THEME_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Diagnostic Suggestions */}
      <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-white">Diagnostic Suggestions</h3>
            <p className="text-sm text-neutral-500 dark:text-gray-400">Get smart ideas before you ask the AI</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.diagnosticSuggestions}
            onChange={() => handleToggle('diagnosticSuggestions')}
            disabled={saving}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Notifications Section */}
      <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Notifications</h2>
        
        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Push Notifications</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Receive important app alerts on your phone</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Email Updates */}
        <div className="mt-4 flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Email Updates</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Get summaries and service reminders to your inbox</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailUpdates}
              onChange={() => handleToggle('emailUpdates')}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* AI Repair Tips */}
        <div className="mt-4 flex items-center justify-between p-4 bg-neutral-100 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">AI Repair Tips</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Be notified when the AI detects recurring issues</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.aiRepairTips}
              onChange={() => handleToggle('aiRepairTips')}
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

export default PreferencesSection;