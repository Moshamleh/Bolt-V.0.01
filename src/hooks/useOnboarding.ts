import { useState, useEffect } from 'react';
import { supabase, getProfile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        if (!user || authLoading) {
          setShowOnboarding(false);
          return;
        }

        // Get user profile
        const profile = await getProfile(user);
        
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
  }, [user, authLoading]);

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