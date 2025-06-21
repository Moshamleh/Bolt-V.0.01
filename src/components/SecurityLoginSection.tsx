import React, { useState } from 'react';
import { KeyRound, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const SecurityLoginSection: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.error('Failed to update password:', err);
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/login';
    } catch (err) {
      console.error('Failed to log out:', err);
      toast.error('Failed to log out');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white">Change Password</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-gray-600 px-4 py-2 bg-neutral-100 dark:bg-gray-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-gray-600 px-4 py-2 bg-neutral-100 dark:bg-gray-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-neutral-500 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-white">Logout</h3>
                <p className="text-sm text-neutral-500 dark:text-gray-400">Sign out of your account</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Logout'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityLoginSection;