import { supabase } from '../supabase';

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