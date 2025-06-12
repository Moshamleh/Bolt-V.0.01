import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  vin?: string;
  other_vehicle_description?: string;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  user_id: string;
  vehicle_id: string;
  prompt: string;
  response: string;
  timestamp: string;
  resolved: boolean;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    other_vehicle_description?: string;
  };
}

export interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  kyc_verified: boolean;
  location?: string;
  push_notifications_enabled: boolean;
  email_updates_enabled: boolean;
  ai_repair_tips_enabled: boolean;
  dark_mode_enabled: boolean;
  is_admin: boolean;
  initial_setup_complete: boolean;
  diagnostic_suggestions_enabled: boolean;
}

export interface Part {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  condition?: string;
  price: number;
  image_url?: string;
  created_at: string;
  sold: boolean;
  location?: string;
  category?: string;
  vehicle_fit?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  region?: string;
  image_url?: string;
  created_at: string;
  topic?: string;
  member_count?: number;
}

export interface ClubMember {
  id: string;
  user_id: string;
  club_id: string;
  joined_at: string;
  role: string;
}

export interface ClubMessage {
  id: string;
  club_id: string;
  sender_email: string;
  sender_avatar_url?: string;
  content: string;
  created_at: string;
}

export interface Mechanic {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  location?: string;
  experience?: string;
  specialties: string[];
  is_certified: boolean;
  status: string;
  created_at: string;
  bio?: string;
  hourly_rate?: number;
  languages?: string[];
}

export interface MechanicMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
  sender?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export interface PartMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_avatar_url?: string;
}

export interface PartChatPreview {
  id: string;
  part: {
    id: string;
    title: string;
  };
  other_user: {
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  kyc_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AiFeedbackLog {
  id: string;
  diagnosis_id: string;
  user_id: string;
  was_helpful: boolean;
  timestamp: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  diagnosis: {
    id: string;
    prompt: string;
    response: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
      other_vehicle_description?: string;
    };
  };
}

export interface UserFeedback {
  id: string;
  user_id: string;
  message: string;
  sentiment: string;
  timestamp: string;
}

export interface KYCUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity: 'common' | 'milestone' | 'rare' | 'exclusive';
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  note?: string;
  badge?: Badge;
}

export interface UserEarnedBadge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity: 'common' | 'milestone' | 'rare' | 'exclusive';
  awarded_at: string;
  note?: string;
}

// Auth functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // If there's an error indicating an invalid or expired token, sign out
    if (error && (error.message.includes('invalid JWT') || error.message.includes('token is expired'))) {
      await supabase.auth.signOut();
      return null;
    }
    
    if (error) throw error;
    return user;
  } catch (error) {
    // Handle any other authentication errors by signing out
    console.error('Authentication error:', error);
    await supabase.auth.signOut();
    return null;
  }
}

// Badge functions
export async function awardBadge(userId: string, badgeName: string, note?: string): Promise<UserBadge | null> {
  try {
    // Look up the badge by name
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('name', badgeName)
      .single();

    if (badgeError || !badge) {
      console.error('Badge not found:', badgeName);
      return null;
    }

    // Check if user already has this badge
    const { data: existingBadge, error: checkError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing badge:', checkError);
      return null;
    }

    if (existingBadge) {
      // User already has this badge
      return null;
    }

    // Award the badge
    const { data: awardedBadge, error: awardError } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badge.id,
        note: note || null
      })
      .select(`
        *,
        badge:badges(*)
      `)
      .single();

    if (awardError) {
      console.error('Error awarding badge:', awardError);
      return null;
    }

    return awardedBadge;
  } catch (error) {
    console.error('Error in awardBadge function:', error);
    return null;
  }
}

