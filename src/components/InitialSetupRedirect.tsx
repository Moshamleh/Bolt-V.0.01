import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getProfile } from '../lib/supabase';

/**
 * Component that redirects users to the appropriate setup page if they haven't completed initial setup
 * This component should be rendered at the top level of the Layout component
 */
const InitialSetupRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Skip redirect for these paths
        const excludedPaths = ['/login', '/vehicle-setup', '/profile-setup', '/ai-safety'];
        if (excludedPaths.some(path => location.pathname.startsWith(path))) {
          setIsChecking(false);
          return;
        }

        const profile = await getProfile();
        
        // If profile doesn't exist or is incomplete, redirect to appropriate setup page
        if (!profile) {
          // If no profile exists, redirect to profile setup
          navigate('/profile-setup');
          return;
        }
        
        // If profile exists but initial_setup_complete is false
        if (profile.initial_setup_complete === false) {
          // Check if profile has name and username
          if (!profile.full_name || !profile.username) {
            // If profile is missing name or username, redirect to profile setup
            navigate('/profile-setup');
          } else {
            // If profile has name and username but setup is not complete, redirect to vehicle setup
            navigate('/vehicle-setup');
          }
        }
      } catch (error) {
        console.error('Failed to check setup status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetupStatus();
  }, [navigate, location.pathname]);

  // Don't render anything, just handle the redirect
  return isChecking ? (
    <div className="fixed inset-0 bg-neutral-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-neutral-600 dark:text-gray-400">Setting up your experience...</p>
      </div>
    </div>
  ) : null;
};

export default InitialSetupRedirect;