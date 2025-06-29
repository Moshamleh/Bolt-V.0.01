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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const { payout_id } = await req.json();

    if (!payout_id) {
      throw new Error("Payout ID is required");
    }

    // Get payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from("mechanic_payouts")
      .select("*")
      .eq("id", payout_id)
      .single();

    if (payoutError || !payout) {
      throw new Error("Payout not found");
    }

    if (payout.status !== "pending") {
      throw new Error("Payout already processed");
    }

    try {
      // Create transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: payout.amount,
        currency: payout.currency,
        destination: payout.stripe_account_id,
        metadata: {
          payout_id: payout.id,
          mechanic_id: payout.mechanic_id,
        },
      });

      // Update payout status
      const { error: updateError } = await supabaseClient
        .from("mechanic_payouts")
        .update({
          status: "paid",
          transfer_id: transfer.id,
          payout_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout_id);

      if (updateError) {
        console.error("Error updating payout status:", updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          transfer_id: transfer.id,
          amount: transfer.amount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (stripeError: any) {
      // Update payout status to failed
      await supabaseClient
        .from("mechanic_payouts")
        .update({
          status: "failed",
          failure_reason: stripeError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout_id);

      throw new Error(`Payout failed: ${stripeError.message}`);
    }
  } catch (error) {
    console.error("Error processing payout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
