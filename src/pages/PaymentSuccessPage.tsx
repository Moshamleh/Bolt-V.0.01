import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Package,
  Zap,
  Wrench,
  ArrowRight,
  Home,
} from "lucide-react";
import { useCheckoutSuccess } from "../hooks/useStripePayments";
import { toast } from "react-hot-toast";

interface PaymentDetails {
  success: boolean;
  order_id?: string;
  part_id?: string;
  service_type?: string;
  amount?: number;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { processCheckoutSuccess, isProcessing } = useCheckoutSuccess();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get("session_id");
  const orderType = searchParams.get("order_type") as
    | "boost"
    | "part_purchase"
    | "service_payment";

  useEffect(() => {
    if (sessionId && orderType) {
      handlePaymentSuccess();
    } else {
      setIsLoading(false);
      toast.error("Invalid payment session");
    }
  }, [sessionId, orderType]);

  const handlePaymentSuccess = async () => {
    if (!sessionId || !orderType) return;

    try {
      setIsLoading(true);
      const result = await processCheckoutSuccess(sessionId, orderType);
      setPaymentDetails(result);
    } catch (error) {
      console.error("Error processing payment success:", error);
      toast.error("Failed to process payment. Please contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderTypeConfig = () => {
    switch (orderType) {
      case "boost":
        return {
          icon: Zap,
          title: "Listing Boosted Successfully!",
          description:
            "Your listing is now featured at the top of search results",
          actionText: "View My Listings",
          actionLink: "/marketplace/my-listings",
          color: "yellow",
        };
      case "part_purchase":
        return {
          icon: Package,
          title: "Purchase Confirmed!",
          description:
            "Your order has been placed and the seller has been notified",
          actionText: "Track My Orders",
          actionLink: "/marketplace/my-purchases",
          color: "blue",
        };
      case "service_payment":
        return {
          icon: Wrench,
          title: "Service Payment Complete!",
          description:
            "Payment has been processed and the mechanic has been notified",
          actionText: "View Service History",
          actionLink: "/services/history",
          color: "green",
        };
      default:
        return {
          icon: CheckCircle,
          title: "Payment Successful!",
          description: "Your payment has been processed successfully",
          actionText: "Continue",
          actionLink: "/",
          color: "green",
        };
    }
  };

  const config = getOrderTypeConfig();
  const IconComponent = config.icon;

  if (isLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Payment...
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  if (!paymentDetails?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Processing Error
          </h2>
          <p className="text-gray-600 mb-6">
            There was an issue processing your payment. Please contact support
            for assistance.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        {/* Success Icon */}
        <div
          className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${
            config.color === "yellow"
              ? "bg-yellow-100"
              : config.color === "blue"
              ? "bg-blue-100"
              : "bg-green-100"
          }`}
        >
          <IconComponent
            className={`h-10 w-10 ${
              config.color === "yellow"
                ? "text-yellow-600"
                : config.color === "blue"
                ? "text-blue-600"
                : "text-green-600"
            }`}
          />
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-gray-600 mb-4">{config.description}</p>

          {/* Order Details */}
          {paymentDetails.order_id && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono">
                    {paymentDetails.order_id.slice(0, 8)}...
                  </span>
                </div>
                {paymentDetails.service_type && (
                  <div className="flex justify-between">
                    <span>Service Type:</span>
                    <span className="capitalize">
                      {paymentDetails.service_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="space-y-4">
          {orderType === "boost" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Your listing is now featured at the top</li>
                <li>• Boost expires in 7 days</li>
                <li>• You'll get 3x more visibility</li>
                <li>• Check your listing performance anytime</li>
              </ul>
            </div>
          )}

          {orderType === "part_purchase" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Seller has been notified of your purchase</li>
                <li>• You'll receive shipping confirmation soon</li>
                <li>• Track your order in "My Purchases"</li>
                <li>• Leave a review after delivery</li>
              </ul>
            </div>
          )}

          {orderType === "service_payment" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Mechanic has been notified of payment</li>
                <li>• Service will be provided as scheduled</li>
                <li>• You can track progress in your dashboard</li>
                <li>• Rate your experience when complete</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(config.actionLink)}
              className={`w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center space-x-2 ${
                config.color === "yellow"
                  ? "bg-yellow-600"
                  : config.color === "blue"
                  ? "bg-blue-600"
                  : "bg-green-600"
              }`}
            >
              <span>{config.actionText}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </button>
          </div>
        </div>

        {/* Support Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact our{" "}
            <a href="/support" className="text-blue-600 hover:underline">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
