import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import MarketplaceLayout from './components/MarketplaceLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all page components
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'));
const VehicleManagementPage = lazy(() => import('./pages/VehicleManagementPage'));
const VehicleSetupPage = lazy(() => import('./pages/VehicleSetupPage'));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage'));
const ClubListPage = lazy(() => import('./pages/ClubListPage'));
const CreateClubPage = lazy(() => import('./pages/CreateClubPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const ListPartPage = lazy(() => import('./pages/ListPartPage'));
const PartDetailPage = lazy(() => import('./pages/PartDetailPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const MyChatsPage = lazy(() => import('./pages/MyChatsPage'));
const SavedPartsPage = lazy(() => import('./pages/SavedPartsPage'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage'));
const HelpFAQPage = lazy(() => import('./pages/HelpFAQPage'));
const AIDisclaimerPage = lazy(() => import('./pages/AIDisclaimerPage'));
const PartChatPage = lazy(() => import('./pages/PartChatPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'));
const AdminPartsManagement = lazy(() => import('./pages/AdminPartsManagement'));
const AdminReportedPartsPage = lazy(() => import('./pages/AdminReportedPartsPage'));
const AdminFeedbackPage = lazy(() => import('./pages/AdminFeedbackPage'));
const AdminAiFeedback = lazy(() => import('./pages/AdminAiFeedback'));
const AdminAiPerformancePage = lazy(() => import('./pages/AdminAiPerformancePage'));
const SellerKYC = lazy(() => import('./pages/kyc/SellerKYC'));
const KYCSuccessPage = lazy(() => import('./pages/kyc/KYCSuccessPage'));
const MechanicSupportPage = lazy(() => import('./pages/MechanicSupportPage'));
const MechanicChatPage = lazy(() => import('./pages/MechanicChatPage'));
const MechanicSettingsPage = lazy(() => import('./pages/MechanicSettingsPage'));
const MechanicProfilePage = lazy(() => import('./pages/MechanicProfilePage'));
const BoltFixes = lazy(() => import('./components/BoltFixes'));
const AddServiceRecordPage = lazy(() => import('./pages/AddServiceRecordPage'));
const ServiceHistoryPage = lazy(() => import('./pages/ServiceHistoryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token has been refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log application-level errors
    console.error('Application Error:', error, errorInfo);
    
    // In production, send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  return (
    <ErrorBoundary onError={handleAppError}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Setup routes */}
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route path="/vehicle-setup" element={<VehicleSetupPage />} />

          {/* Main app routes */}
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/vehicles" replace />} />
            <Route path="/vehicles" element={<VehicleManagementPage />} />
            <Route path="/vehicles/:vehicleId/add-service" element={<AddServiceRecordPage />} />
            <Route path="/vehicles/:vehicleId/service-history" element={<ServiceHistoryPage />} />
            <Route path="/diagnostic" element={<DiagnosticPage />} />
            <Route path="/mechanic-support" element={<MechanicSupportPage />} />
            <Route path="/mechanic-support/chat/:mechanicId" element={<MechanicChatPage />} />
            <Route path="/mechanic/settings" element={<MechanicSettingsPage />} />
            <Route path="/mechanic/:id" element={<MechanicProfilePage />} />
            <Route path="/clubs" element={<ClubListPage />} />
            <Route path="/clubs/create" element={<CreateClubPage />} />
            <Route path="/clubs/:id" element={<ClubDetailPage />} />
            <Route path="/bolt-fixes" element={<BoltFixes />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Marketplace Routes */}
            <Route path="/marketplace" element={<MarketplaceLayout />}>
              <Route index element={<MarketplacePage />} />
              <Route path="my-listings" element={<MyListingsPage />} />
              <Route path="messages" element={<MyChatsPage />} />
              <Route path="messages/:chatId" element={<PartChatPage />} />
              <Route path="saved" element={<SavedPartsPage />} />
              <Route path="seller-dashboard" element={<SellerDashboardPage />} />
            </Route>

            <Route path="/sell-part" element={<ListPartPage />} />
            <Route path="/parts/:id" element={<PartDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/help" element={<HelpFAQPage />} />
            <Route path="/ai-safety" element={<AIDisclaimerPage />} />
            <Route path="/kyc" element={<SellerKYC />} />
            <Route path="/kyc/success" element={<KYCSuccessPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/parts" element={<AdminPartsManagement />} />
            <Route path="/admin/reported-parts" element={<AdminReportedPartsPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            <Route path="/admin/ai-feedback" element={<AdminAiFeedback />} />
            <Route path="/admin/ai-performance" element={<AdminAiPerformancePage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;