import React, { useState, useEffect } from "react";
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  DollarSign,
  Shield,
} from "lucide-react";
import { useStripeConnect } from "../../hooks/useStripePayments";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

interface StripeConnectSetupProps {
  mechanicId: string;
  mechanicData: {
    full_name: string;
    email: string;
    phone: string;
  };
  onComplete?: () => void;
}

interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  isVerified: boolean;
  requiresAction: boolean;
  actionUrl?: string;
}

export default function StripeConnectSetup({
  mechanicId,
  mechanicData,
  onComplete,
}: StripeConnectSetupProps) {
  const { createConnectAccount, isCreating } = useStripeConnect();
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus>({
    hasAccount: false,
    isVerified: false,
    requiresAction: false,
  });
  const [businessType, setBusinessType] = useState<"individual" | "company">(
    "individual"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccountStatus();
  }, [mechanicId]);

  const checkAccountStatus = async () => {
    try {
      setIsLoading(true);

      const { data: mechanic, error } = await supabase
        .from("mechanics")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("id", mechanicId)
        .single();

      if (error) throw error;

      if (mechanic.stripe_account_id) {
        setAccountStatus({
          hasAccount: true,
          accountId: mechanic.stripe_account_id,
          isVerified: mechanic.stripe_onboarding_complete || false,
          requiresAction: !mechanic.stripe_onboarding_complete,
        });
      }
    } catch (error) {
      console.error("Error checking account status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      await createConnectAccount(mechanicId, {
        ...mechanicData,
        business_type: businessType,
      });

      // Check status after creation
      setTimeout(() => {
        checkAccountStatus();
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error("Error creating Stripe account:", error);
    }
  };

  const generateDashboardLink = async () => {
    if (!accountStatus.accountId) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-account-link",
        {
          body: {
            account_id: accountStatus.accountId,
            type: "account_onboarding",
          },
        }
      );

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error generating dashboard link:", error);
      toast.error("Failed to open Stripe dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Payment Setup</h2>
            <p className="text-blue-100">
              Connect your bank account to receive payments
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Account Status */}
        {accountStatus.hasAccount ? (
          <div className="space-y-4">
            {accountStatus.isVerified ? (
              // Verified Account
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Payment Setup Complete!
                    </h3>
                    <p className="text-sm text-green-700">
                      Your Stripe account is fully set up and verified. You can
                      now receive payments.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Ready to Earn</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Start accepting service payments and boost orders
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Secure Payouts</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Automatic transfers to your bank account
                    </p>
                  </div>
                </div>

                <button
                  onClick={generateDashboardLink}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Manage Account</span>
                </button>
              </div>
            ) : (
              // Account Requires Action
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      Action Required
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Your Stripe account needs additional information to start
                      receiving payments.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Required Steps:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Verify your identity documents</li>
                      <li>• Add bank account information</li>
                      <li>• Confirm business details</li>
                    </ul>
                  </div>

                  <button
                    onClick={generateDashboardLink}
                    className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>Complete Setup</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // No Account - Setup Form
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Your Payment Account
              </h3>
              <p className="text-gray-600">
                We use Stripe to securely process payments and send money to
                your bank account. This process is free and takes just a few
                minutes.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Fast Payouts</h4>
                <p className="text-sm text-blue-700">
                  Receive your earnings within 2-3 business days
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Secure & Trusted
                </h4>
                <p className="text-sm text-green-700">
                  Bank-level security with fraud protection
                </p>
              </div>
            </div>

            {/* Business Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    businessType === "individual"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="individual"
                    checked={businessType === "individual"}
                    onChange={(e) =>
                      setBusinessType(e.target.value as "individual")
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        businessType === "individual"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {businessType === "individual" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Individual</p>
                      <p className="text-sm text-gray-600">
                        Personal mechanic account
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    businessType === "company"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="company"
                    checked={businessType === "company"}
                    onChange={(e) =>
                      setBusinessType(e.target.value as "company")
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        businessType === "company"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {businessType === "company" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Business</p>
                      <p className="text-sm text-gray-600">
                        Registered business or shop
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Account Info Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Account Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{mechanicData.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{mechanicData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{mechanicData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{businessType}</span>
                </div>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              onClick={handleCreateAccount}
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>Create Stripe Account</span>
                </>
              )}
            </button>

            {/* Disclaimer */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <p>
                By clicking "Create Stripe Account", you agree to Stripe's{" "}
                <a
                  href="https://stripe.com/ssa"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Services Agreement
                </a>{" "}
                and acknowledge that BOLT Auto will share your information with
                Stripe in accordance with our{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
