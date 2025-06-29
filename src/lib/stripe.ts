import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "./supabase";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  throw new Error("Missing Stripe public key");
}

export const stripePromise = loadStripe(stripePublicKey);

// Stripe checkout session types
export interface CheckoutSessionData {
  sessionId: string;
  url: string;
}

export interface BoostOrderData {
  part_id: string;
  user_id: string;
  amount: number;
  duration_days: number;
}

export interface PartPurchaseData {
  part_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  shipping_address?: any;
}

export interface ServicePaymentData {
  service_id?: string;
  appointment_id?: string;
  video_call_id?: string;
  mechanic_id: string;
  customer_id: string;
  amount: number;
  duration_minutes?: number;
  service_type: string;
}

export interface MechanicPayout {
  id: string;
  mechanic_id: string;
  amount: number;
  stripe_transfer_id: string;
  status: "pending" | "processing" | "paid" | "failed";
  invoice_ids: string[];
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

export interface Invoice {
  id: string;
  service_id?: string;
  appointment_id?: string;
  video_call_id?: string;
  mechanic_id: string;
  customer_id: string;
  amount: number;
  platform_fee: number;
  mechanic_payout_amount: number;
  service_type: string;
  stripe_session_id: string;
  status: "pending" | "completed" | "failed" | "refunded";
  payout_id?: string;
  paid_out_at?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  issued_date: string;
  paid_date?: string;
  payment_status: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface Invoice {
  id: string;
  appointment_id?: string;
  video_call_id?: string;
  mechanic_id: string;
  user_id: string;
  amount: number;
  hourly_rate: number;
  duration_minutes: number;
  service_type: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  stripe_payment_intent_id?: string;
  payment_status:
    | "pending"
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled";
  invoice_number: string;
  issued_date: string;
  due_date: string;
  paid_date?: string;
  description: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount?: number;
  total_amount: number;
  mechanic_payout_amount: number; // Amount after platform fee
  platform_fee_amount: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface MechanicPayout {
  id: string;
  mechanic_id: string;
  stripe_account_id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  transfer_id?: string;
  invoice_ids: string[];
  payout_date?: string;
  created_at: string;
}

// Platform fee percentage (e.g., 15%)
const PLATFORM_FEE_PERCENTAGE = 0.15;

export class PaymentService {
  static async createPaymentIntent(
    amount: number, // in cents
    currency: string = "usd",
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    const { data, error } = await supabase.functions.invoke(
      "create-payment-intent",
      {
        body: {
          amount,
          currency,
          metadata,
        },
      }
    );

    if (error) throw error;
    return data;
  }

  // Comprehensive Checkout Session Creation Methods
  static async createBoostOrderCheckout(
    boostData: BoostOrderData
  ): Promise<CheckoutSessionData> {
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          order_type: "boost",
          part_id: boostData.part_id,
          user_id: boostData.user_id,
          amount: boostData.amount,
          duration_days: boostData.duration_days,
          success_url: `${window.location.origin}/marketplace/boost-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/marketplace/boost-cancelled`,
        },
      }
    );

    if (error) throw error;
    return data;
  }

