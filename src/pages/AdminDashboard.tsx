import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, AlertTriangle, Loader2, Wrench, Zap, Package, CheckCircle } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import KYCVerificationQueue from '../components/KYCVerificationQueue';
import MechanicRequestsQueue from '../components/MechanicRequestsQueue';
import useSWR from 'swr';
import { getDashboardStats } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { profile, isAdmin, isLoading: profileLoading } = useProfile();
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR('dashboard-stats', getDashboardStats);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const DashboardCard: React.FC<{
    title: string;
    description: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
  }> = ({ title, description, count, icon, color, loading }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`p-3 ${color} rounded-lg mb-4`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {description}
          </p>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {loading ? (
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          ) : (
            count
          )}
        </span>
      </div>
    </motion.div>
  );

  const loading = statsLoading && !stats && !statsError;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users, verify accounts, and monitor platform activity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="User Management"
            description="Total registered users on the platform"
            count={stats?.totalUsers || 0}
            icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            color="bg-blue-100 dark:bg-blue-900/50"
            loading={loading}
          />

          <DashboardCard
            title="KYC Verification Queue"
            description="Pending verification requests"
            count={stats?.pendingKyc || 0}
            icon={<ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />}
            color="bg-green-100 dark:bg-green-900/50"
            loading={loading}
          />

          <DashboardCard
            title="Mechanic Requests"
            description="Pending mechanic applications"
            count={stats?.pendingMechanics || 0}
            icon={<Wrench className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            color="bg-purple-100 dark:bg-purple-900/50"
            loading={loading}
          />

          <DashboardCard
            title="Reported Listings"
            description="Listings flagged for review"
            count={stats?.reportedParts || 0}
            icon={<AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            color="bg-amber-100 dark:bg-amber-900/50"
            loading={loading}
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Total Diagnostics"
            description="AI diagnostics run by users"
            count={stats?.totalDiagnoses || 0}
            icon={<Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            color="bg-blue-100 dark:bg-blue-900/50"
            loading={loading}
          />

          <DashboardCard
            title="Parts Listed"
            description="Total parts in the marketplace"
            count={stats?.totalPartsListed || 0}
            icon={<Package className="h-6 w-6 text-green-600 dark:text-green-400" />}
            color="bg-green-100 dark:bg-green-900/50"
            loading={loading}
          />

          <DashboardCard
            title="KYC Approved"
            description="Verifications approved this month"
            count={stats?.kycApprovedThisMonth || 0}
            icon={<CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            color="bg-purple-100 dark:bg-purple-900/50"
            loading={loading}
          />
        </div>

        {/* KYC Verification Queue Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                KYC Verification Queue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review and process pending KYC verification requests
              </p>
            </div>
          </div>
          <KYCVerificationQueue />
        </div>

        {/* Mechanic Requests Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Mechanic Requests
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review and approve mechanic applications
              </p>
            </div>
          </div>
          <MechanicRequestsQueue />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;