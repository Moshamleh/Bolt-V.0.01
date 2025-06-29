import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, ArrowLeft, Home, RotateCcw } from "lucide-react";

export default function PaymentCancelledPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderType = searchParams.get("order_type");
  const returnPath = searchParams.get("return_path");

  const getOrderTypeConfig = () => {
    switch (orderType) {
      case "boost":
        return {
          title: "Boost Payment Cancelled",
          description:
            "Your listing boost payment was cancelled. You can try again anytime.",
          returnText: "Back to My Listings",
          returnLink: returnPath || "/marketplace/my-listings",
          retryText: "Try Boost Again",
        };
      case "part_purchase":
        return {
          title: "Purchase Cancelled",
          description:
            "Your part purchase was cancelled. The item is still available.",
          returnText: "Back to Marketplace",
          returnLink: returnPath || "/marketplace",
          retryText: "Continue Shopping",
        };
      case "service_payment":
        return {
          title: "Service Payment Cancelled",
          description:
            "Your service payment was cancelled. You can reschedule or try again.",
          returnText: "Back to Services",
          returnLink: returnPath || "/mechanic-support",
          retryText: "Find Services",
        };
      default:
        return {
          title: "Payment Cancelled",
          description:
            "Your payment was cancelled. No charges were made to your account.",
          returnText: "Continue",
          returnLink: returnPath || "/",
          retryText: "Try Again",
        };
    }
  };

  const config = getOrderTypeConfig();

  const handleRetry = () => {
    // Go back to the previous page or the return path
    if (returnPath) {
      navigate(returnPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Cancelled Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>

        {/* Cancellation Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-gray-600">{config.description}</p>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happened?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Payment was cancelled by user</li>
            <li>• No charges were made</li>
            <li>• You can try again anytime</li>
            <li>• Your data is safe and secure</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{config.retryText}</span>
          </button>

          <button
            onClick={() => navigate(config.returnLink)}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{config.returnText}</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </button>
        </div>

        {/* Support Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Having trouble? Contact our{" "}
            <a href="/support" className="text-blue-600 hover:underline">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
