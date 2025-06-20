import useSWR from 'swr';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  kyc_verified: boolean;
  is_admin: boolean;
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If the error is PGRST116 (no rows returned), return null instead of throwing
      // Check both error.code and error.message to handle all cases
      if (error.code === 'PGRST116' || (error.message && error.message.includes('PGRST116'))) {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<Profile | null>(
    user ? ['profile', user.id] : null,
    () => user ? fetchProfile(user.id) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    profile: data,
    isAdmin: data?.is_admin || false,
    isLoading: isLoading || authLoading,
    error,
    mutate
  };
}