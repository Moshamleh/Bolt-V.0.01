import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Zap, Store, UsersRound, Settings, Wrench, Loader2, Car, Trophy } from 'lucide-react';
import OnboardingTour from './OnboardingTour';
import { useOnboarding } from '../hooks/useOnboarding';
import { updateProfile } from '../lib/supabase';
import InitialSetupRedirect from './InitialSetupRedirect';
import NotificationDropdown from './NotificationDropdown';
import WeeklyRecapManager from './WeeklyRecapManager';
import { useAuth } from '../context/AuthContext';

// Lazy load components
const ProfileCompletionBanner = lazy(() => import('./ProfileCompletionBanner'));

const Layout: React.FC = () => {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Only show profile banner on the account page
  const shouldShowBanner = location.pathname === '/account';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authLoading) {
          return;
        }
        
        if (!user) {
          navigate('/login');
          return;
        }
        
        // Load profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        setProfile(profileData || null);

        // Check if profile is incomplete
        if (profileData) {
          const fields = [
            !!profileData.full_name,
            !!profileData.username,
            !!profileData.avatar_url,
            !!profileData.bio,
            !!profileData.location
          ];
          
          const completedFields = fields.filter(Boolean).length;
          const totalFields = fields.length;
          const completionPercentage = Math.round((completedFields / totalFields) * 100);
          
          // Show banner if profile is less than 80% complete and we're on the account page
          setShowProfileBanner(completionPercentage < 80 && shouldShowBanner);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, shouldShowBanner, user, authLoading]);

  // Show loading spinner while checking authentication
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-neutral-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Check if we're on the account page to determine if we should use full width
  const isAccountPage = location.pathname === '/account';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900">
      {/* Add the InitialSetupRedirect component to handle redirects */}
      <InitialSetupRedirect />
      
      {/* Weekly Recap Manager */}
      <WeeklyRecapManager />
      
      {/* Profile Completion Banner */}
      {showProfileBanner && profile && (
        <Suspense fallback={null}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-4">
            <ProfileCompletionBanner 
              profile={profile} 
              onDismiss={() => setShowProfileBanner(false)} 
            />
          </div>
        </Suspense>
      )}
      
      {/* Desktop Navigation Bar */}
      <header className="hidden md:block sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <NavLink to="/diagnostic" className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                <Zap className="h-6 w-6" />
                <span className="text-lg">Bolt Auto</span>
              </NavLink>
            </div>
            
            {/* Main Navigation */}
            <nav className="flex items-center space-x-1">
              <NavLink
                to="/diagnostic"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
                data-tour="diagnostic"
              >
                <Zap className="h-5 w-5" />
                <span>Bolt Chat</span>
              </NavLink>

              <NavLink
                to="/vehicles"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
                data-tour="vehicles"
              >
                <Car className="h-5 w-5" />
                <span>Vehicles</span>
              </NavLink>

              <NavLink
                to="/mechanic-support"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
              >
                <Wrench className="h-5 w-5" />
                <span>Live Help</span>
              </NavLink>

              <NavLink
                to="/marketplace"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
                data-tour="marketplace"
              >
                <Store className="h-5 w-5" />
                <span>Marketplace</span>
              </NavLink>

              <NavLink
                to="/clubs"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
                data-tour="clubs"
              >
                <UsersRound className="h-5 w-5" />
                <span>Clubs</span>
              </NavLink>

              <NavLink
                to="/leaderboard"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
              >
                <Trophy className="h-5 w-5" />
                <span>Leaderboard</span>
              </NavLink>
            </nav>
            
            {/* Account/Settings */}
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              
              <NavLink
                to="/account"
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/50'}
                `}
                data-tour="account"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </NavLink>
            </div>
          </div>
        </div>
      </header>
      
      <main className="pb-20 md:pb-8 pt-4 px-4 md:px-6 lg:px-8">
        <div className={isAccountPage ? "w-full space-y-6" : "max-w-7xl mx-auto space-y-6"}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-100 dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 py-2 px-4 md:hidden">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <NavLink
            to="/diagnostic"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
            data-tour="diagnostic"
          >
            <Zap className="h-6 w-6" />
            <span className="text-[10px]">Bolt Chat</span>
          </NavLink>

          <NavLink
            to="/vehicles"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
          >
            <Car className="h-6 w-6" />
            <span className="text-[10px]">Vehicles</span>
          </NavLink>

          <NavLink
            to="/marketplace"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
            data-tour="marketplace"
          >
            <Store className="h-6 w-6" />
            <span className="text-[10px]">Market</span>
          </NavLink>

          <NavLink
            to="/clubs"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
          >
            <UsersRound className="h-6 w-6" />
            <span className="text-[10px]">Clubs</span>
          </NavLink>

          <NavLink
            to="/account"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
            data-tour="account"
          >
            <Settings className="h-6 w-6" />
            <span className="text-[10px]">Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* Onboarding Tour */}
      <OnboardingTour 
        isVisible={showOnboarding} 
        onComplete={completeOnboarding} 
        onSkip={skipOnboarding} 
      />
    </div>
  );
}

export default Layout;