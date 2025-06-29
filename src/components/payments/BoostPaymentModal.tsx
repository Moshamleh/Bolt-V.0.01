import React, { useState } from "react";
import { X, Zap, TrendingUp, Eye, Clock } from "lucide-react";
import { useStripePayments } from "../../hooks/useStripePayments";
import { PaymentService } from "../../lib/stripe";

interface BoostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  partTitle: string;
  partPrice: number;
  onSuccess?: () => void;
}

const BOOST_PLANS = [
  {
    id: "boost_7_days",
    name: "7-Day Boost",
    duration: 7,
    price: 299, // $2.99
    description: "Premium placement for one week",
    features: [
      "Top of search results",
      "Featured badge",
      "3x more visibility",
      "Priority in categories",
    ],
    popular: true,
  },
  {
    id: "boost_14_days",
    name: "14-Day Boost",
    duration: 14,
    price: 499, // $4.99
    description: "Extended premium placement",
    features: [
      "Top of search results",
      "Featured badge",
      "3x more visibility",
      "Priority in categories",
      "Best value",
    ],
    popular: false,
  },
  {
    id: "boost_30_days",
    name: "30-Day Boost",
    duration: 30,
    price: 899, // $8.99
    description: "Maximum exposure period",
    features: [
      "Top of search results",
      "Featured badge",
      "3x more visibility",
      "Priority in categories",
      "Maximum exposure",
    ],
    popular: false,
  },
];

export default function BoostPaymentModal({
  isOpen,
  onClose,
  partId,
  partTitle,
  partPrice,
  onSuccess,
}: BoostPaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(BOOST_PLANS[0]);
  const { processBoostPayment, paymentState } = useStripePayments();

  if (!isOpen) return null;

  const handlePurchaseBoost = async () => {
    try {
      // First create the boost order in the database
      const { data: boostOrder, error } = await supabase
        .from("boost_orders")
        .insert({
          part_id: partId,
          duration_days: selectedPlan.duration,
          amount: selectedPlan.price,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Process payment
      const result = await processBoostPayment({
        part_id: partId,
        user_id: "", // Will be set in the hook
        amount: selectedPlan.price,
        duration_days: selectedPlan.duration,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Boost purchase failed:", error);
    }
  };

  const potentialViews = Math.round(partPrice * 0.1); // Rough estimate based on price

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Boost Your Listing
              </h2>
              <p className="text-sm text-gray-600">
                Get more visibility and sell faster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Listing Info */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-medium text-gray-900 mb-2">Boosting:</h3>
          <p className="text-lg font-semibold text-blue-600">{partTitle}</p>
          <p className="text-gray-600">
            {PaymentService.formatCurrency(partPrice)}
          </p>
        </div>

        {/* Benefits Section */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4">
            Why boost your listing?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">3x More Views</p>
                <p className="text-sm text-gray-600">Increased visibility</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Featured Badge</p>
                <p className="text-sm text-gray-600">Stand out from crowd</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Sell Faster</p>
                <p className="text-sm text-gray-600">Quick transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Boost Plans */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Choose your boost duration:
          </h3>
          <div className="space-y-3">
            {BOOST_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan.id === plan.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${plan.popular ? "ring-2 ring-yellow-400" : ""}`}
                onClick={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-4 bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={selectedPlan.id === plan.id}
                      onChange={() => setSelectedPlan(plan)}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-600">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {PaymentService.formatCurrency(plan.price)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {PaymentService.formatCurrency(
                        Math.round(plan.price / plan.duration)
                      )}
                      /day
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Impact */}
        <div className="p-6 bg-green-50 border-b">
          <h4 className="font-medium text-green-900 mb-2">Estimated Impact</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-700">Expected additional views:</p>
              <p className="font-semibold text-green-900">
                +{potentialViews * 3} views
              </p>
            </div>
            <div>
              <p className="text-green-700">Increased sale probability:</p>
              <p className="font-semibold text-green-900">+75%</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>
              💡 Pro tip: Boost during peak hours (6-9 PM) for maximum impact
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={paymentState.isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchaseBoost}
              disabled={paymentState.isProcessing}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {paymentState.isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>
                    Boost for{" "}
                    {PaymentService.formatCurrency(selectedPlan.price)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
