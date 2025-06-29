import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const {
      mechanic_id,
      email,
      full_name,
      phone,
      business_type = "individual",
    } = await req.json();

    if (!mechanic_id || !email || !full_name) {
      throw new Error("Missing required fields");
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email,
      business_type,
      individual:
        business_type === "individual"
          ? {
              first_name: full_name.split(" ")[0],
              last_name:
                full_name.split(" ").slice(1).join(" ") ||
                full_name.split(" ")[0],
              email,
              phone,
            }
          : undefined,
      company:
        business_type === "company"
          ? {
              name: full_name,
              phone,
            }
          : undefined,
      metadata: {
        mechanic_id,
        user_id: user.id,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${Deno.env.get(
        "FRONTEND_URL"
      )}/mechanic/settings?refresh=true`,
      return_url: `${Deno.env.get(
        "FRONTEND_URL"
      )}/mechanic/settings?success=true`,
      type: "account_onboarding",
    });

    // Update mechanic record with Stripe account ID
    const { error: updateError } = await supabaseClient
      .from("mechanics")
      .update({ stripe_account_id: account.id })
      .eq("id", mechanic_id);

    if (updateError) {
      console.error("Error updating mechanic:", updateError);
      // Note: We don't throw here as the Stripe account was created successfully
    }

    return new Response(
      JSON.stringify({
        account_id: account.id,
        onboard_url: accountLink.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating Connect account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
