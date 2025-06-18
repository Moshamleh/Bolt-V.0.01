import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    // Parse request body
    const requestData = await req.json();
    const { userId, invitedBy } = requestData;

    if (!userId || !invitedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
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

    // Update the new user's profile with the referrer's ID
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ invited_by: invitedBy })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Get the Street Starter Badge ID
    const { data: badge, error: badgeError } = await supabaseClient
      .from('badges')
      .select('id')
      .eq('name', 'Street Starter Badge')
      .single();

    if (badgeError) throw badgeError;

    // Award the badge to the referrer
    const { error: badgeAwardError } = await supabaseClient
      .from('user_badges')
      .insert({
        user_id: invitedBy,
        badge_id: badge.id,
        note: 'Awarded for referring a new user to Bolt Auto'
      })
      .on_conflict(['user_id', 'badge_id'])
      .ignore(); // Ignore if the user already has this badge

    if (badgeAwardError) throw badgeAwardError;

    // Set the listing boost for the referrer (24 hours from now)
    const { error: boostError } = await supabaseClient
      .from('profiles')
      .update({ listing_boost_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', invitedBy);

    if (boostError) throw boostError;

    // Create a notification for the referrer
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: invitedBy,
        type: 'referral_reward',
        message: 'You earned the Street Starter Badge and a 24-hour listing boost for referring a new user!',
        read: false,
        link: '/account?tab=achievements'
      });

    if (notificationError) throw notificationError;

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing referral:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process referral' }),
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