export async function getUserBadges(userId: string): Promise<UserEarnedBadge[]> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Ensure the user can only access their own badges (or admin can access any)
    if (user.id !== userId) {
      // Check if current user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        throw new Error('Unauthorized: Cannot access other user\'s badges');
      }
    }

    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        awarded_at,
        note,
        badge:badges(
          id,
          name,
          description,
          icon_url,
          rarity
        )
      `)
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;

    // Transform the data to flatten the badge information
    const userBadges: UserEarnedBadge[] = data?.map(item => ({
      id: item.id,
      name: item.badge.name,
      description: item.badge.description,
      icon_url: item.badge.icon_url,
      rarity: item.badge.rarity,
      awarded_at: item.awarded_at,
      note: item.note
    })) || [];

    return userBadges;
  } catch (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
}

// Profile functions
export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return data;
}

export async function updateProfile(updates: Partial<Profile>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProfile(profile: Omit<Profile, 'created_at'>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Math.random()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      // Check if the error is due to missing bucket
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Avatar storage is not configured. Please contact support to enable avatar uploads.');
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    // Re-throw with more user-friendly message for bucket not found
    if (error instanceof Error && error.message.includes('Bucket not found')) {
      throw new Error('Avatar storage is not configured. Please contact support to enable avatar uploads.');
    }
    throw error;
  }
}

// Vehicle functions
export async function getUserVehicles(): Promise<Vehicle[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at'>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Check if this is the user's first vehicle
  const existingVehicles = await getUserVehicles();
  const isFirstVehicle = existingVehicles.length === 0;

  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicle])
    .select()
    .single();

  if (error) throw error;

  // Award "Gear Up" badge for first vehicle
  if (isFirstVehicle) {
    try {
      await awardBadge(user.id, "Gear Up", "Added your first vehicle");
    } catch (badgeError) {
      console.error('Failed to award Gear Up badge:', badgeError);
      // Don't fail the vehicle creation if badge awarding fails
    }
  }

  return data;
}

export async function updateVehicle(vehicleId: string, updates: Partial<Vehicle>) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVehicle(vehicleId: string) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) throw error;
}

// Diagnosis functions
export async function sendDiagnosticPrompt(vehicleId: string, prompt: string): Promise<Diagnosis> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('diagnoses')
    .insert([{
      user_id: user.id,
      vehicle_id: vehicleId,
      prompt,
      response: '', // Will be updated by the edge function
      resolved: false
    }])
    .select()
    .single();

  if (error) throw error;

  // Check if this is the user's first diagnosis
  const { count } = await supabase
    .from('diagnoses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Award "Checked In" badge for first diagnosis
  if (count === 1) {
    try {
      await awardBadge(user.id, "Checked In", "Completed your first diagnostic");
    } catch (badgeError) {
      console.error('Failed to award Checked In badge:', badgeError);
      // Don't fail the diagnosis creation if badge awarding fails
    }
  }

  // Call the edge function to process the diagnosis
  const { error: functionError } = await supabase.functions.invoke('diagnose', {
    body: { diagnosisId: data.id }
  });

  if (functionError) {
    console.error('Edge function error:', functionError);
  }

  return data;
}

export async function getUserDiagnoses(vehicleId?: string): Promise<Diagnosis[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase
    .from('diagnoses')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateDiagnosisResolved(diagnosisId: string, resolved: boolean) {
  const { data, error } = await supabase
    .from('diagnoses')
    .update({ resolved })
    .eq('id', diagnosisId)
    .select()
    .single();

  if (error) throw error;
  return data;
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

// AI Feedback function
export async function recordAiFeedback(diagnosisId: string, wasHelpful: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('ai_logs')
    .insert([{
      diagnosis_id: diagnosisId,
      user_id: user.id,
      was_helpful: wasHelpful
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Parts functions
export async function getParts(filters?: {
  category?: string;
  make?: string;
  model?: string;
  year?: number;
  location?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
}): Promise<Part[]> {
  let query = supabase
    .from('parts')
    .select('*')
    .eq('sold', false)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.make) {
    query = query.eq('make', filters.make);
  }
  if (filters?.model) {
    query = query.eq('model', filters.model);
  }
  if (filters?.year) {
    query = query.eq('year', filters.year);
  }
  if (filters?.condition) {
    query = query.eq('condition', filters.condition);
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPartById(partId: string): Promise<(Part & { seller_email: string }) | null> {
  const { data, error } = await supabase
    .from('parts')
    .select(`
      *,
      seller:profiles!seller_id(email)
    `)
    .eq('id', partId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return {
    ...data,
    seller_email: data.seller?.email || 'Unknown'
  };
}

export async function createPart(part: Omit<Part, 'id' | 'created_at' | 'seller_id'>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('parts')
    .insert([{ ...part, seller_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePart(partId: string, updates: Partial<Part>) {
  const { data, error } = await supabase
    .from('parts')
    .update(updates)
    .eq('id', partId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePart(partId: string) {
  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', partId);

  if (error) throw error;
}

export async function getMyParts(): Promise<Part[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Saved parts functions
export async function getSavedParts(): Promise<Part[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_parts')
    .select(`
      part_id,
      parts (*)
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  return data?.map(item => item.parts).filter(Boolean) || [];
}

