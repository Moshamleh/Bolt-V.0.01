import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.18.0';

Deno.serve(async (req) => {
  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature provided' }), { status: 400 });
    }

    // Get the raw body
    const body = await req.text();

    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err}`);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Get metadata from the session
      const partId = session.metadata?.part_id;
      const boostOrderId = session.metadata?.boost_order_id;
      const userId = session.metadata?.user_id;
      
      if (!partId || !boostOrderId || !userId) {
        console.error('Missing metadata in Stripe session');
        return new Response(JSON.stringify({ error: 'Missing metadata' }), { status: 400 });
      }
      
      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Update the boost order status to 'paid'
      await supabaseClient
        .from('boost_orders')
        .update({ 
          status: 'paid',
          expires_at: expiresAt.toISOString()
        })
        .eq('id', boostOrderId);
      
      // Update the part to be boosted
      await supabaseClient
        .from('parts')
        .update({ 
          is_boosted: true,
          boost_expires_at: expiresAt.toISOString() // Set boost_expires_at here
        })
        .eq('id', partId);
      
      // Create a notification for the user
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'boost_activated',
          message: 'Your listing boost has been activated! It will appear at the top of search results for 7 days.',
          read: false,
          link: '/marketplace/my-listings'
        });
      
      // Award XP to the user
      // This would typically be handled by a separate function or trigger
      
      console.log(`✅ Boost activated for part ${partId}`);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      
      // Get metadata from the session
      const boostOrderId = session.metadata?.boost_order_id;
      
      if (boostOrderId) {
        // Update the boost order status to 'failed'
        await supabaseClient
          .from('boost_orders')
          .update({ status: 'failed' })
          .eq('id', boostOrderId);
        
        console.log(`❌ Boost payment failed for order ${boostOrderId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});