import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Loader2, Users, Shield, 
  Bell, Trash2, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Club, getUserClubMemberships, getClubs, getCurrentUserClubRole } from '../lib/supabase';

const ClubSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    newMembers: true,
    messages: true,
    events: true
  });

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true);
        
        // Get user's club memberships
        const memberships = await getUserClubMemberships();
        const membershipIds = memberships.map(club => club.id);
        
        // Get all clubs
        const allClubs = await getClubs();
        
        // Filter to only include clubs the user is a member of
        const userClubs = allClubs.filter(club => membershipIds.includes(club.id));
        
        setClubs(userClubs);
        
        // Set the first club as selected by default
        if (userClubs.length > 0 && !selectedClub) {
          setSelectedClub(userClubs[0].id);
          
          // Check if user is admin of this club
          const role = await getCurrentUserClubRole(userClubs[0].id);
          setIsAdmin(role === 'admin');
        }
      } catch (err) {
        console.error('Failed to load clubs:', err);
        setError('Failed to load your clubs');
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, [selectedClub]);

  const handleClubChange = async (clubId: string) => {
    setSelectedClub(clubId);
    
    try {
      // Check if user is admin of this club
      const role = await getCurrentUserClubRole(clubId);
      setIsAdmin(role === 'admin');
    } catch (err) {
      console.error('Failed to check user role:', err);
      setIsAdmin(false);
    }
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleLeaveClub = () => {
    if (!window.confirm('Are you sure you want to leave this club?')) {
      return;
    }
    
    // TODO: Implement leave club functionality
    alert('Leave club functionality will be implemented');
  };

  const handleDeleteClub = () => {
    if (!window.confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }
    
    // TODO: Implement delete club functionality
    alert('Delete club functionality will be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your club preferences and notifications
              </p>
            </div>
          </div>
        </motion.div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : clubs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <Users className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              You're not a member of any clubs yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join clubs to access settings and preferences
            </p>
            <button
              onClick={() => navigate('/clubs')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Browse Clubs
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Club Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Club
              </h2>
              <select
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Settings
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">New Members</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when new members join the club
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.newMembers}
                      onChange={() => handleNotificationToggle('newMembers')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Messages</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified about new messages in the club
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.messages}
                      onChange={() => handleNotificationToggle('messages')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Events</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified about upcoming club events
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.events}
                      onChange={() => handleNotificationToggle('events')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Admin Settings (only visible for club admins) */}
            {isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Admin Settings
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => navigate(`/clubs/${selectedClub}/edit`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    Edit Club Details
                  </button>
                  
                  <button
                    onClick={() => navigate(`/clubs/${selectedClub}/members/manage`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Users className="h-5 w-5" />
                    Manage Members
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-100 dark:border-red-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Danger Zone
                </h2>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleLeaveClub}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  Leave Club
                </button>
                
                {isAdmin && (
                  <button
                    onClick={handleDeleteClub}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete Club
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubSettingsPage;