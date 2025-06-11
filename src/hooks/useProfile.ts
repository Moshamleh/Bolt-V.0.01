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

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;
  return data;
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