import { supabase } from './supabase';

/**
 * XP values for different actions
 */
export const XP_VALUES = {
  // Diagnostic actions
  RUN_DIAGNOSTIC: 10,
  RESOLVE_DIAGNOSTIC: 15,
  PROVIDE_FEEDBACK: 5,
  
  // Marketplace actions
  LIST_PART: 20,
  SELL_PART: 30,
  REVIEW_SELLER: 10,
  
  // Community actions
  JOIN_CLUB: 15,
  CREATE_CLUB: 40,
  SEND_CLUB_MESSAGE: 2,
  
  // Vehicle management
  ADD_VEHICLE: 25,
  ADD_SERVICE_RECORD: 15,
  
  // Profile completion
  COMPLETE_PROFILE: 50,
  VERIFY_KYC: 75,
  
  // Referrals
  REFER_USER: 100
};

/**
 * Award XP to a user
 * @param userId User ID to award XP to
 * @param amount Amount of XP to award
 * @param reason Optional reason for the XP award
 * @returns The updated user XP and level
 */
export async function awardXp(
  userId: string, 
  amount: number, 
  reason?: string
): Promise<{ xp: number; level: number }> {
  try {
    // First get current XP
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentXp = userData?.xp || 0;
    const newXp = currentXp + amount;
    
    // Update the user's XP
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ xp: newXp })
      .eq('id', userId)
      .select('xp, level')
      .single();
    
    if (updateError) throw updateError;
    
    // Log the XP award
    if (reason) {
      await supabase
        .from('xp_logs')
        .insert({
          user_id: userId,
          amount,
          reason,
          previous_xp: currentXp,
          new_xp: newXp,
          previous_level: userData?.level || 1,
          new_level: updatedUser.level
        });
    }
    
    return {
      xp: updatedUser.xp,
      level: updatedUser.level
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
}

/**
 * Get the XP required for a specific level
 * @param level The level to get XP requirement for
 * @returns The amount of XP required to reach the level
 */
export function getXpForLevel(level: number): number {
  // This should match the formula in the SQL function
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Get the user's current XP and level
 * @param userId User ID to get XP for
 * @returns The user's current XP and level
 */
export async function getUserXp(userId: string): Promise<{ xp: number; level: number }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return {
      xp: data?.xp || 0,
      level: data?.level || 1
    };
  } catch (error) {
    console.error('Error getting user XP:', error);
    throw error;
  }
}

/**
 * Get the XP progress for the current level
 * @param xp Current XP
 * @param level Current level
 * @returns Object with current XP, XP needed for next level, and percentage complete
 */
export function getXpProgress(xp: number, level: number): {
  currentXp: number;
  maxXp: number;
  percentage: number;
  nextLevel: number;
} {
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpForCurrentLevel = xp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const percentage = Math.min(100, Math.round((xpForCurrentLevel / xpNeededForNextLevel) * 100));
  
  return {
    currentXp: xpForCurrentLevel,
    maxXp: xpNeededForNextLevel,
    percentage,
    nextLevel: level + 1
  };
}

/**
 * Get the level name based on level number
 * @param level Level number
 * @returns The name of the level
 */
export function getLevelName(level: number): string {
  const levelNames = [
    'Novice',                // Level 1
    'Road Wrench 🛠️',        // Level 2
    'Bolt Apprentice ⚡',     // Level 3
    'Gear Shifter ⚙️',        // Level 4
    'Engine Expert 🔧',       // Level 5
    'Turbo Technician 🔩',    // Level 6
    'Suspension Specialist 🔌', // Level 7
    'Diagnostic Detective 🔍', // Level 8
    'Transmission Guru 🔄',   // Level 9
    'Master Mechanic 🏆'      // Level 10+
  ];
  
  if (level <= 0) return levelNames[0];
  if (level > levelNames.length) return levelNames[levelNames.length - 1];
  return levelNames[level - 1];
}