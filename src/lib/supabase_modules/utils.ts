import { supabase } from '../supabase';
import { PaginatedResponse, UserProfile, KYCUser, DashboardStats, LeaderboardEntry, LeaderboardData, WeeklyStats } from '../supabase'; // Import types from main supabase.ts

// This file can be used for common utility functions related to Supabase interactions

export function handleSupabaseError(error: any, message: string = 'An unexpected error occurred'): Error {
  console.error('Supabase Error:', error);
  // You can add more sophisticated error handling here, e.g.,
  // - Check for specific error codes and return more user-friendly messages
  // - Log errors to an external service
  // - Trigger UI notifications
  
  if (error.message) {
    return new Error(`${message}: ${error.message}`);
  }
  return new Error(message);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    throw new Error('Unauthorized - Admin access required');
  }

  const [
    { count: totalUsers },
    { count: pendingKyc },
    { count: pendingMechanics },
    { count: reportedParts },
    { count: totalDiagnoses },
    { count: totalPartsListed },
    { count: kycApprovedThisMonth }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('kyc_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('mechanics').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reported_parts').select('*', { count: 'exact', head: true }),
    supabase.from('diagnoses').select('*', { count: 'exact', head: true }),
    supabase.from('parts').select('*', { count: 'exact', head: true }),
    supabase.from('kyc_requests').select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  ]);

  return {
    totalUsers: totalUsers || 0,
    pendingKyc: pendingKyc || 0,
    pendingMechanics: pendingMechanics || 0,
    reportedParts: reportedParts || 0,
    totalDiagnoses: totalDiagnoses || 0,
    totalPartsListed: totalPartsListed || 0,
    kycApprovedThisMonth: kycApprovedThisMonth || 0,
  };
}

export async function getLeaderboardData(category: string = 'all', limit: number = 50): Promise<LeaderboardData> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  const response: LeaderboardData = {
    overall: [],
    diagnosticians: [],
    sellers: [],
    contributors: [],
  };

  // Fetch different leaderboard categories based on request
  if (category === 'all' || category === 'overall') {
    const { data: overallData, error: overallError } = await supabase
      .from('user_leaderboard_stats')
      .select(`
        id,
        full_name,
        username,
        avatar_url,
        location,
        total_score,
        total_diagnoses,
        parts_sold,
        total_badges,
        clubs_founded
      `)
      .order('total_score', { ascending: false })
      .limit(limit);

    if (overallError) throw overallError;

    response.overall = (overallData || []).map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
  }

  if (category === 'all' || category === 'diagnosticians') {
    const { data: diagData, error: diagError } = await supabase
      .from('top_diagnosticians')
      .select('*')
      .limit(limit);

    if (diagError) throw diagError;
    response.diagnosticians = diagData || [];
  }

  if (category === 'all' || category === 'sellers') {
    const { data: sellersData, error: sellersError } = await supabase
      .from('top_sellers')
      .select('*')
      .limit(limit);

    if (sellersError) throw sellersError;
    response.sellers = sellersData || [];
  }

  if (category === 'all' || category === 'contributors') {
    const { data: contribData, error: contribError } = await supabase
      .from('top_contributors')
      .select('*')
      .limit(limit);

    if (contribError) throw contribError;
    response.contributors = contribData || [];
  }

  // If user is authenticated, get their ranks
  if (currentUserId) {
    response.userRank = {
      overall: null,
      diagnosticians: null,
      sellers: null,
      contributors: null
    };

    // Get user's overall rank
    const { data: overallRank, error: overallRankError } = await supabase.rpc(
      'get_user_rank_by_score',
      { user_id: currentUserId }
    );
    
    if (!overallRankError && overallRank !== null) {
      response.userRank.overall = overallRank;
    }

    // Get user's diagnostician rank
    const { data: diagRank, error: diagRankError } = await supabase.rpc(
      'get_user_diagnostician_rank',
      { user_id: currentUserId }
    );
    
    if (!diagRankError && diagRank !== null) {
      response.userRank.diagnosticians = diagRank;
    }

    // Get user's seller rank
    const { data: sellerRank, error: sellerRankError } = await supabase.rpc(
      'get_user_seller_rank',
      { user_id: currentUserId }
    );
    
    if (!sellerRankError && sellerRank !== null) {
      response.userRank.sellers = sellerRank;
    }

    // Get user's contributor rank
    const { data: contribRank, error: contribRankError } = await supabase.rpc(
      'get_user_contributor_rank',
      { user_id: currentUserId }
    );
    
    if (!contribRankError && contribRank !== null) {
      response.userRank.contributors = contribRank;
    }
  }

  return response;
}

export interface UserFeedback {
  id: string;
  user_id: string;
  message: string;
  sentiment: string;
  timestamp: string;
}

export async function getAllUserFeedback(page: number = 1, itemsPerPage: number = 10): Promise<PaginatedResponse<UserFeedback>> {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  const { data, error, count } = await supabase
    .from('user_feedback')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
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

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString();
  
  // Get diagnoses count
  const { count: diagnosesCount } = await supabase
    .from('diagnoses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('timestamp', oneWeekAgoStr);
  
  // Get parts listed count
  const { count: partsCount } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .gte('created_at', oneWeekAgoStr);
  
  // Get clubs joined count
  const { count: clubsCount } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('joined_at', oneWeekAgoStr);
  
  // Get messages count (both part messages and mechanic messages)
  const { count: partMessagesCount } = await supabase
    .from('part_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .gte('created_at', oneWeekAgoStr);
  
  const { count: mechanicMessagesCount } = await supabase
    .from('mechanic_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .gte('created_at', oneWeekAgoStr);
  
  // Get service records count
  const { count: serviceRecordsCount } = await supabase
    .from('service_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneWeekAgoStr);
  
  return {
    diagnoses: diagnosesCount || 0,
    partsListed: partsCount || 0,
    clubsJoined: clubsCount || 0,
    messagesExchanged: (partMessagesCount || 0) + (mechanicMessagesCount || 0),
    serviceRecordsAdded: serviceRecordsCount || 0
  };
}