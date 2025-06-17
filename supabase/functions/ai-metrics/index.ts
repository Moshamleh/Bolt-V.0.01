import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface AiMetrics {
  totalResponses: number;
  helpfulCount: number;
  unhelpfulCount: number;
  byVehicle: {
    make: string;
    model: string;
    year: number;
    helpfulCount: number;
    unhelpfulCount: number;
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { 
          status: 403,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get total responses count
    const { count: totalCount, error: totalError } = await supabaseClient
      .from('ai_logs')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get helpful responses count
    const { count: helpfulCount, error: helpfulError } = await supabaseClient
      .from('ai_logs')
      .select('*', { count: 'exact', head: true })
      .eq('was_helpful', true);

    if (helpfulError) throw helpfulError;

    // Get unhelpful responses count
    const { count: unhelpfulCount, error: unhelpfulError } = await supabaseClient
      .from('ai_logs')
      .select('*', { count: 'exact', head: true })
      .eq('was_helpful', false);

    if (unhelpfulError) throw unhelpfulError;

    // Get metrics by vehicle
    const { data: vehicleData, error: vehicleError } = await supabaseClient.rpc(
      'get_ai_metrics_by_vehicle'
    );

    if (vehicleError) throw vehicleError;

    const metrics: AiMetrics = {
      totalResponses: totalCount || 0,
      helpfulCount: helpfulCount || 0,
      unhelpfulCount: unhelpfulCount || 0,
      byVehicle: vehicleData || []
    };

    return new Response(
      JSON.stringify(metrics),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching AI metrics:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch AI metrics' }),
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