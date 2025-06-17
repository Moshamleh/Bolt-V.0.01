import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Types
export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  kyc_verified: boolean;
  push_notifications_enabled: boolean;
  email_updates_enabled: boolean;
  ai_repair_tips_enabled: boolean;
  dark_mode_enabled: boolean;
  is_admin: boolean;
  initial_setup_complete: boolean;
  diagnostic_suggestions_enabled: boolean;
  notification_preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  chat_messages: boolean;
  ai_repair_tips: boolean;
  club_activity: boolean;
  service_reminders: boolean;
  marketplace_activity: boolean;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  vin: string | null;
  other_vehicle_description: string | null;
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
  vehicle?: Vehicle;
}

export interface Part {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  condition: 'new' | 'used' | 'refurbished';
  price: number;
  image_url: string;
  created_at: string;
  sold: boolean;
  location: string;
  category: string;
  vehicle_fit: string | null;
  make: string;
  model: string;
  year: number;
  trim: string | null;
}

export interface PartFilters {
  search?: string;
  make?: string;
  model?: string;
  condition?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  itemsPerPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PartChatPreview {
  id: string;
  part: {
    id: string;
    title: string;
    image_url: string;
  };
  other_user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  created_at: string;
  last_message?: {
    content: string;
    created_at: string;
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

export interface Mechanic {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  location: string;
  experience: string;
  specialties: string[];
  is_certified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  bio?: string;
  hourly_rate?: number;
  languages?: string[];
}

export interface MechanicMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'user' | 'mechanic';
  message: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Club {
  id: string;
  name: string;
  description: string;
  region: string;
  topic: string;
  image_url: string;
  created_at: string;
  member_count: number;
}

export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  sender_email: string;
  sender_avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface ServiceRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_date: string;
  service_type: string;
  description: string;
  mileage: number;
  cost: number;
  service_provider?: string;
  notes?: string;
  invoice_url?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export interface UserEarnedBadge {
  id: string;
  user_id: string;
  badge_id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: string;
  awarded_at: string;
  note?: string;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
  rank: number;
  [key: string]: any;
}

export interface LeaderboardData {
  overall: LeaderboardEntry[];
  diagnosticians: LeaderboardEntry[];
  sellers: LeaderboardEntry[];
  contributors: LeaderboardEntry[];
  userRank?: {
    overall: number | null;
    diagnosticians: number | null;
    sellers: number | null;
    contributors: number | null;
  };
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  kyc_verified: boolean;
  created_at: string;
}

export interface KYCUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  location: string | null;
}

export interface AiFeedbackLog {
  id: string;
  diagnosis_id: string;
  user_id: string;
  was_helpful: boolean;
  timestamp: string;
  diagnosis: {
    prompt: string;
    response: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
      other_vehicle_description: string | null;
    };
  };
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface UserFeedback {
  id: string;
  user_id: string;
  message: string;
  sentiment: 'happy' | 'neutral' | 'angry';
  timestamp: string;
}

// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Profile functions
export const getProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No profile found
    throw error;
  }

  return data;
};

export const createProfile = async (profile: Partial<Profile>): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (updates: Partial<Profile>): Promise<Profile> => {
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
};

export const updatePreferences = async (preferences: {
  dark_mode_enabled: boolean;
  diagnostic_suggestions_enabled: boolean;
  push_notifications_enabled: boolean;
  email_updates_enabled: boolean;
  ai_repair_tips_enabled: boolean;
}): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update(preferences)
    .eq('id', user.id);

  if (error) throw error;
};

