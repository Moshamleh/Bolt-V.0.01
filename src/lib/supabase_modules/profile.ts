import { supabase } from '../supabase';
import { Profile } from '../supabase'; // Import Profile type from main supabase.ts
import { User } from '@supabase/supabase-js';

export interface NotificationPreferences {
  chat_messages: boolean;
  ai_repair_tips: boolean;
  club_activity: boolean;
  service_reminders: boolean;
  marketplace_activity: boolean;
}

export async function getProfile(user?: User): Promise<Profile | null> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

export async function createProfile(profile: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: Partial<Profile>, user?: User): Promise<Profile> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', sessionUser.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function isAdminUser(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error) return false;
  return data?.is_admin || false;
}

export async function updateNotificationPreferences(preferences: NotificationPreferences, user?: User): Promise<void> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: preferences })
      .eq('id', sessionUser.id);

    if (error) throw error;
    return;
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: preferences })
    .eq('id', userId);

  if (error) throw error;
}

export async function updatePreferences(updates: Partial<Profile>, user?: User): Promise<Profile> {
  // Use provided user or get from session
  const userId = user?.id;
  
  if (!userId) {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', sessionUser.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  is_admin: boolean;
  kyc_status: string;
  location: string | null;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      avatar_url,
      email,
      created_at,
      is_admin,
      kyc_status,
      location
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;
}