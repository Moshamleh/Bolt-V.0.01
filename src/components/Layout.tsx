import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Zap, Store, UsersRound, Settings, Wrench, Loader2 } from 'lucide-react';
import OnboardingTour from './OnboardingTour';
import { useOnboarding } from '../hooks/useOnboarding';
import { supabase } from '../lib/supabase';
import InitialSetupRedirect from './InitialSetupRedirect';

const Layout: React.FC = () => {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
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
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900">
      {/* Add the InitialSetupRedirect component to handle redirects */}
      <InitialSetupRedirect />
      
      <main className="pb-20 pt-4 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
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
            to="/mechanic-support"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
          >
            <Wrench className="h-6 w-6" />
            <span className="text-[10px]">Live Help</span>
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
            <span className="text-[10px]">Marketplace</span>
          </NavLink>

          <NavLink
            to="/clubs"
            className={({ isActive }) => `
              flex flex-col items-center gap-1 min-w-[64px]
              ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'}
            `}
            data-tour="clubs"
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