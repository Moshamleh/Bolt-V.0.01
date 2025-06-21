import { supabase } from '../supabase';
import { Profile } from '../supabase'; // Import Profile type from main supabase.ts
import { Club, ClubMessage } from '../supabase'; // Import Club and ClubMessage types from main supabase.ts

export async function getClubById(clubId: string): Promise<Club> {
  const { data, error } = await supabase
    .from('clubs')
    .select(`*, club_members(count)`) // Select member count
    .eq('id', clubId)
    .single();

  if (error) throw error;
  return {
    ...data,
    member_count: data.club_members[0]?.count || 0
  };
}

export async function isUserClubMember(clubId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function joinClub(clubId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('club_members')
    .insert({
      club_id: clubId,
      user_id: user.id,
      role: 'member'
    });

  if (error) throw error;
}

export async function leaveClub(clubId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getClubMessages(clubId: string): Promise<ClubMessage[]> {
  const { data, error } = await supabase
    .from('club_messages')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendClubMessage(clubId: string, content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch sender's profile for email and avatar
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, avatar_url')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

  const { error } = await supabase
    .from('club_messages')
    .insert({
      club_id: clubId,
      sender_id: user.id,
      sender_email: profile?.email || 'anonymous',
      sender_avatar_url: profile?.avatar_url || null,
      content
    });

  if (error) throw error;
}

export async function getClubMembers(clubId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select(`
      user:profiles(*)
    `)
    .eq('club_id', clubId);

  if (error) throw error;
  return (data || []).map(member => member.user);
}

export async function getCurrentUserClubRole(clubId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.role || null;
}

export async function getClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select(`*, club_members(count)`) // Select member count
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(club => ({
    ...club,
    member_count: club.club_members[0]?.count || 0
  }));
}

export async function getUserClubMemberships(): Promise<Club[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('club_members')
    .select(`
      club:clubs(*)
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  return (data || []).map(membership => membership.club);
}