import { useState, useEffect } from 'react';
import { supabase, getProfile } from '../lib/supabase';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setShowOnboarding(false);
          return;
        }

        // Get user profile
        const profile = await getProfile();
        
        // If profile exists and initial_setup_complete is false, show onboarding
        if (profile && profile.initial_setup_complete === false) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setShowOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    isLoading,
    isInitialized,
    completeOnboarding,
    skipOnboarding
  };
}