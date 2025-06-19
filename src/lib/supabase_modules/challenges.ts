import { supabase } from '../supabase';
import { Challenge, UserChallenge, PaginatedResponse } from '../supabase';

/**
 * Get all available challenges
 */
export async function getAllChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get active challenges (not expired)
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .or(`end_date.is.null,end_date.gt.${now}`)
    .or(`start_date.is.null,start_date.lt.${now}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's challenge progress
 */
export async function getUserChallenges(
  userId?: string,
  includeCompleted: boolean = true,
  page: number = 1,
  itemsPerPage: number = 20
): Promise<PaginatedResponse<UserChallenge>> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  let query = supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `, { count: 'exact' })
    .eq('user_id', targetUserId);

  if (!includeCompleted) {
    query = query.eq('completed', false);
  }

  query = query
    .order('last_updated', { ascending: false })
    .range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    data: data || [],
    total,
    page,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/**
 * Get a specific challenge by ID
 */
export async function getChallengeById(challengeId: string): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a user's progress on a specific challenge
 */
export async function getUserChallengeProgress(
  challengeId: string,
  userId?: string
): Promise<UserChallenge | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('user_id', targetUserId)
    .eq('challenge_id', challengeId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
}

/**
 * Start a challenge for a user
 */
export async function startChallenge(
  challengeId: string,
  userId?: string
): Promise<UserChallenge> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // Check if user already has this challenge
  const { data: existingChallenge } = await supabase
    .from('user_challenges')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('challenge_id', challengeId)
    .single();

  if (existingChallenge) {
    throw new Error('Challenge already started');
  }

  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      user_id: targetUserId,
      challenge_id: challengeId,
      current_progress: 0,
      completed: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update progress on a challenge
 */
export async function updateChallengeProgress(
  challengeId: string,
  progress: number,
  userId?: string
): Promise<UserChallenge> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // Get current challenge progress
  const { data: currentProgress, error: progressError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('challenge_id', challengeId)
    .single();

  // If challenge doesn't exist for user, create it
  if (progressError && progressError.code === 'PGRST116') {
    return startChallenge(challengeId, targetUserId);
  } else if (progressError) {
    throw progressError;
  }

  // Update progress
  const { data, error } = await supabase
    .from('user_challenges')
    .update({
      current_progress: progress,
      last_updated: new Date().toISOString()
    })
    .eq('id', currentProgress.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Increment progress on a challenge
 */
export async function incrementChallengeProgress(
  challengeName: string,
  incrementBy: number = 1,
  userId?: string
): Promise<UserChallenge> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // First, get the challenge ID by name
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('id')
    .eq('name', challengeName)
    .maybeSingle(); // Use maybeSingle instead of single to handle case where no record is found

  if (challengeError) throw challengeError;
  if (!challenge) throw new Error(`Challenge not found: ${challengeName}`);

  const challengeId = challenge.id;

  // Get current challenge progress
  const { data: currentProgress, error: progressError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('challenge_id', challengeId)
    .single();

  // If challenge doesn't exist for user, create it with initial progress
  if (progressError && progressError.code === 'PGRST116') {
    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: targetUserId,
        challenge_id: challengeId,
        current_progress: incrementBy,
        completed: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } else if (progressError) {
    throw progressError;
  }

  // Update progress
  const { data, error } = await supabase
    .from('user_challenges')
    .update({
      current_progress: currentProgress.current_progress + incrementBy,
      last_updated: new Date().toISOString()
    })
    .eq('id', currentProgress.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's completed challenges
 */
export async function getCompletedChallenges(
  userId?: string,
  page: number = 1,
  itemsPerPage: number = 20
): Promise<PaginatedResponse<UserChallenge>> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  const { data, error, count } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `, { count: 'exact' })
    .eq('user_id', targetUserId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .range(startIndex, endIndex);

  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    data: data || [],
    total,
    page,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/**
 * Get user's in-progress challenges
 */
export async function getInProgressChallenges(
  userId?: string
): Promise<UserChallenge[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('user_id', targetUserId)
    .eq('completed', false)
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get daily challenges
 */
export async function getDailyChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('frequency', 'daily')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get weekly challenges
 */
export async function getWeeklyChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('frequency', 'weekly')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Reset daily challenges for a user
 */
export async function resetDailyChallenges(userId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // Get daily challenges
  const { data: dailyChallenges, error: challengesError } = await supabase
    .from('challenges')
    .select('id')
    .eq('frequency', 'daily');

  if (challengesError) throw challengesError;
  
  if (!dailyChallenges || dailyChallenges.length === 0) return;

  // Delete user's progress on daily challenges
  const { error } = await supabase
    .from('user_challenges')
    .delete()
    .eq('user_id', targetUserId)
    .in('challenge_id', dailyChallenges.map(c => c.id));

  if (error) throw error;
}

/**
 * Reset weekly challenges for a user
 */
export async function resetWeeklyChallenges(userId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('Not authenticated');

  // Get weekly challenges
  const { data: weeklyChallenges, error: challengesError } = await supabase
    .from('challenges')
    .select('id')
    .eq('frequency', 'weekly');

  if (challengesError) throw challengesError;
  
  if (!weeklyChallenges || weeklyChallenges.length === 0) return;

  // Delete user's progress on weekly challenges
  const { error } = await supabase
    .from('user_challenges')
    .delete()
    .eq('user_id', targetUserId)
    .in('challenge_id', weeklyChallenges.map(c => c.id));

  if (error) throw error;
}