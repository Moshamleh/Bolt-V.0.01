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
    const { diagnosisId, vehicleId, prompt } = await req.json();

    if (!diagnosisId || !prompt || !vehicleId) {
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

    // Fetch vehicle details
    const { data: vehicleData, error: vehicleError } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError) {
      console.error('Error fetching vehicle data:', vehicleError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vehicle data' }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Fetch recent chat history for this vehicle (last 5 interactions)
    const { data: chatHistory, error: historyError } = await supabaseClient
      .from('diagnoses')
      .select('prompt, response, timestamp')
      .eq('vehicle_id', vehicleId)
      .neq('id', diagnosisId) // Exclude current diagnosis
      .order('timestamp', { ascending: false })
      .limit(5);

    if (historyError) {
      console.error('Error fetching chat history:', historyError);
      // Continue without chat history if there's an error
    }

    // Prepare vehicle context string
    let vehicleContextStr = '';
    if (vehicleData) {
      if (vehicleData.other_vehicle_description) {
        vehicleContextStr = `Vehicle: ${vehicleData.other_vehicle_description}`;
      } else {
        vehicleContextStr = `Vehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}${vehicleData.trim ? ` ${vehicleData.trim}` : ''}`;
      }
      
      if (vehicleData.vin) {
        vehicleContextStr += `\nVIN: ${vehicleData.vin}`;
      }
      
      if (vehicleData.mileage) {
        vehicleContextStr += `\nMileage: ${vehicleData.mileage}`;
      }
    }

    // Prepare messages array for OpenAI
    const messages = [
      { role: 'system', content: MECHANIC_PROMPT }
    ];

    // Add chat history if available
    if (chatHistory && chatHistory.length > 0) {
      // Sort by timestamp ascending to maintain conversation flow
      const sortedHistory = [...chatHistory].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Add each historical interaction as a user-assistant pair
      sortedHistory.forEach(entry => {
        messages.push({ role: 'user', content: entry.prompt });
        messages.push({ role: 'assistant', content: entry.response });
      });
    }

    // Add current prompt with vehicle context
    messages.push({ 
      role: 'user', 
      content: `${vehicleContextStr ? vehicleContextStr + '\n\n' : ''}${prompt}` 
    });

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    });

    const aiResponse = chatCompletion.choices[0].message?.content?.trim() || '';

    // Store AI context for analytics
    await supabaseClient
      .from('ai_context_log')
      .insert({
        diagnosis_id: diagnosisId,
        context_json: {
          vehicle_context: vehicleData,
          chat_history: chatHistory || [],
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