export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: preferences })
    .eq('id', user.id);

  if (error) throw error;
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Avatar storage is not configured: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// Vehicle functions
export const getUserVehicles = async (): Promise<Vehicle[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createVehicle = async (vehicle: Partial<Vehicle>): Promise<Vehicle> => {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Diagnostic functions
export const getUserDiagnoses = async (vehicleId: string): Promise<Diagnosis[]> => {
  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const sendDiagnosticPrompt = async (vehicleId: string, prompt: string): Promise<Diagnosis> => {
  // First, get vehicle details to include in the context
  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();

  if (vehicleError) throw vehicleError;

  // Create a new diagnosis record
  const { data, error } = await supabase
    .from('diagnoses')
    .insert({
      vehicle_id: vehicleId,
      prompt,
      response: '', // Will be updated by the edge function
      resolved: false
    })
    .select()
    .single();

  if (error) throw error;

  // Call the edge function to get the AI response
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({
      diagnosisId: data.id,
      prompt,
      vehicleContext: vehicleData
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get AI response: ${response.statusText}`);
  }

  return data;
};

export const subscribeToDiagnosisUpdates = (diagnosisId: string, callback: (diagnosis: Diagnosis) => void): (() => void) => {
  const subscription = supabase
    .channel(`diagnosis:${diagnosisId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'diagnoses',
      filter: `id=eq.${diagnosisId}`,
    }, (payload) => {
      callback(payload.new as Diagnosis);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const updateDiagnosisResolved = async (diagnosisId: string, resolved: boolean): Promise<void> => {
  const { error } = await supabase
    .from('diagnoses')
    .update({ resolved })
    .eq('id', diagnosisId);

  if (error) throw error;
};

export const recordAiFeedback = async (diagnosisId: string, wasHelpful: boolean): Promise<void> => {
  const { error } = await supabase
    .from('ai_logs')
    .insert({
      diagnosis_id: diagnosisId,
      was_helpful: wasHelpful
    });

  if (error) throw error;
};

// Marketplace functions
export const getParts = async (
  filters: PartFilters = {}, 
  page: number = 1, 
  itemsPerPage: number = 12
): Promise<PaginatedResponse<Part>> => {
  let query = supabase
    .from('parts')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  if (filters.make) {
    query = query.eq('make', filters.make);
  }
  
  if (filters.model) {
    query = query.eq('model', filters.model);
  }
  
  if (filters.condition) {
    query = query.eq('condition', filters.condition);
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  // Only show unsold parts
  query = query.eq('sold', false);

  // Calculate pagination
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;
  
  // Apply pagination
  query = query.range(from, to);
  
  // Order by most recent
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  return {
    data: data || [],
    page,
    itemsPerPage,
    total: count || 0,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

export const getPartById = async (partId: string): Promise<Part & { seller_email: string }> => {
  const { data, error } = await supabase
    .from('parts')
    .select(`
      *,
      seller:seller_id (
        email
      )
    `)
    .eq('id', partId)
    .single();

  if (error) throw error;
  
  // Reshape the data to include seller_email
  const { seller, ...partData } = data;
  return {
    ...partData,
    seller_email: seller?.email || 'Unknown'
  };
};

export const getMyParts = async (): Promise<Part[]> => {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createPart = async (part: Partial<Part>): Promise<Part> => {
  const { data, error } = await supabase
    .from('parts')
    .insert(part)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePart = async (partId: string): Promise<void> => {
  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', partId);

  if (error) throw error;
};

export const checkKycStatus = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_verified')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data.kyc_verified;
};

// Saved parts functions
export const getSavedParts = async (): Promise<Part[]> => {
  const { data, error } = await supabase
    .from('saved_parts')
    .select(`
      part_id,
      part:part_id (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(item => item.part) || [];
};

export const isPartSaved = async (partId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('saved_parts')
    .select('id')
    .eq('part_id', partId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

export const savePart = async (partId: string): Promise<void> => {
  const { error } = await supabase
    .from('saved_parts')
    .insert({ part_id: partId });

  if (error) throw error;
};

export const unsavePart = async (partId: string): Promise<void> => {
  const { error } = await supabase
    .from('saved_parts')
    .delete()
    .eq('part_id', partId);

  if (error) throw error;
};

// Chat functions
export const getOrCreatePartChat = async (partId: string, sellerId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if chat already exists
  const { data: existingChat, error: findError } = await supabase
    .from('part_chats')
    .select('id')
    .eq('part_id', partId)
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (findError) throw findError;

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('part_chats')
    .insert({
      part_id: partId,
      buyer_id: user.id,
      seller_id: sellerId
    })
    .select()
    .single();

  if (createError) throw createError;
  return newChat.id;
};

export const getMyPartChats = async (): Promise<PartChatPreview[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('part_chats')
    .select(`
      id,
      created_at,
      part:part_id (
        id,
        title,
        image_url
      ),
      other_user:seller_id (
        id,
        full_name,
        username,
        avatar_url
      ),
      last_message:part_messages (
        content,
        created_at
      )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Process the data to ensure we get the "other" user
  return (data || []).map(chat => {
    // If the current user is the seller, we need to get the buyer info
    if (chat.other_user.id === user.id) {
      // This is a placeholder since we don't have the buyer info in the query
      // In a real implementation, you'd include the buyer info in the query
      chat.other_user = {
        id: 'buyer-id', // This should be the actual buyer ID
        full_name: 'Buyer',
        username: null,
        avatar_url: null
      };
    }

    // Get the most recent message if available
    const lastMessage = chat.last_message && chat.last_message.length > 0
      ? chat.last_message.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : undefined;

    return {
      id: chat.id,
      part: chat.part,
      other_user: chat.other_user,
      created_at: chat.created_at,
      last_message: lastMessage
    };
  });
};

export const getPartChatDetails = async (chatId: string): Promise<{
  part: Part;
  buyer: Profile;
  seller: Profile;
}> => {
  const { data, error } = await supabase
    .from('part_chats')
    .select(`
      part:part_id (*),
      buyer:buyer_id (*),
      seller:seller_id (*)
    `)
    .eq('id', chatId)
    .single();

  if (error) throw error;
  return data;
};

export const getPartMessages = async (chatId: string): Promise<PartMessage[]> => {
  const { data, error } = await supabase
    .from('part_messages')
    .select(`
      id,
      chat_id,
      sender_id,
      content,
      created_at,
      sender:sender_id (
        avatar_url
      )
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(message => ({
    id: message.id,
    chat_id: message.chat_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
    sender_avatar_url: message.sender?.avatar_url
  }));
};

export const sendPartMessage = async (chatId: string, content: string): Promise<void> => {
  const { error } = await supabase
    .from('part_messages')
    .insert({
      chat_id: chatId,
      content
    });

  if (error) throw error;
};

// Mechanic functions
export const getApprovedMechanics = async (specialties: string[] = []): Promise<Mechanic[]> => {
  let query = supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'approved');

  if (specialties.length > 0) {
    // Filter mechanics who have at least one of the selected specialties
    const specialtyConditions = specialties.map(specialty => 
      `specialties.cs.{${specialty}}`
    ).join(',');
    query = query.or(specialtyConditions);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMechanicById = async (mechanicId: string): Promise<Mechanic | null> => {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('id', mechanicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No mechanic found
    throw error;
  }

  return data;
};

export const getOrCreateMechanicChat = async (userId: string, mechanicId: string): Promise<string> => {
  // Check if chat already exists
  const { data: existingChat, error: findError } = await supabase
    .from('mechanic_chats')
    .select('id')
    .eq('mechanic_id', mechanicId)
    .eq('user_id', userId)
    .maybeSingle();

  if (findError) throw findError;

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('mechanic_chats')
    .insert({
      mechanic_id: mechanicId,
      user_id: userId,
      message: 'Hello, I need help with my vehicle.',
      is_from_mechanic: false
    })
    .select()
    .single();

  if (createError) throw createError;
  return newChat.id;
};

export const getMechanicChatDetails = async (chatId: string): Promise<{
  mechanic: Mechanic | null;
}> => {
  const { data, error } = await supabase
    .from('mechanic_chats')
    .select(`
      mechanic:mechanic_id (*)
    `)
    .eq('id', chatId)
    .single();

  if (error) throw error;
  return data;
};

export const getMechanicMessages = async (chatId: string): Promise<MechanicMessage[]> => {
  const { data, error } = await supabase
    .from('mechanic_messages')
    .select(`
      id,
      chat_id,
      sender_id,
      sender_type,
      message,
      created_at,
      sender:sender_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getMechanicProfile = async (): Promise<Mechanic | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertMechanicProfile = async (profile: Partial<Mechanic>): Promise<Mechanic> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('mechanics')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let result;
  
  if (existingProfile) {
    // Update existing profile
    const { data, error } = await supabase
      .from('mechanics')
      .update(profile)
      .eq('id', existingProfile.id)
      .select()
      .single();
      
    if (error) throw error;
    result = data;
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from('mechanics')
      .insert({
        ...profile,
        user_id: user.id,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) throw error;
    result = data;
  }

  return result;
};

// Club functions
export const getClubs = async (): Promise<Club[]> => {
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      *,
      member_count:club_members(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Process the data to get the member count
  return (data || []).map(club => ({
    ...club,
    member_count: club.member_count[0]?.count || 0
  }));
};

export const getClubById = async (clubId: string): Promise<Club | null> => {
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      *,
      member_count:club_members(count)
    `)
    .eq('id', clubId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No club found
    throw error;
  }

  // Process the data to get the member count
  return {
    ...data,
    member_count: data.member_count[0]?.count || 0
  };
};

export const getUserClubMemberships = async (): Promise<{ id: string }[]> => {
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id')
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data?.map(item => ({ id: item.club_id })) || [];
};

export const isUserClubMember = async (clubId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

export const joinClub = async (clubId: string): Promise<void> => {
  const { error } = await supabase
    .from('club_members')
    .insert({ club_id: clubId });

  if (error) throw error;
};

export const leaveClub = async (clubId: string): Promise<void> => {
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId);

  if (error) throw error;
};

export const getClubMembers = async (clubId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('club_members')
    .select(`
      user_id,
      role,
      user:user_id (
        id,
        full_name,
        username,
        avatar_url
      )
    `)
    .eq('club_id', clubId);

  if (error) throw error;

  // Process the data to include the role
  return data?.map(member => ({
    ...member.user,
    role: member.role
  })) || [];
};

export const getCurrentUserClubRole = async (clubId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .maybeSingle();

  if (error) throw error;
  return data?.role || null;
};

export const getClubMessages = async (clubId: string): Promise<ClubMessage[]> => {
  const { data, error } = await supabase
    .from('club_messages')
    .select(`
      id,
      club_id,
      sender_id,
      sender_email,
      sender_avatar_url,
      content,
      created_at
    `)
    .eq('club_id', clubId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const sendClubMessage = async (clubId: string, content: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's profile for avatar URL
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  const { error } = await supabase
    .from('club_messages')
    .insert({
      club_id: clubId,
      sender_id: user.id,
      sender_email: user.email,
      sender_avatar_url: profile?.avatar_url,
      content
    });

  if (error) throw error;
};

// Service record functions
export const createServiceRecord = async (record: Partial<ServiceRecord>): Promise<ServiceRecord> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_records')
    .insert({
      ...record,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getVehicleServiceRecords = async (vehicleId: string): Promise<ServiceRecord[]> => {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAllServiceRecords = async (): Promise<ServiceRecord[]> => {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteServiceRecord = async (recordId: string): Promise<void> => {
  const { error } = await supabase
    .from('service_records')
    .delete()
    .eq('id', recordId);

  if (error) throw error;
};

export const uploadServiceInvoice = async (file: File, vehicleId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${vehicleId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('service-invoices')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('service-invoices')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// Notification functions
export const getUserNotifications = async (limit: number = 10, includeRead: boolean = false): Promise<Notification[]> => {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!includeRead) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  if (error) throw error;
  return count || 0;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);

  if (error) throw error;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};

// Badge functions
export const getUserBadges = async (userId?: string): Promise<UserEarnedBadge[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !userId) throw new Error('Not authenticated');

  const targetUserId = userId || user!.id;

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      user_id,
      badge_id,
      awarded_at,
      note,
      badge:badge_id (
        name,
        description,
        icon_url,
        rarity
      )
    `)
    .eq('user_id', targetUserId)
    .order('awarded_at', { ascending: false });

  if (error) throw error;

  // Flatten the structure
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
};

export const awardBadge = async (userId: string, badgeName: string, note?: string): Promise<void> => {
  // First, find the badge by name
  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('id')
    .eq('name', badgeName)
    .single();

  if (badgeError) throw badgeError;

  // Award the badge to the user
  const { error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badge.id,
      note
    });

  if (error) {
    // If the error is a unique constraint violation, the user already has this badge
    if (error.code === '23505') {
      return; // Silently ignore duplicate badge awards
    }
    throw error;
  }
};

// Leaderboard functions
export const getLeaderboardData = async (category: string = 'all'): Promise<LeaderboardData> => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-leaderboard?category=${category}`, {
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard data: ${response.statusText}`);
  }

  return await response.json();
};

// Admin functions
export const getAllProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      avatar_url,
      is_admin,
      kyc_verified,
      created_at,
      auth.users!id(email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Flatten the structure
  return (data || []).map(profile => ({
    id: profile.id,
    full_name: profile.full_name,
    username: profile.username,
    email: profile['auth.users']?.[0]?.email || '',
    avatar_url: profile.avatar_url,
    is_admin: profile.is_admin,
    kyc_verified: profile.kyc_verified,
    created_at: profile.created_at
  }));
};

export const updateUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;
};

export const updateUserKycStatus = async (userId: string, isVerified: boolean): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ kyc_verified: isVerified })
    .eq('id', userId);

  if (error) throw error;
};

export const getPendingKycUsers = async (): Promise<KYCUser[]> => {
  const { data, error } = await supabase
    .from('kyc_requests')
    .select(`
      id,
      user_id,
      full_name,
      user:user_id (
        email,
        avatar_url,
        location
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Flatten the structure
  return (data || []).map(request => ({
    id: request.user_id,
    full_name: request.full_name,
    email: request.user?.email || '',
    avatar_url: request.user?.avatar_url || null,
    location: request.user?.location || null
  }));
};

export const getPendingMechanicRequests = async (): Promise<Mechanic[]> => {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const updateMechanicStatus = async (mechanicId: string, status: 'approved' | 'rejected'): Promise<void> => {
  const { error } = await supabase
    .from('mechanics')
    .update({ status })
    .eq('id', mechanicId);

  if (error) throw error;
};

export const getAllUserFeedback = async (page: number = 1, limit: number = 10): Promise<{
  data: UserFeedback[];
  total: number;
}> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('user_feedback')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data || [], total: count || 0 };
};

export const getAllAiFeedback = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<AiFeedbackLog>> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('ai_logs')
    .select(`
      id,
      diagnosis_id,
      user_id,
      was_helpful,
      timestamp,
      diagnosis:diagnosis_id (
        prompt,
        response,
        vehicle:vehicle_id (
          make,
          model,
          year,
          other_vehicle_description
        )
      ),
      user:user_id (
        full_name,
        email,
        avatar_url
      )
    `, { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    data: data || [],
    page,
    itemsPerPage: limit,
    total: count || 0,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

export const getDashboardStats = async (): Promise<{
  totalUsers: number;
  pendingKyc: number;
  pendingMechanics: number;
  reportedParts: number;
}> => {
  // Get total users count
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (usersError) throw usersError;

  // Get pending KYC count
  const { count: pendingKyc, error: kycError } = await supabase
    .from('kyc_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (kycError) throw kycError;

  // Get pending mechanics count
  const { count: pendingMechanics, error: mechanicsError } = await supabase
    .from('mechanics')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (mechanicsError) throw mechanicsError;

  // Get reported parts count
  const { count: reportedParts, error: partsError } = await supabase
    .from('reported_parts')
    .select('*', { count: 'exact', head: true });

  if (partsError) throw partsError;

  return {
    totalUsers: totalUsers || 0,
    pendingKyc: pendingKyc || 0,
    pendingMechanics: pendingMechanics || 0,
    reportedParts: reportedParts || 0
  };
};

export default supabase;