export async function savePart(partId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_parts')
    .insert([{ user_id: user.id, part_id: partId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unsavePart(partId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('saved_parts')
    .delete()
    .eq('user_id', user.id)
    .eq('part_id', partId);

  if (error) throw error;
}

export async function isPartSaved(partId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('saved_parts')
    .select('id')
    .eq('user_id', user.id)
    .eq('part_id', partId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

// Part chat functions
export async function getOrCreatePartChat(partId: string, sellerId: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Check if chat already exists
  const { data: existingChat, error: searchError } = await supabase
    .from('part_chats')
    .select('id')
    .eq('part_id', partId)
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .single();

  if (searchError && searchError.code !== 'PGRST116') throw searchError;

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('part_chats')
    .insert([{
      part_id: partId,
      buyer_id: user.id,
      seller_id: sellerId
    }])
    .select('id')
    .single();

  if (createError) throw createError;
  return newChat.id;
}

export async function getMyPartChats(): Promise<PartChatPreview[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('part_chats')
    .select(`
      id,
      created_at,
      part:parts(id, title),
      buyer:profiles!buyer_id(id, full_name, username, avatar_url),
      seller:profiles!seller_id(id, full_name, username, avatar_url),
      last_message:part_messages(content, created_at)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map(chat => ({
    id: chat.id,
    part: chat.part,
    other_user: chat.buyer.id === user.id ? chat.seller : chat.buyer,
    last_message: chat.last_message?.[0] || null,
    created_at: chat.created_at
  })) || [];
}

export async function getPartChatDetails(chatId: string): Promise<{
  part: Part;
  buyer: Profile;
  seller: Profile;
}> {
  const { data, error } = await supabase
    .from('part_chats')
    .select(`
      part:parts(*),
      buyer:profiles!buyer_id(*),
      seller:profiles!seller_id(*)
    `)
    .eq('id', chatId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPartMessages(chatId: string): Promise<PartMessage[]> {
  const { data, error } = await supabase
    .from('part_messages')
    .select(`
      *,
      sender:profiles!sender_id(avatar_url)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data?.map(message => ({
    ...message,
    sender_avatar_url: message.sender?.avatar_url
  })) || [];
}

export async function sendPartMessage(chatId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('part_messages')
    .insert([{
      chat_id: chatId,
      sender_id: user.id,
      content
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Club functions
export async function getClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClubById(clubId: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return data;
}

export async function createClub(club: Omit<Club, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('clubs')
    .insert([club])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinClub(clubId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('club_members')
    .insert([{ user_id: user.id, club_id: clubId, role: 'member' }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function leaveClub(clubId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('user_id', user.id)
    .eq('club_id', clubId);

  if (error) throw error;
}

export async function getClubMembers(clubId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select(`
      role,
      profiles(*)
    `)
    .eq('club_id', clubId);

  if (error) throw error;
  return data?.map(member => ({ ...member.profiles, role: member.role })) || [];
}

export async function isClubMember(clubId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('club_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function isUserClubMember(clubId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('club_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function getCurrentUserClubRole(clubId: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data?.role || null;
}

export async function getUserClubMemberships(): Promise<Club[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('club_members')
    .select(`
      clubs (*)
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data?.map(item => item.clubs).filter(Boolean) || [];
}

// Club messages function (missing function that was being imported)
export async function getClubMessages(clubId: string): Promise<ClubMessage[]> {
  const { data, error } = await supabase
    .from('club_messages')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendClubMessage(clubId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('club_messages')
    .insert([{
      club_id: clubId,
      sender_email: user.email,
      content
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Mechanic functions
export async function getMechanics(): Promise<Mechanic[]> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getApprovedMechanics(): Promise<Mechanic[]> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPendingMechanicRequests(): Promise<Mechanic[]> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateMechanicStatus(mechanicId: string, status: string) {
  const { data, error } = await supabase
    .from('mechanics')
    .update({ status })
    .eq('id', mechanicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMechanicById(mechanicId: string): Promise<Mechanic | null> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('id', mechanicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }
  
  return data;
}

export async function getMechanicProfile(): Promise<Mechanic | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return data;
}

export async function upsertMechanicProfile(profileData: Partial<Mechanic>): Promise<Mechanic> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('mechanics')
    .upsert({
      user_id: user.id,
      ...profileData
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateMechanicChat(userId: string, mechanicId: string): Promise<string> {
  // Check if chat already exists
  const { data: existingChat, error: searchError } = await supabase
    .from('mechanic_chats')
    .select('id')
    .eq('user_id', userId)
    .eq('mechanic_id', mechanicId)
    .single();

  if (searchError && searchError.code !== 'PGRST116') throw searchError;

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('mechanic_chats')
    .insert([{
      user_id: userId,
      mechanic_id: mechanicId,
      message: 'Chat started',
      is_from_mechanic: false
    }])
    .select('id')
    .single();

  if (createError) throw createError;
  return newChat.id;
}

export async function getMechanicChatDetails(chatId: string): Promise<{
  id: string;
  mechanic_id: string;
  user_id: string;
  mechanic?: Mechanic;
} | null> {
  const { data, error } = await supabase
    .from('mechanic_chats')
    .select(`
      id,
      mechanic_id,
      user_id,
      mechanic:mechanics(*)
    `)
    .eq('id', chatId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

export async function getMechanicMessages(chatId: string): Promise<MechanicMessage[]> {
  const { data, error } = await supabase
    .from('mechanic_messages')
    .select(`
      *,
      sender:users(full_name, username, avatar_url)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data || [];
}

// KYC and Admin functions
export async function checkKycStatus(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_verified')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data?.kyc_verified || false;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      avatar_url,
      kyc_verified,
      is_admin,
      created_at,
      users!inner(email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(profile => ({
    ...profile,
    email: profile.users?.email || ''
  })) || [];
}

export async function updateUserAdminStatus(userId: string, isAdmin: boolean) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserKycStatus(userId: string, isVerified: boolean) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ kyc_verified: isVerified })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingKycUsers(): Promise<KYCUser[]> {
  const { data, error } = await supabase
    .from('kyc_requests')
    .select(`
      user_id,
      users!inner(
        id,
        email,
        profiles(full_name, avatar_url, location)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(request => ({
    id: request.users.id,
    email: request.users.email,
    full_name: request.users.profiles?.full_name,
    avatar_url: request.users.profiles?.avatar_url,
    location: request.users.profiles?.location
  })) || [];
}

export async function getDashboardStats(): Promise<{
  totalUsers: number;
  pendingKyc: number;
  pendingMechanics: number;
  reportedParts: number;
}> {
  const [usersResult, kycResult, mechanicsResult, reportsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('kyc_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('mechanics').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reported_parts').select('id', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: usersResult.count || 0,
    pendingKyc: kycResult.count || 0,
    pendingMechanics: mechanicsResult.count || 0,
    reportedParts: reportsResult.count || 0
  };
}

export async function updatePreferences(preferences: {
  dark_mode_enabled?: boolean;
  diagnostic_suggestions_enabled?: boolean;
  push_notifications_enabled?: boolean;
  email_updates_enabled?: boolean;
  ai_repair_tips_enabled?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(preferences)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllUserFeedback(page: number = 1, limit: number = 10): Promise<{
  data: UserFeedback[];
  total: number;
}> {
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    supabase
      .from('user_feedback')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('user_feedback')
      .select('id', { count: 'exact', head: true })
  ]);

  if (dataResult.error) throw dataResult.error;
  if (countResult.error) throw countResult.error;

  return {
    data: dataResult.data || [],
    total: countResult.count || 0
  };
}

export async function getAllAiFeedback(page: number = 1, limit: number = 10): Promise<{
  data: AiFeedbackLog[];
  total: number;
}> {
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    supabase
      .from('ai_logs')
      .select(`
        *,
        user:users!user_id(id, email, profiles(full_name, avatar_url)),
        diagnosis:diagnoses!diagnosis_id(
          id,
          prompt,
          response,
          vehicle:vehicles(make, model, year, other_vehicle_description)
        )
      `)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('ai_logs')
      .select('id', { count: 'exact', head: true })
  ]);

  if (dataResult.error) throw dataResult.error;
  if (countResult.error) throw countResult.error;

  return {
    data: dataResult.data?.map(log => ({
      ...log,
      user: {
        id: log.user.id,
        email: log.user.email,
        full_name: log.user.profiles?.full_name,
        avatar_url: log.user.profiles?.avatar_url
      },
      diagnosis: {
        ...log.diagnosis,
        vehicle: log.diagnosis.vehicle
      }
    })) || [],
    total: countResult.count || 0
  };
}

export default supabase