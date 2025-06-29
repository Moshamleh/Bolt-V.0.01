import React, { useState } from "react";
import { ShoppingCart, MapPin, CreditCard, Shield, Truck } from "lucide-react";
import { useStripePayments } from "../../hooks/useStripePayments";
import { PaymentService } from "../../lib/stripe";

interface PartPurchaseCheckoutProps {
  part: {
    id: string;
    title: string;
    price: number;
    images: string[];
    seller_id: string;
    location?: string;
    condition: string;
  };
  seller: {
    full_name: string;
    avatar_url?: string;
    rating?: number;
    reviews_count?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ShippingAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function PartPurchaseCheckout({
  part,
  seller,
  onSuccess,
  onCancel,
}: PartPurchaseCheckoutProps) {
  const { processPartPurchase, paymentState } = useStripePayments();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Calculate fees and totals
  const itemPrice = part.price;
  const shippingFee = 15.0 * 100; // $15 shipping in cents
  const platformFee = Math.round(itemPrice * 0.05); // 5% platform fee
  const totalAmount = itemPrice + shippingFee + platformFee;

  const handlePurchase = async () => {
    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    try {
      const result = await processPartPurchase({
        part_id: part.id,
        buyer_id: "", // Set in hook
        seller_id: part.seller_id,
        amount: totalAmount,
        shipping_address: shippingAddress,
      });

      if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    shippingAddress.name &&
    shippingAddress.address_line1 &&
    shippingAddress.city &&
    shippingAddress.state &&
    shippingAddress.postal_code &&
    agreedToTerms;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-3">
          <ShoppingCart className="h-8 w-8 text-blue-600" />
          <span>Complete Your Purchase</span>
        </h1>
        <p className="text-gray-600 mt-2">Secure checkout powered by Stripe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          {/* Item Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="flex space-x-4">
              <img
                src={part.images[0] || "/api/placeholder/100/100"}
                alt={part.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{part.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Condition: {part.condition}
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {PaymentService.formatCurrency(itemPrice)}
                </p>
              </div>
            </div>

            {/* Seller Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Sold by</h4>
              <div className="flex items-center space-x-3">
                <img
                  src={seller.avatar_url || "/api/placeholder/40/40"}
                  alt={seller.full_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {seller.full_name}
                  </p>
                  {seller.rating && (
                    <div className="flex items-center space-x-1">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(seller.rating))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({seller.reviews_count} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Shipping Address</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={shippingAddress.name}
                  onChange={(e) => handleAddressChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={shippingAddress.address_line1}
                  onChange={(e) =>
                    handleAddressChange("address_line1", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={shippingAddress.address_line2}
                  onChange={(e) =>
                    handleAddressChange("address_line2", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apt, Suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      handleAddressChange("state", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={shippingAddress.postal_code}
                  onChange={(e) =>
                    handleAddressChange("postal_code", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Price</span>
                <span className="font-medium">
                  {PaymentService.formatCurrency(itemPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {PaymentService.formatCurrency(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">
                  {PaymentService.formatCurrency(platformFee)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {PaymentService.formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Secure Purchase</span>
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Buyer protection guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Tracked shipping included</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 text-blue-600"
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePurchase}
                disabled={!isFormValid || paymentState.isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {paymentState.isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>
                      Complete Purchase -{" "}
                      {PaymentService.formatCurrency(totalAmount)}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={onCancel}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                disabled={paymentState.isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {paymentState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{paymentState.error}</p>
        </div>
      )}
    </div>
  );
}
