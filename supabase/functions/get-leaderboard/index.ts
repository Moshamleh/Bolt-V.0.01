import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface LeaderboardEntry {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  location: string;
  rank: number;
  [key: string]: any;
}

interface LeaderboardResponse {
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const category = url.searchParams.get('category') || 'all';
    
    // Get user ID from authorization header if present
    const authHeader = req.headers.get('authorization');
    let currentUserId: string | null = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        currentUserId = user?.id || null;
      } catch (error) {
        console.log('Auth error (non-critical):', error);
      }
    }

    const response: LeaderboardResponse = {
      overall: [],
      diagnosticians: [],
      sellers: [],
      contributors: [],
    };

    // Fetch different leaderboard categories based on request
    if (category === 'all' || category === 'overall') {
      const { data: overallData, error: overallError } = await supabaseClient
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
      const { data: diagData, error: diagError } = await supabaseClient
        .from('top_diagnosticians')
        .select('*')
        .limit(limit);

      if (diagError) throw diagError;
      response.diagnosticians = diagData || [];
    }

    if (category === 'all' || category === 'sellers') {
      const { data: sellersData, error: sellersError } = await supabaseClient
        .from('top_sellers')
        .select('*')
        .limit(limit);

      if (sellersError) throw sellersError;
      response.sellers = sellersData || [];
    }

    if (category === 'all' || category === 'contributors') {
      const { data: contribData, error: contribError } = await supabaseClient
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
      const { data: overallRank, error: overallRankError } = await supabaseClient.rpc(
        'get_user_rank_by_score',
        { user_id: currentUserId }
      );
      
      if (!overallRankError && overallRank !== null) {
        response.userRank.overall = overallRank;
      }

      // Get user's diagnostician rank
      const { data: diagRank, error: diagRankError } = await supabaseClient.rpc(
        'get_user_diagnostician_rank',
        { user_id: currentUserId }
      );
      
      if (!diagRankError && diagRank !== null) {
        response.userRank.diagnosticians = diagRank;
      }

      // Get user's seller rank
      const { data: sellerRank, error: sellerRankError } = await supabaseClient.rpc(
        'get_user_seller_rank',
        { user_id: currentUserId }
      );
      
      if (!sellerRankError && sellerRank !== null) {
        response.userRank.sellers = sellerRank;
      }

      // Get user's contributor rank
      const { data: contribRank, error: contribRankError } = await supabaseClient.rpc(
        'get_user_contributor_rank',
        { user_id: currentUserId }
      );
      
      if (!contribRankError && contribRank !== null) {
        response.userRank.contributors = contribRank;
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch leaderboard data' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});