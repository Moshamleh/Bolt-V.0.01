import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.18.0";

// Security headers for enhanced protection
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Allow up to 100 webhook requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  clientData.count++;
  return false;
}

// Secure logging function that excludes sensitive data
function secureLog(message: string, eventType?: string, data?: any) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data
    ? {
        type: eventType,
        id: data.id,
        created: data.created,
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
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST requests for webhooks
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const clientIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Apply rate limiting
  if (isRateLimited(clientIp)) {
    secureLog(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: corsHeaders,
    });
  }

  try {
    // Validate environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (
      !stripeSecretKey ||
      !stripeWebhookSecret ||
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      secureLog("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Stripe with enhanced security
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      typescript: true,
    });

    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      secureLog("Webhook request missing signature");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get the raw body
    const body = await req.text();

    // Validate body content
    if (!body || body.length === 0) {
      secureLog("Webhook request has empty body");
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Verify the event with enhanced error handling
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret
      );
      secureLog(`Webhook verified successfully`, event.type, event);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      secureLog(`Webhook signature verification failed: ${errorMessage}`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Initialize Supabase client with RLS bypass for service operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Enhanced event handling with comprehensive payment processing
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          supabaseClient
        );
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session,
          supabaseClient
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          supabaseClient
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
          supabaseClient
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
          supabaseClient
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          supabaseClient
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvents(
          event.type,
          event.data.object as Stripe.Subscription,
          supabaseClient
        );
        break;

      case "account.updated":
        await handleAccountUpdated(
          event.data.object as Stripe.Account,
          supabaseClient
        );
        break;

      case "payout.paid":
      case "payout.failed":
        await handlePayoutEvents(
          event.type,
          event.data.object as Stripe.Payout,
          supabaseClient
        );
        break;

      default:
        secureLog(`Unhandled webhook event type: ${event.type}`);
    }

    // Log successful webhook processing
    secureLog(`Successfully processed webhook: ${event.type}`, event.type);

    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    secureLog(`Error handling webhook: ${errorMessage}`);

    // Return generic error to avoid leaking sensitive information
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Enhanced checkout session completion handler
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  try {
    // Validate required metadata
    const {
      part_id: partId,
      boost_order_id: boostOrderId,
      user_id: userId,
      order_type: orderType,
    } = session.metadata || {};

    if (!userId) {
      throw new Error("Missing user_id in session metadata");
    }

    // Handle different order types
    if (orderType === "boost" && partId && boostOrderId) {
      await handleBoostOrderCompletion(
        partId,
        boostOrderId,
        userId,
        supabaseClient
      );
    } else if (orderType === "part_purchase") {
      await handlePartPurchaseCompletion(session, supabaseClient);
    } else if (orderType === "service_payment") {
      await handleServicePaymentCompletion(session, supabaseClient);
    } else {
      secureLog(`Unknown order type or missing metadata: ${orderType}`);
    }

    // Record payment in audit log
    await recordPaymentAudit(session, "completed", supabaseClient);
  } catch (error) {
    secureLog(`Error in handleCheckoutSessionCompleted: ${error}`);
    throw error;
  }
}

