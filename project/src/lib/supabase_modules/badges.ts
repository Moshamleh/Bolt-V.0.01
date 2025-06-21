import { supabase } from '../supabase';
import { Badge, UserEarnedBadge } from '../supabase'; // Import types from main supabase.ts

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