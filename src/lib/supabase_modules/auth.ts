import { supabase } from '../supabase';

export async function signUp(email: string, password: string, invitedBy?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: invitedBy ? { invited_by: invitedBy } : undefined
    }
  });
  return { data, error };
}