// Handle boost order completion
async function handleBoostOrderCompletion(
  partId: string,
  boostOrderId: string,
  userId: string,
  supabaseClient: any
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Use transaction-like approach for data consistency
  const { error: boostError } = await supabaseClient
    .from("boost_orders")
    .update({
      status: "paid",
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", boostOrderId);

  if (boostError) throw boostError;

  const { error: partError } = await supabaseClient
    .from("parts")
    .update({
      is_boosted: true,
      boost_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", partId);

  if (partError) throw partError;

  // Create notification
  await supabaseClient.from("notifications").insert({
    user_id: userId,
    type: "boost_activated",
    message:
      "Your listing boost has been activated! It will appear at the top of search results for 7 days.",
    read: false,
    link: "/marketplace/my-listings",
    created_at: new Date().toISOString(),
  });

  secureLog(`✅ Boost activated for part ${partId}`);
}

// Handle part purchase completion
async function handlePartPurchaseCompletion(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const {
    part_id: partId,
    buyer_id: buyerId,
    seller_id: sellerId,
  } = session.metadata || {};

  if (!partId || !buyerId || !sellerId) {
    throw new Error("Missing required metadata for part purchase");
  }

  // Update part status
  await supabaseClient
    .from("parts")
    .update({
      status: "sold",
      buyer_id: buyerId,
      sold_at: new Date().toISOString(),
    })
    .eq("id", partId);

  // Create purchase record
  await supabaseClient.from("purchases").insert({
    part_id: partId,
    buyer_id: buyerId,
    seller_id: sellerId,
    amount: session.amount_total,
    stripe_session_id: session.id,
    status: "completed",
    created_at: new Date().toISOString(),
  });

  // Notify both parties
  await Promise.all([
    supabaseClient.from("notifications").insert({
      user_id: buyerId,
      type: "purchase_confirmed",
      message:
        "Your purchase has been confirmed! Check your orders for details.",
      read: false,
      link: "/marketplace/my-purchases",
    }),
    supabaseClient.from("notifications").insert({
      user_id: sellerId,
      type: "item_sold",
      message: "Congratulations! Your item has been sold.",
      read: false,
      link: "/marketplace/my-sales",
    }),
  ]);

  secureLog(`✅ Part purchase completed: ${partId}`);
}

// Handle service payment completion
async function handleServicePaymentCompletion(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const {
    service_id: serviceId,
    mechanic_id: mechanicId,
    customer_id: customerId,
  } = session.metadata || {};

  if (!serviceId || !mechanicId || !customerId) {
    throw new Error("Missing required metadata for service payment");
  }

  // Update service status
  await supabaseClient
    .from("services")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  // Create payment record
  await supabaseClient.from("service_payments").insert({
    service_id: serviceId,
    mechanic_id: mechanicId,
    customer_id: customerId,
    amount: session.amount_total,
    stripe_session_id: session.id,
    status: "completed",
    created_at: new Date().toISOString(),
  });

  secureLog(`✅ Service payment completed: ${serviceId}`);
}

// Handle checkout session expiration
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  supabaseClient: any
) {
  const { boost_order_id: boostOrderId, order_type: orderType } =
    session.metadata || {};

  if (orderType === "boost" && boostOrderId) {
    await supabaseClient
      .from("boost_orders")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", boostOrderId);

    secureLog(`❌ Boost payment expired for order ${boostOrderId}`);
  }

  await recordPaymentAudit(session, "expired", supabaseClient);
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  // Update payment intent status in database
  await supabaseClient
    .from("payment_intents")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  secureLog(`✅ Payment intent succeeded: ${paymentIntent.id}`);
}

// Handle payment intent failed
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  await supabaseClient
    .from("payment_intents")
    .update({
      status: "failed",
      failure_reason:
        paymentIntent.last_payment_error?.message || "Unknown error",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  secureLog(`❌ Payment intent failed: ${paymentIntent.id}`);
}

// Handle invoice payment events
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  // Handle subscription invoices, service invoices, etc.
  secureLog(`✅ Invoice payment succeeded: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  // Handle failed invoice payments
  secureLog(`❌ Invoice payment failed: ${invoice.id}`);
}

// Handle subscription events
async function handleSubscriptionEvents(
  eventType: string,
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  // Handle subscription lifecycle events
  secureLog(`📱 Subscription event: ${eventType} for ${subscription.id}`);
}

// Handle Stripe Connect account updates
async function handleAccountUpdated(
  account: Stripe.Account,
  supabaseClient: any
) {
  // Update mechanic account information
  const { error } = await supabaseClient
    .from("mechanics")
    .update({
      stripe_account_status: account.details_submitted ? "active" : "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    secureLog(`Error updating account: ${error.message}`);
  } else {
    secureLog(`✅ Account updated: ${account.id}`);
  }
}

// Handle payout events
async function handlePayoutEvents(
  eventType: string,
  payout: Stripe.Payout,
  supabaseClient: any
) {
  const status = eventType === "payout.paid" ? "paid" : "failed";

  await supabaseClient
    .from("payouts")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payout_id", payout.id);

  secureLog(`💰 Payout ${status}: ${payout.id}`);
}

// Record payment audit trail
async function recordPaymentAudit(
  session: Stripe.Checkout.Session,
  status: string,
  supabaseClient: any
) {
  try {
    await supabaseClient.from("payment_audit_log").insert({
      stripe_session_id: session.id,
      user_id: session.metadata?.user_id,
      amount: session.amount_total,
      currency: session.currency,
      status,
      metadata: session.metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    secureLog(`Failed to record payment audit: ${error}`);
  }
}
