import { useState, useCallback } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import {
  PaymentService,
  BoostOrderData,
  PartPurchaseData,
  ServicePaymentData,
} from "../lib/stripe";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  isSuccess: boolean;
}

export interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export function useStripePayments() {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    isSuccess: false,
  });

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      error: null,
      isSuccess: false,
    });
  }, []);

  // Process boost order payment
  const processBoostPayment = useCallback(
    async (boostData: BoostOrderData): Promise<CheckoutResult> => {
      if (!user) {
        const error = "User must be authenticated";
        setPaymentState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setPaymentState({ isProcessing: true, error: null, isSuccess: false });

      try {
        const { sessionId, url } =
          await PaymentService.createBoostOrderCheckout({
            ...boostData,
            user_id: user.id,
          });

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
          return { success: true, sessionId };
        }

        throw new Error("No checkout URL received");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";
        setPaymentState({
          isProcessing: false,
          error: errorMessage,
          isSuccess: false,
        });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [user]
  );

  // Process part purchase payment
  const processPartPurchase = useCallback(
    async (purchaseData: PartPurchaseData): Promise<CheckoutResult> => {
      if (!user) {
        const error = "User must be authenticated";
        setPaymentState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setPaymentState({ isProcessing: true, error: null, isSuccess: false });

      try {
        const { sessionId, url } =
          await PaymentService.createPartPurchaseCheckout({
            ...purchaseData,
            buyer_id: user.id,
          });

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
          return { success: true, sessionId };
        }

        throw new Error("No checkout URL received");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";
        setPaymentState({
          isProcessing: false,
          error: errorMessage,
          isSuccess: false,
        });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [user]
  );

  // Process service payment
  const processServicePayment = useCallback(
    async (serviceData: ServicePaymentData): Promise<CheckoutResult> => {
      if (!user) {
        const error = "User must be authenticated";
        setPaymentState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setPaymentState({ isProcessing: true, error: null, isSuccess: false });

      try {
        const { sessionId, url } =
          await PaymentService.createServicePaymentCheckout({
            ...serviceData,
            customer_id: user.id,
          });

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
          return { success: true, sessionId };
        }

        throw new Error("No checkout URL received");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";
        setPaymentState({
          isProcessing: false,
          error: errorMessage,
          isSuccess: false,
        });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [user]
  );

  // Process card payment for immediate charge (not checkout)
  const processCardPayment = useCallback(
    async (
      amount: number,
      metadata: Record<string, string> = {}
    ): Promise<CheckoutResult> => {
      if (!stripe || !elements || !user) {
        const error = "Stripe not initialized or user not authenticated";
        setPaymentState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        const error = "Card element not found";
        setPaymentState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setPaymentState({ isProcessing: true, error: null, isSuccess: false });

      try {
        // Create payment intent
        const paymentIntent = await PaymentService.createPaymentIntent(
          amount,
          "usd",
          { user_id: user.id, ...metadata }
        );

        // Confirm payment
        const { error: stripeError, paymentIntent: confirmedPayment } =
          await stripe.confirmCardPayment(paymentIntent.client_secret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                email: user.email,
              },
            },
          });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (confirmedPayment?.status === "succeeded") {
          setPaymentState({
            isProcessing: false,
            error: null,
            isSuccess: true,
          });
          toast.success("Payment successful!");
          return { success: true, sessionId: confirmedPayment.id };
        }

        throw new Error("Payment was not completed");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";
        setPaymentState({
          isProcessing: false,
          error: errorMessage,
          isSuccess: false,
        });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [stripe, elements, user]
  );

  return {
    paymentState,
    resetPaymentState,
    processBoostPayment,
    processPartPurchase,
    processServicePayment,
    processCardPayment,
    isStripeReady: !!stripe && !!elements,
  };
}

// Hook for processing checkout success
export function useCheckoutSuccess() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processCheckoutSuccess = useCallback(
    async (
      sessionId: string,
      orderType: "boost" | "part_purchase" | "service_payment"
    ) => {
      setIsProcessing(true);

      try {
        const result = await PaymentService.processCheckoutPayment(
          sessionId,
          orderType
        );

        if (result.success) {
          toast.success("Payment processed successfully!");
          return result;
        }

        throw new Error("Failed to process payment");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Processing failed";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    processCheckoutSuccess,
    isProcessing,
  };
}

// Hook for managing Stripe Connect accounts
export function useStripeConnect() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createConnectAccount = useCallback(
    async (
      mechanicId: string,
      mechanicData: {
        email: string;
        full_name: string;
        phone: string;
        business_type?: "individual" | "company";
      }
    ) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }

      setIsCreating(true);

      try {
        const result = await PaymentService.createConnectAccount(
          mechanicId,
          mechanicData
        );

        toast.success("Stripe account created! Complete your onboarding.");

        // Redirect to Stripe onboarding
        if (result.onboard_url) {
          window.location.href = result.onboard_url;
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create account";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [user]
  );

  return {
    createConnectAccount,
    isCreating,
  };
}

export default useStripePayments;
