import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { PaymentService, MechanicPayout, Invoice } from "../../lib/stripe";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

interface PayoutDashboardProps {
  mechanicId: string;
}

export default function MechanicPayoutDashboard({
  mechanicId,
}: PayoutDashboardProps) {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<MechanicPayout[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);

  useEffect(() => {
    loadPayoutData();
    checkStripeConnection();
  }, [mechanicId]);

  const loadPayoutData = async () => {
    try {
      setIsLoading(true);

      // Load payouts
      const payoutData = await PaymentService.getMechanicPayouts(mechanicId);
      setPayouts(payoutData);

      // Load pending invoices
      const invoiceData = await PaymentService.getInvoicesByMechanic(
        mechanicId
      );
      const pending = invoiceData.filter(
        (inv) => inv.payment_status === "succeeded" && !inv.paid_date
      );
      setPendingInvoices(pending);

      // Calculate totals
      const total = payoutData.reduce((sum, payout) => sum + payout.amount, 0);
      setTotalEarnings(total);

      const available = pending.reduce(
        (sum, inv) => sum + inv.mechanic_payout_amount,
        0
      );
      setAvailableBalance(available);
    } catch (error) {
      console.error("Error loading payout data:", error);
      toast.error("Failed to load payout data");
    } finally {
      setIsLoading(false);
    }
  };

  const checkStripeConnection = async () => {
    try {
      const { data: mechanic, error } = await supabase
        .from("mechanics")
        .select("stripe_account_id")
        .eq("id", mechanicId)
        .single();

      if (error) throw error;
      setStripeConnected(!!mechanic.stripe_account_id);
    } catch (error) {
      console.error("Error checking Stripe connection:", error);
    }
  };

  const requestPayout = async () => {
    if (availableBalance <= 0) {
      toast.error("No funds available for payout");
      return;
    }

    if (!stripeConnected) {
      toast.error("Please connect your Stripe account first");
      return;
    }

    setIsProcessingPayout(true);

    try {
      const invoiceIds = pendingInvoices.map((inv) => inv.id);
      await PaymentService.scheduleMechanicPayout(mechanicId, invoiceIds);

      toast.success(
        "Payout request submitted! Funds will be transferred within 2-3 business days."
      );

      // Reload data
      await loadPayoutData();
    } catch (error) {
      console.error("Error requesting payout:", error);
      toast.error("Failed to request payout");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <span>Earnings & Payouts</span>
        </h2>
        <p className="text-gray-600 mt-1">
          Manage your earnings and request payouts
        </p>
      </div>

      {/* Stripe Connection Warning */}
      {!stripeConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Connect Your Bank Account
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need to connect your Stripe account to receive payouts.
              </p>
              <button className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                Connect Stripe Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Earnings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {PaymentService.formatCurrency(totalEarnings)}
              </p>
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
                Available Balance
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {PaymentService.formatCurrency(availableBalance)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingInvoices.length} pending invoice(s)
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Payouts
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {payouts.filter((p) => p.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Request Payout Section */}
      {availableBalance > 0 && stripeConnected && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Request Payout
          </h3>
          <p className="text-gray-600 mb-4">
            You have {PaymentService.formatCurrency(availableBalance)} available
            for payout. Funds typically arrive within 2-3 business days.
          </p>
          <button
            onClick={requestPayout}
            disabled={isProcessingPayout}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isProcessingPayout ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>
                  Request Payout -{" "}
                  {PaymentService.formatCurrency(availableBalance)}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Payout History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Payout History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No payouts yet. Complete some services to start earning!
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {PaymentService.formatCurrency(payout.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          payout.status
                        )}`}
                      >
                        {getStatusIcon(payout.status)}
                        <span className="ml-1 capitalize">{payout.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.transfer_id || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Earnings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              These earnings will be included in your next payout request
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Earnings
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.service_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.issued_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {PaymentService.formatCurrency(
                        invoice.mechanic_payout_amount
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
