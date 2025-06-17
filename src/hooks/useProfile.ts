import useSWR from 'swr';
import { supabase } from '../lib/supabase';

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

const fetchProfile = async (): Promise<Profile | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
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
  const { data, error, isLoading, mutate } = useSWR<Profile | null>('profile', fetchProfile);

  return {
    profile: data,
    isAdmin: data?.is_admin || false,
    isLoading,
    error,
    mutate
  };
}