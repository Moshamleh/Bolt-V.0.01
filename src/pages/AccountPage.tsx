import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, User, Moon, Shield, HelpCircle, Loader2, Award, Bell, Share2 } from 'lucide-react';
import { Profile, getProfile, getUserBadges, getAllBadges, UserEarnedBadge, Badge, supabase } from '../lib/supabase';
import LazyErrorBoundary from '../components/LazyErrorBoundary';

// Lazy load components
const ProfileSection = lazy(() => import('../components/ProfileSection'));
const PreferencesSection = lazy(() => import('../components/PreferencesSection'));
const SecurityLoginSection = lazy(() => import('../components/SecurityLoginSection'));
const SupportFeedbackSection = lazy(() => import('../components/SupportFeedbackSection'));
const BadgesPanel = lazy(() => import('../components/BadgesPanel'));
const ProfileCompletionIndicator = lazy(() => import('../components/ProfileCompletionIndicator'));
const NotificationPreferencesSection = lazy(() => import('../components/NotificationPreferencesSection'));
const ReferralSection = lazy(() => import('../components/ReferralSection'));

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
  </div>
);

const AccountPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [badges, setBadges] = useState<UserEarnedBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [displayBadges, setDisplayBadges] = useState<UserEarnedBadge[]>([]);
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

        // Load user badges and all available badges
        try {
          setBadgesLoading(true);
          const [userBadges, availableBadges] = await Promise.all([
            getUserBadges(session.user.id),
            getAllBadges()
          ]);
          
          setBadges(userBadges);
          setAllBadges(availableBadges);
          
          // Create a combined list of all badges, marking which ones are earned
          const combinedBadges: UserEarnedBadge[] = availableBadges.map(badge => {
            const earnedBadge = userBadges.find(ub => ub.badge_id === badge.id);
            if (earnedBadge) {
              return earnedBadge; // User has earned this badge
            } else {
              // Create a locked badge entry
              return {
                id: `locked-${badge.id}`,
                user_id: session.user.id,
                badge_id: badge.id,
                name: badge.name,
                description: badge.description,
                icon_url: badge.icon_url,
                rarity: badge.rarity,
                awarded_at: '', // Empty string indicates it's not earned yet
                note: ''
              };
            }
          });
          
          setDisplayBadges(combinedBadges);
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
    { id: 'referrals', label: 'Referrals', icon: <Share2 className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <Moon className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'support', label: 'Support', icon: <HelpCircle className="h-5 w-5" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <LazyErrorBoundary componentName="Profile Section">
            <Suspense fallback={<ComponentLoader />}>
              <div className="space-y-6">
                <ProfileCompletionIndicator profile={profile} />
                
                <ProfileSection
                  profile={profile}
                  email={userEmail}
                  onProfileUpdate={setProfile}
                />
              </div>
            </Suspense>
          </LazyErrorBoundary>
        );
      case 'achievements':
        return (
          <LazyErrorBoundary componentName="Achievements Section">
            <Suspense fallback={<ComponentLoader />}>
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Your Achievements
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Badges you've earned by using Bolt Auto and participating in the community
                  </p>
                </div>
                <BadgesPanel badges={displayBadges} loading={badgesLoading} />
              </div>
            </Suspense>
          </LazyErrorBoundary>
        );
      case 'referrals':
        return (
          <LazyErrorBoundary componentName="Referrals Section">
            <Suspense fallback={<ComponentLoader />}>
              <ReferralSection />
            </Suspense>
          </LazyErrorBoundary>
        );
      case 'notifications':
        return (
          <LazyErrorBoundary componentName="Notifications Section">
            <Suspense fallback={<ComponentLoader />}>
              <NotificationPreferencesSection />
            </Suspense>
          </LazyErrorBoundary>
        );
      case 'preferences':
        return (
          <LazyErrorBoundary componentName="Preferences Section">
            <Suspense fallback={<ComponentLoader />}>
              <PreferencesSection />
            </Suspense>
          </LazyErrorBoundary>
        );
      case 'security':
        return (
          <LazyErrorBoundary componentName="Security Section">
            <Suspense fallback={<ComponentLoader />}>
              <SecurityLoginSection />
            </Suspense>
          </LazyErrorBoundary>
        );
      case 'support':
        return (
          <LazyErrorBoundary componentName="Support Section">
            <Suspense fallback={<ComponentLoader />}>
              <SupportFeedbackSection />
            </Suspense>
          </LazyErrorBoundary>
        );
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
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pt-8 border-t border-gray-200 dark:border-gray-700"
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
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
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