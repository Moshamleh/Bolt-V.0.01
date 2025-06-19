import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Mechanic Mode Prompt Primer
const MECHANIC_PROMPT = `You are Bolt, a friendly, helpful car mechanic AI. You speak casually, use emojis, and explain repairs clearly. Always sound human. Help users feel calm and confident.

Tone examples:
- "No worries, Mo — sounds like a loose belt 🔧. Let's double check it."
- "That rattle? Could be a heat shield. I got you 🧰."`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { diagnosisId, prompt, vehicleContext } = await req.json();

    if (!diagnosisId || !prompt) {
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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Prepare vehicle context string
    let vehicleContextStr = '';
    if (vehicleContext) {
      if (vehicleContext.other_vehicle_description) {
        vehicleContextStr = `Vehicle: ${vehicleContext.other_vehicle_description}`;
      } else {
        vehicleContextStr = `Vehicle: ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}${vehicleContext.trim ? ` ${vehicleContext.trim}` : ''}`;
      }
      
      if (vehicleContext.vin) {
        vehicleContextStr += `\nVIN: ${vehicleContext.vin}`;
      }
      
      if (vehicleContext.mileage) {
        vehicleContextStr += `\nMileage: ${vehicleContext.mileage}`;
      }
    }

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: MECHANIC_PROMPT }, // Add the mechanic prompt primer
        { role: 'user', content: `${vehicleContextStr ? vehicleContextStr + '\n\n' : ''}${prompt}` }
      ],
      temperature: 0.7,
    });

    const aiResponse = chatCompletion.choices[0].message?.content?.trim() || '';

    // Store AI context for analytics
    await supabaseClient
      .from('ai_context_log')
      .insert({
        diagnosis_id: diagnosisId,
        context_json: {
          vehicle_context: vehicleContext,
          prompt,
          response: aiResponse
        }
      });

    // Update the diagnosis with the AI response
    await supabaseClient
      .from('diagnoses')
      .update({ response: aiResponse })
      .eq('id', diagnosisId);

    return new Response(
      JSON.stringify({ success: true, response: aiResponse }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing diagnostic request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process diagnostic request' }),
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