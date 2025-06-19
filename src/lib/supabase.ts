import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  kyc_verified?: boolean;
  location?: string;
  push_notifications_enabled?: boolean;
  email_updates_enabled?: boolean;
  ai_repair_tips_enabled?: boolean;
  dark_mode_enabled?: boolean;
  is_admin?: boolean;
  initial_setup_complete?: boolean;
  diagnostic_suggestions_enabled?: boolean;
  role?: string;
  invited_by?: string;
  listing_boost_until?: string;
  first_diagnostic_completed?: boolean;
  first_club_joined?: boolean;
  first_part_listed?: boolean;
  wants_pro?: boolean;
}

export interface Vehicle {
  id: string;
  user_id?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  created_at?: string;
  vin?: string;
  other_vehicle_description?: string;
  nickname?: string;
  mileage?: number;
}

export interface Diagnosis {
  id: string;
  user_id: string;
  vehicle_id: string;
  prompt: string;
  response: string;
  timestamp: string;
  resolved?: boolean;
  vehicle?: Vehicle;
}

export interface Part {
  id: string;
  seller_id?: string;
  title: string;
  description?: string;
  condition?: string;
  price: number;
  image_url?: string;
  created_at?: string;
  sold?: boolean;
  location?: string;
  category?: string;
  vehicle_fit?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  part_number?: string;
  oem_number?: string;
  approved?: boolean;
  is_boosted?: boolean;
  boost_expires_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity: string;
  created_at?: string;
}

export interface UserEarnedBadge {
  id: string;
  user_id: string;
  badge_id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity: string;
  awarded_at: string;
  note?: string;
}

// Auth functions
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

// Profile functions
export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
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

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
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

// Vehicle functions
export async function getUserVehicles(): Promise<Vehicle[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Diagnosis functions
export async function getAllUserDiagnosesWithVehicles(): Promise<Diagnosis[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('diagnoses')
    .select(`
      *,
      vehicle:vehicles(*)
    `)
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function sendDiagnosticPrompt(vehicleId: string, prompt: string): Promise<Diagnosis> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create initial diagnosis record
  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      prompt,
      response: '',
      resolved: false
    })
    .select()
    .single();

  if (error) throw error;

  // Call the edge function to process the diagnosis
  const { error: functionError } = await supabase.functions.invoke('diagnose', {
    body: {
      diagnosisId: diagnosis.id,
      vehicleId,
      prompt
    }
  });

  if (functionError) {
    console.error('Error calling diagnose function:', functionError);
  }

  return diagnosis;
}

export function subscribeToDiagnosisUpdates(diagnosisId: string, callback: (diagnosis: Diagnosis) => void) {
  const subscription = supabase
    .channel(`diagnosis-${diagnosisId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'diagnoses',
        filter: `id=eq.${diagnosisId}`
      },
      (payload) => {
        callback(payload.new as Diagnosis);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// Parts functions
export async function createPart(part: Partial<Part>): Promise<Part> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('parts')
    .insert({
      ...part,
      seller_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function boostPart(partId: string, days: number = 7): Promise<Part> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  
  const { data, error } = await supabase
    .from('parts')
    .update({ 
      is_boosted: true,
      boost_expires_at: expiresAt.toISOString()
    })
    .eq('id', partId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// KYC functions
export async function checkKycStatus(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_verified')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data?.kyc_verified || false;
}

// Badge functions
export async function getUserBadges(userId?: string): Promise<UserEarnedBadge[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', targetUserId)
    .order('awarded_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    user_id: item.user_id,
    badge_id: item.badge_id,
    name: item.badge.name,
    description: item.badge.description,
    icon_url: item.badge.icon_url,
    rarity: item.badge.rarity,
    awarded_at: item.awarded_at,
    note: item.note
  }));
}

export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function awardBadge(userId: string | undefined, badgeName: string, note?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // First, get the badge by name
  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('id')
    .eq('name', badgeName)
    .single();

  if (badgeError || !badge) {
    console.error('Badge not found:', badgeName);
    return;
  }

  // Check if user already has this badge
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('badge_id', badge.id)
    .single();

  if (existing) {
    // User already has this badge
    return;
  }

  // Award the badge
  const { error } = await supabase
    .from('user_badges')
    .insert({
      user_id: targetUserId,
      badge_id: badge.id,
      note: note || null
    });

  if (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
}

// Achievement functions
export async function hasUserAchievementBeenAwarded(userId: string | undefined, achievementId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) return false;

  const { data, error } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('achievement_id', achievementId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking achievement:', error);
    return false;
  }

  return !!data;
}

export async function recordUserAchievement(
  userId: string | undefined, 
  achievementId: string, 
  xp: number, 
  badgeName: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // Get badge ID
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('name', badgeName)
    .single();

  const { error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: targetUserId,
      achievement_id: achievementId,
      xp_awarded: xp,
      badge_awarded: badge?.id || null
    });

  if (error) {
    console.error('Error recording achievement:', error);
    throw error;
  }
}

// Helper function to check if user is admin
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