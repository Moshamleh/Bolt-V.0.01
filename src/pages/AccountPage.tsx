import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, User, Moon, Shield, HelpCircle, Loader2, Award } from 'lucide-react';
import { Profile, getProfile, getUserBadges, UserEarnedBadge, supabase } from '../lib/supabase';
import ProfileSection from '../components/ProfileSection';
import PreferencesSection from '../components/PreferencesSection';
import SecurityLoginSection from '../components/SecurityLoginSection';
import SupportFeedbackSection from '../components/SupportFeedbackSection';
import BadgesPanel from '../components/BadgesPanel';

const AccountPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [badges, setBadges] = useState<UserEarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        setUserEmail(session.user.email || '');
        const profileData = await getProfile();
        setProfile(profileData);

        // Load user badges
        try {
          setBadgesLoading(true);
          const userBadges = await getUserBadges(session.user.id);
          setBadges(userBadges);
        } catch (badgeError) {
          console.error('Failed to load badges:', badgeError);
          // Don't set error state for badges, just log it
        } finally {
          setBadgesLoading(false);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="h-5 w-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <Moon className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'support', label: 'Support', icon: <HelpCircle className="h-5 w-5" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSection
            profile={profile}
            email={userEmail}
            onProfileUpdate={setProfile}
          />
        );
      case 'achievements':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Your Achievements
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Badges you've earned by using Bolt Auto and participating in the community
              </p>
            </div>
            <BadgesPanel badges={badges} loading={badgesLoading} />
          </div>
        );
      case 'preferences':
        return <PreferencesSection />;
      case 'security':
        return <SecurityLoginSection />;
      case 'support':
        return <SupportFeedbackSection />;
      default:
        return null;
    }
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
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Scrollable Tab Navigation */}
          <div className="overflow-x-auto border-b border-gray-100 dark:border-gray-700">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'achievements' && badges.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      {badges.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;