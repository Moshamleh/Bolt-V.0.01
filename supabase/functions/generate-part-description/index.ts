import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4'; // Import OpenAI library

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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key for backend functions
    );

    // Get user from token (optional, but good for logging/security)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
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
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt in request body' }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can choose a different model like 'gpt-4'
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150, // Limit the length of the generated description
      temperature: 0.7, // Controls randomness (0.0-1.0)
    });

    const generatedDescription = chatCompletion.choices[0].message?.content?.trim() || '';

    return new Response(
      JSON.stringify({ generatedDescription }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error generating part description:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate description' }),
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