  static async createPartPurchaseCheckout(
    purchaseData: PartPurchaseData
  ): Promise<CheckoutSessionData> {
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          order_type: "part_purchase",
          part_id: purchaseData.part_id,
          buyer_id: purchaseData.buyer_id,
          seller_id: purchaseData.seller_id,
          amount: purchaseData.amount,
          shipping_address: purchaseData.shipping_address,
          success_url: `${window.location.origin}/marketplace/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/marketplace/purchase-cancelled`,
        },
      }
    );

    if (error) throw error;
    return data;
  }

  static async createServicePaymentCheckout(
    serviceData: ServicePaymentData
  ): Promise<CheckoutSessionData> {
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          order_type: "service_payment",
          service_id: serviceData.service_id,
          appointment_id: serviceData.appointment_id,
          video_call_id: serviceData.video_call_id,
          mechanic_id: serviceData.mechanic_id,
          customer_id: serviceData.customer_id,
          amount: serviceData.amount,
          duration_minutes: serviceData.duration_minutes,
          service_type: serviceData.service_type,
          success_url: `${window.location.origin}/mechanic/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/mechanic/payment-cancelled`,
        },
      }
    );

    if (error) throw error;
    return data;
  }

  // Enhanced Payment Processing
  static async processCheckoutPayment(
    sessionId: string,
    orderType: "boost" | "part_purchase" | "service_payment"
  ): Promise<{ success: boolean; order_id?: string }> {
    const { data, error } = await supabase.functions.invoke(
      "process-checkout-payment",
      {
        body: { session_id: sessionId, order_type: orderType },
      }
    );

    if (error) throw error;
    return data;
  }

  // Stripe Connect Account Management
  static async createConnectAccount(
    mechanicId: string,
    mechanicData: {
      email: string;
      full_name: string;
      phone: string;
      business_type?: "individual" | "company";
    }
  ): Promise<{
    account_id: string;
    onboard_url: string;
    dashboard_url?: string;
  }> {
    const { data, error } = await supabase.functions.invoke(
      "create-connect-account",
      {
        body: {
          mechanic_id: mechanicId,
          email: mechanicData.email,
          full_name: mechanicData.full_name,
          phone: mechanicData.phone,
          business_type: mechanicData.business_type || "individual",
        },
      }
    );

    if (error) throw error;
    return data;
  }

  // Mechanic Payout Management
  static async scheduleMechanicPayout(
    mechanicId: string,
    invoiceIds: string[]
  ): Promise<{
    transfer_id: string;
    amount: number;
    expected_arrival: string;
  }> {
    const { data, error } = await supabase.functions.invoke("process-payout", {
      body: {
        mechanic_id: mechanicId,
        invoice_ids: invoiceIds,
      },
    });

    if (error) throw error;
    return data;
  }

  static async getMechanicPayouts(
    mechanicId: string
  ): Promise<MechanicPayout[]> {
    const { data, error } = await supabase
      .from("mechanic_payouts")
      .select("*")
      .eq("mechanic_id", mechanicId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getInvoicesByMechanic(mechanicId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("service_payments")
      .select("*")
      .eq("mechanic_id", mechanicId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Utility Methods
  static formatCurrency(
    amountInCents: number,
    currency: string = "USD"
  ): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amountInCents / 100);
  }

  static calculatePlatformFee(
    amount: number,
    feePercentage: number = 0.15
  ): number {
    return Math.round(amount * feePercentage);
  }

  static calculateMechanicPayout(
    amount: number,
    feePercentage: number = 0.15
  ): number {
    return amount - this.calculatePlatformFee(amount, feePercentage);
  }

  static async createConnectAccount(
    mechanicId: string,
    mechanicData: {
      email: string;
      full_name: string;
      phone: string;
      business_type?: "individual" | "company";
    }
  ): Promise<{ account_id: string; onboard_url: string }> {
    const { data, error } = await supabase.functions.invoke(
      "create-connect-account",
      {
        body: {
          mechanic_id: mechanicId,
          ...mechanicData,
        },
      }
    );

    if (error) throw error;
    return data;
  }

  static async generateInvoice(params: {
    appointment_id?: string;
    video_call_id?: string;
    mechanic_id: string;
    user_id: string;
    hourly_rate: number;
    duration_minutes: number;
    service_type: string;
    description: string;
    additional_items?: Omit<InvoiceLineItem, "id">[];
  }): Promise<Invoice> {
    const baseAmount = (params.hourly_rate / 60) * params.duration_minutes;
    const additionalAmount =
      params.additional_items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const subtotal = baseAmount + additionalAmount;
    const platformFeeAmount = subtotal * PLATFORM_FEE_PERCENTAGE;
    const mechanicPayoutAmount = subtotal - platformFeeAmount;
    const totalAmount = subtotal; // Customer pays full amount, platform fee deducted from mechanic payout

    const lineItems: InvoiceLineItem[] = [
      {
        id: crypto.randomUUID(),
        description: `${params.service_type} - ${params.duration_minutes} minutes`,
        quantity: 1,
        rate: baseAmount,
        amount: baseAmount,
      },
      ...(params.additional_items?.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      })) || []),
    ];

    const invoiceData = {
      appointment_id: params.appointment_id,
      video_call_id: params.video_call_id,
      mechanic_id: params.mechanic_id,
      user_id: params.user_id,
      amount: Math.round(totalAmount * 100), // Convert to cents
      hourly_rate: params.hourly_rate,
      duration_minutes: params.duration_minutes,
      service_type: params.service_type,
      status: "draft" as const,
      payment_status: "pending" as const,
      invoice_number: this.generateInvoiceNumber(),
      issued_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      description: params.description,
      line_items: lineItems,
      subtotal: Math.round(subtotal * 100),
      total_amount: Math.round(totalAmount * 100),
      mechanic_payout_amount: Math.round(mechanicPayoutAmount * 100),
      platform_fee_amount: Math.round(platformFeeAmount * 100),
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async payInvoice(
    invoiceId: string
  ): Promise<{ payment_intent: PaymentIntent; invoice: Invoice }> {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError) throw invoiceError;
    if (invoice.payment_status === "succeeded") {
      throw new Error("Invoice already paid");
    }

    // Create payment intent
    const paymentIntent = await this.createPaymentIntent(
      invoice.total_amount,
      "usd",
      {
        invoice_id: invoiceId,
        mechanic_id: invoice.mechanic_id,
        user_id: invoice.user_id,
      }
    );

    // Update invoice with payment intent
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "processing",
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { payment_intent: paymentIntent, invoice: updatedInvoice };
  }

  static async confirmPayment(paymentIntentId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("confirm-payment", {
      body: { payment_intent_id: paymentIntentId },
    });

    if (error) throw error;
  }

  static async processSuccessfulPayment(
    paymentIntentId: string
  ): Promise<void> {
    // Update invoice status
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .update({
        payment_status: "succeeded",
        status: "paid",
        paid_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntentId)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Schedule payout to mechanic
    await this.scheduleMechanicPayout(invoice.mechanic_id, [invoice.id]);
  }

  static async scheduleMechanicPayout(
    mechanicId: string,
    invoiceIds: string[]
  ): Promise<MechanicPayout> {
    // Get mechanic's Stripe account
    const { data: mechanic, error: mechanicError } = await supabase
      .from("mechanics")
      .select("stripe_account_id")
      .eq("id", mechanicId)
      .single();

    if (mechanicError) throw mechanicError;
    if (!mechanic.stripe_account_id) {
      throw new Error("Mechanic does not have a connected Stripe account");
    }

    // Calculate total payout amount
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("mechanic_payout_amount")
      .in("id", invoiceIds)
      .eq("payment_status", "succeeded");

    if (invoicesError) throw invoicesError;

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + inv.mechanic_payout_amount,
      0
    );

    const payoutData = {
      mechanic_id: mechanicId,
      stripe_account_id: mechanic.stripe_account_id,
      amount: totalAmount,
      currency: "usd",
      status: "pending" as const,
      invoice_ids: invoiceIds,
    };

    const { data: payout, error: payoutError } = await supabase
      .from("mechanic_payouts")
      .insert(payoutData)
      .select()
      .single();

    if (payoutError) throw payoutError;

    // Process the actual transfer via Stripe Connect
    await this.processStripePayout(payout.id);

    return payout;
  }

  static async processStripePayout(payoutId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("process-payout", {
      body: { payout_id: payoutId },
    });

    if (error) throw error;
  }

  static generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const timestamp = now.getTime().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }

  static async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        mechanic:mechanics(full_name, phone, location)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getInvoicesByMechanic(mechanicId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        user:profiles(full_name, avatar_url)
      `
      )
      .eq("mechanic_id", mechanicId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getMechanicPayouts(
    mechanicId: string
  ): Promise<MechanicPayout[]> {
    const { data, error } = await supabase
      .from("mechanic_payouts")
      .select("*")
      .eq("mechanic_id", mechanicId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static formatCurrency(amountInCents: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountInCents / 100);
  }
}

export default PaymentService;
