import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Settings,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import StripeConnectSetup from "./StripeConnectSetup";
import MechanicPayoutDashboard from "./MechanicPayoutDashboard";
import { toast } from "react-hot-toast";

interface MechanicData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
}

export default function PaymentDashboard() {
  const { user } = useAuth();
  const [mechanicData, setMechanicData] = useState<MechanicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"setup" | "earnings">("setup");

  useEffect(() => {
    if (user) {
      loadMechanicData();
    }
  }, [user]);

  const loadMechanicData = async () => {
    try {
      setIsLoading(true);

      // Get mechanic data
      const { data: mechanic, error: mechanicError } = await supabase
        .from("mechanics")
        .select(
          "id, full_name, email, phone, stripe_account_id, stripe_onboarding_complete"
        )
        .eq("user_id", user?.id)
        .single();

      if (mechanicError) {
        // If no mechanic record, get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user?.id)
          .single();

        if (profileError) throw profileError;

        // Create mechanic record
        const { data: newMechanic, error: createError } = await supabase
          .from("mechanics")
          .insert({
            user_id: user?.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: "",
            status: "pending",
          })
          .select()
          .single();

        if (createError) throw createError;

        setMechanicData(newMechanic);
      } else {
        setMechanicData(mechanic);

        // Determine which tab to show
        if (mechanic.stripe_account_id && mechanic.stripe_onboarding_complete) {
          setActiveTab("earnings");
        }
      }
    } catch (error) {
      console.error("Error loading mechanic data:", error);
      toast.error("Failed to load payment information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = () => {
    loadMechanicData();
    setActiveTab("earnings");
    toast.success("Payment setup completed successfully!");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mechanicData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Setup Unavailable
        </h2>
        <p className="text-gray-600">
          Unable to load payment information. Please contact support.
        </p>
      </div>
    );
  }

  const isSetupComplete =
    mechanicData.stripe_account_id && mechanicData.stripe_onboarding_complete;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payment Center
              </h1>
              <p className="text-gray-600">
                Manage your earnings and payment settings
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isSetupComplete
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isSetupComplete ? "Setup Complete" : "Setup Required"}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("setup")}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === "setup"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Payment Setup</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("earnings")}
            disabled={!isSetupComplete}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === "earnings"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            } ${!isSetupComplete ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Earnings & Payouts</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "setup" && (
            <StripeConnectSetup
              mechanicId={mechanicData.id}
              mechanicData={{
                full_name: mechanicData.full_name,
                email: mechanicData.email,
                phone: mechanicData.phone || "",
              }}
              onComplete={handleSetupComplete}
            />
          )}

          {activeTab === "earnings" && isSetupComplete && (
            <MechanicPayoutDashboard mechanicId={mechanicData.id} />
          )}

          {activeTab === "earnings" && !isSetupComplete && (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete Payment Setup First
              </h3>
              <p className="text-gray-600 mb-6">
                You need to set up your payment account before you can view
                earnings and request payouts.
              </p>
              <button
                onClick={() => setActiveTab("setup")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats (when setup complete) */}
      {isSetupComplete && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">$0.00</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Services Completed
                </p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
