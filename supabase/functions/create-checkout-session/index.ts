import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Security function to log checkout attempts
function secureLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data
    ? {
        order_type: data.order_type,
        user_id: data.user_id,
        amount: data.amount,
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
      secureLog(`Unauthorized checkout attempt from IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Initialize Supabase client
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
    const requestData = await req.json();
    const {
      order_type,
      part_id,
      user_id,
      amount,
      success_url,
      cancel_url,
      // Boost order specific
      boost_order_id,
      duration_days,
      // Part purchase specific
      buyer_id,
      seller_id,
      shipping_address,
      // Service payment specific
      service_id,
      appointment_id,
      video_call_id,
      mechanic_id,
      customer_id,
      duration_minutes,
      service_type,
    } = requestData;

    // Validate required fields based on order type
    if (!order_type || !user_id || !amount) {
      secureLog(`Missing required fields in checkout attempt`, {
        order_type,
        user_id,
        amount,
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Additional validation based on order type
    if (order_type === "boost" && (!part_id || !boost_order_id)) {
      return new Response(
        JSON.stringify({ error: "Missing boost order fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      order_type === "part_purchase" &&
      (!part_id || !buyer_id || !seller_id)
    ) {
      return new Response(
        JSON.stringify({ error: "Missing part purchase fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      order_type === "service_payment" &&
      (!mechanic_id || !customer_id || !service_type)
    ) {
      return new Response(
        JSON.stringify({ error: "Missing service payment fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Create checkout session based on order type
    let session: Stripe.Checkout.Session;

    switch (order_type) {
      case "boost":
        session = await createBoostCheckoutSession(
          stripe,
          {
            part_id,
            boost_order_id,
            user_id,
            amount,
            duration_days,
            success_url,
            cancel_url,
          },
          supabaseClient
        );
        break;

      case "part_purchase":
        session = await createPartPurchaseCheckoutSession(
          stripe,
          {
            part_id,
            buyer_id,
            seller_id,
            amount,
            shipping_address,
            success_url,
            cancel_url,
          },
          supabaseClient
        );
        break;

      case "service_payment":
        session = await createServicePaymentCheckoutSession(
          stripe,
          {
            service_id,
            appointment_id,
            video_call_id,
            mechanic_id,
            customer_id,
            amount,
            duration_minutes,
            service_type,
            success_url,
            cancel_url,
          },
          supabaseClient
        );
        break;

      default:
        throw new Error(`Unsupported order type: ${order_type}`);
    }

    secureLog(`Checkout session created successfully`, {
      order_type,
      session_id: session.id,
      user_id,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    secureLog(`Checkout session creation failed: ${errorMessage}`, {
      user_id,
      order_type,
    });

    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Helper function to create boost checkout session
async function createBoostCheckoutSession(
  stripe: Stripe,
  data: any,
  supabaseClient: any
): Promise<Stripe.Checkout.Session> {
  // Get part details
  const { data: part, error: partError } = await supabaseClient
    .from("parts")
    .select("title, price, images")
    .eq("id", data.part_id)
    .single();

  if (partError) throw new Error("Part not found");

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${data.duration_days || 7}-Day Boost: ${part.title}`,
            description: `Premium placement at the top of search results for ${
              data.duration_days || 7
            } days`,
            images: part.images ? [part.images[0]] : undefined,
          },
          unit_amount: data.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: data.success_url,
    cancel_url: data.cancel_url,
    metadata: {
      order_type: "boost",
      part_id: data.part_id,
      boost_order_id: data.boost_order_id,
      user_id: data.user_id,
    },
  });
}

// Helper function to create part purchase checkout session
async function createPartPurchaseCheckoutSession(
  stripe: Stripe,
  data: any,
  supabaseClient: any
): Promise<Stripe.Checkout.Session> {
  // Get part details
  const { data: part, error: partError } = await supabaseClient
    .from("parts")
    .select("title, price, images, seller_id")
    .eq("id", data.part_id)
    .single();

  if (partError) throw new Error("Part not found");

  // Get seller details for Connect account
  const { data: seller, error: sellerError } = await supabaseClient
    .from("profiles")
    .select("full_name, stripe_account_id")
    .eq("id", part.seller_id)
    .single();

  if (sellerError) throw new Error("Seller not found");

  // Calculate platform fee (15%)
  const platformFeeAmount = Math.round(data.amount * 0.15);

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: part.title,
            description: `Auto part sold by ${seller.full_name}`,
            images: part.images ? [part.images[0]] : undefined,
          },
          unit_amount: data.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: data.success_url,
    cancel_url: data.cancel_url,
    payment_intent_data: seller.stripe_account_id
      ? {
          application_fee_amount: platformFeeAmount,
          transfer_data: {
            destination: seller.stripe_account_id,
          },
        }
      : undefined,
    metadata: {
      order_type: "part_purchase",
      part_id: data.part_id,
      buyer_id: data.buyer_id,
      seller_id: data.seller_id,
      platform_fee: platformFeeAmount.toString(),
    },
  });
}

// Helper function to create service payment checkout session
async function createServicePaymentCheckoutSession(
  stripe: Stripe,
  data: any,
  supabaseClient: any
): Promise<Stripe.Checkout.Session> {
  // Get mechanic details
  const { data: mechanic, error: mechanicError } = await supabaseClient
    .from("mechanics")
    .select("full_name, hourly_rate, stripe_account_id")
    .eq("id", data.mechanic_id)
    .single();

  if (mechanicError) throw new Error("Mechanic not found");

  // Calculate platform fee (15%)
  const platformFeeAmount = Math.round(data.amount * 0.15);
  const durationText = data.duration_minutes
    ? `${data.duration_minutes} minutes`
    : "";

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${data.service_type} Service`,
            description: `${data.service_type} service by ${
              mechanic.full_name
            }${durationText ? ` - ${durationText}` : ""}`,
          },
          unit_amount: data.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: data.success_url,
    cancel_url: data.cancel_url,
    payment_intent_data: mechanic.stripe_account_id
      ? {
          application_fee_amount: platformFeeAmount,
          transfer_data: {
            destination: mechanic.stripe_account_id,
          },
        }
      : undefined,
    metadata: {
      order_type: "service_payment",
      service_id: data.service_id || "",
      appointment_id: data.appointment_id || "",
      video_call_id: data.video_call_id || "",
      mechanic_id: data.mechanic_id,
      customer_id: data.customer_id,
      service_type: data.service_type,
      duration_minutes: data.duration_minutes?.toString() || "",
      platform_fee: platformFeeAmount.toString(),
    },
  });
}
