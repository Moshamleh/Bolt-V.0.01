import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Security logging function
function secureLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data
    ? {
        session_id: data.session_id,
        order_type: data.order_type,
        amount: data.amount,
        status: data.status,
        // Exclude sensitive payment details
      }
    : undefined;

  console.log(
    `[${timestamp}] ${message}`,
    sanitizedData ? JSON.stringify(sanitizedData) : ""
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      secureLog(`Unauthorized payment processing attempt from IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Initialize Supabase client with service role for RLS bypass
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token);

    if (!user) {
      secureLog(`Invalid authentication token from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const { session_id, order_type } = await req.json();

    if (!session_id || !order_type) {
      secureLog(`Missing required fields in payment processing`, {
        session_id,
        order_type,
      });
      return new Response(
        JSON.stringify({ error: "Missing session_id or order_type" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      throw new Error("Checkout session not found");
    }

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Process based on order type
    let result;

    switch (order_type) {
      case "boost":
        result = await processBoostOrder(session, supabaseClient);
        break;
      case "part_purchase":
        result = await processPartPurchase(session, supabaseClient);
        break;
      case "service_payment":
        result = await processServicePayment(session, supabaseClient);
        break;
      default:
        throw new Error(`Unsupported order type: ${order_type}`);
    }

    secureLog(`Payment processing completed successfully`, {
      session_id,
      order_type,
      order_id: result.order_id,
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    secureLog(`Payment processing failed: ${errorMessage}`, {
      session_id,
      order_type,
    });

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

// Process boost order completion
async function processBoostOrder(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const { part_id, boost_order_id, user_id } = session.metadata || {};

  if (!part_id || !boost_order_id || !user_id) {
    throw new Error("Missing boost order metadata");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days boost

  // Update boost order status
  const { error: boostError } = await supabaseClient
    .from("boost_orders")
    .update({
      status: "paid",
      stripe_session_id: session.id,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", boost_order_id);

  if (boostError) throw boostError;

  // Update part with boost status
  const { error: partError } = await supabaseClient
    .from("parts")
    .update({
      is_boosted: true,
      boost_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", part_id);

  if (partError) throw partError;

  // Create success notification
  await supabaseClient.from("notifications").insert({
    user_id,
    type: "boost_activated",
    message:
      "Your listing boost has been activated! It will appear at the top of search results for 7 days.",
    read: false,
    link: "/marketplace/my-listings",
    created_at: new Date().toISOString(),
  });

  // Log to payment audit
  await supabaseClient.from("payment_audit_log").insert({
    stripe_session_id: session.id,
    user_id,
    amount: session.amount_total,
    currency: "usd",
    status: "completed",
    event_type: "boost_order_completed",
    metadata: { part_id, boost_order_id },
    created_at: new Date().toISOString(),
  });

  return { order_id: boost_order_id, part_id };
}

// Process part purchase completion
async function processPartPurchase(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const { part_id, buyer_id, seller_id } = session.metadata || {};

  if (!part_id || !buyer_id || !seller_id) {
    throw new Error("Missing part purchase metadata");
  }

  // Update part status to sold
  const { error: partError } = await supabaseClient
    .from("parts")
    .update({
      status: "sold",
      buyer_id,
      sold_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent,
    })
    .eq("id", part_id);

  if (partError) throw partError;

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabaseClient
    .from("purchases")
    .insert({
      part_id,
      buyer_id,
      seller_id,
      amount: session.amount_total,
      stripe_session_id: session.id,
      status: "completed",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (purchaseError) throw purchaseError;

  // Create notifications
  await Promise.all([
    supabaseClient.from("notifications").insert({
      user_id: buyer_id,
      type: "purchase_confirmed",
      message:
        "Your purchase has been confirmed! Check your orders for shipping details.",
      read: false,
      link: "/marketplace/my-purchases",
    }),
    supabaseClient.from("notifications").insert({
      user_id: seller_id,
      type: "item_sold",
      message:
        "Congratulations! Your item has been sold. Please prepare it for shipping.",
      read: false,
      link: "/marketplace/my-sales",
    }),
  ]);

  // Log to payment audit
  await supabaseClient.from("payment_audit_log").insert({
    stripe_session_id: session.id,
    user_id: buyer_id,
    amount: session.amount_total,
    currency: "usd",
    status: "completed",
    event_type: "part_purchase_completed",
    metadata: { part_id, seller_id, purchase_id: purchase.id },
    created_at: new Date().toISOString(),
  });

  return { order_id: purchase.id, part_id };
}

// Process service payment completion
async function processServicePayment(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const {
    service_id,
    appointment_id,
    video_call_id,
    mechanic_id,
    customer_id,
    service_type,
  } = session.metadata || {};

  if (!mechanic_id || !customer_id || !service_type) {
    throw new Error("Missing service payment metadata");
  }

  // Create service payment record
  const { data: servicePayment, error: paymentError } = await supabaseClient
    .from("service_payments")
    .insert({
      service_id,
      appointment_id,
      video_call_id,
      mechanic_id,
      customer_id,
      amount: session.amount_total,
      stripe_session_id: session.id,
      service_type,
      status: "completed",
      platform_fee: Math.round(session.amount_total * 0.15), // 15% platform fee
      mechanic_payout: Math.round(session.amount_total * 0.85), // 85% to mechanic
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Update related records if they exist
  if (service_id) {
    await supabaseClient
      .from("services")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", service_id);
  }

  if (appointment_id) {
    await supabaseClient
      .from("appointments")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment_id);
  }

  if (video_call_id) {
    await supabaseClient
      .from("video_calls")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", video_call_id);
  }

  // Create notifications
  await Promise.all([
    supabaseClient.from("notifications").insert({
      user_id: customer_id,
      type: "service_payment_confirmed",
      message: `Your payment for ${service_type} service has been processed successfully.`,
      read: false,
      link: "/services/history",
    }),
    supabaseClient.from("notifications").insert({
      user_id: (
        await supabaseClient
          .from("mechanics")
          .select("user_id")
          .eq("id", mechanic_id)
          .single()
      ).data?.user_id,
      type: "payment_received",
      message: `You've received payment for a ${service_type} service. Payout will be processed soon.`,
      read: false,
      link: "/mechanic/earnings",
    }),
  ]);

  // Log to payment audit
  await supabaseClient.from("payment_audit_log").insert({
    stripe_session_id: session.id,
    user_id: customer_id,
    amount: session.amount_total,
    currency: "usd",
    status: "completed",
    event_type: "service_payment_completed",
    metadata: {
      service_id,
      appointment_id,
      video_call_id,
      mechanic_id,
      service_type,
      payment_id: servicePayment.id,
    },
    created_at: new Date().toISOString(),
  });

  return { order_id: servicePayment.id, service_type };
}
