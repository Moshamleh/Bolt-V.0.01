import { supabase } from '../supabase';
import { Profile } from '../supabase'; // Import Profile type from main supabase.ts

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
  hourly_rate?: number;
  languages?: string[];
  bio?: string;
}

export interface MechanicChat {
  id: string;
  mechanic_id: string;
  user_id: string;
  message: string;
  is_from_mechanic: boolean;
  timestamp: string;
  read: boolean;
  gig_id: string | null;
}

export interface MechanicMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'user' | 'mechanic';
  message: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

export async function getApprovedMechanics(specialties: string[] = []): Promise<Mechanic[]> {
  let query = supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'approved');

  if (specialties.length > 0) {
    query = query.contains('specialties', specialties);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMechanicProfile(): Promise<Mechanic | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

export async function upsertMechanicProfile(profileData: Partial<Mechanic>): Promise<Mechanic> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mechanics')
    .upsert({ ...profileData, user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMechanicChatDetails(chatId: string): Promise<{ mechanic: Mechanic; user: Profile }> {
  const { data, error } = await supabase
    .from('mechanic_chats')
    .select(`
      mechanic:mechanics(*),
      user:profiles(*)
    `)
    .eq('id', chatId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMechanicMessages(chatId: string): Promise<MechanicMessage[]> {
  const { data, error } = await supabase
    .from('mechanic_messages')
    .select(`
      *,
      sender:profiles(full_name, avatar_url)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(msg => ({
    ...msg,
    sender: msg.sender || undefined
  }));
}

export async function getMechanicById(mechanicId: string): Promise<Mechanic | null> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('id', mechanicId)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateMechanicChat(userId: string, mechanicId: string): Promise<string> {
  // Check if a chat already exists between this user and mechanic
  const { data: existingChat, error: chatError } = await supabase
    .from('mechanic_chats')
    .select('id')
    .eq('user_id', userId)
    .eq('mechanic_id', mechanicId)
    .single();

  if (existingChat) {
    return existingChat.id;
  }

  // If not, create a new chat
  const { data: newChat, error: createError } = await supabase
    .from('mechanic_chats')
    .insert({
      user_id: userId,
      mechanic_id: mechanicId,
      message: 'Hello, I need some assistance with my vehicle.', // Initial message
      is_from_mechanic: false // Sent by user
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return newChat.id;
}

export async function getPendingMechanicRequests(): Promise<Mechanic[]> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateMechanicStatus(mechanicId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('mechanics')
    .update({ status })
    .eq('id', mechanicId);

  if (error) throw error;
}