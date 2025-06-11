import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import DiagnosticPage from './pages/DiagnosticPage';
import LoginPage from './pages/LoginPage';
import VehicleManagementPage from './pages/VehicleManagementPage';
import VehicleSetupPage from './pages/VehicleSetupPage';
import ClubDetailPage from './pages/ClubDetailPage';
import ClubListPage from './pages/ClubListPage';
import CreateClubPage from './pages/CreateClubPage';
import MarketplacePage from './pages/MarketplacePage';
import ListPartPage from './pages/ListPartPage';
import PartDetailPage from './pages/PartDetailPage';
import AccountPage from './pages/AccountPage';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import MarketplaceLayout from './components/MarketplaceLayout';
import MyListingsPage from './pages/MyListingsPage';
import MyChatsPage from './pages/MyChatsPage';
import SavedPartsPage from './pages/SavedPartsPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import HelpFAQPage from './pages/HelpFAQPage';
import AIDisclaimerPage from './pages/AIDisclaimerPage';
import PartChatPage from './pages/PartChatPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
import AdminAiFeedback from './pages/AdminAiFeedback';
import AdminAiPerformancePage from './pages/AdminAiPerformancePage';
import SellerKYC from './pages/kyc/SellerKYC';
import MechanicSupportPage from './pages/MechanicSupportPage';
import MechanicChatPage from './pages/MechanicChatPage';
import MechanicSettingsPage from './pages/MechanicSettingsPage';
import MechanicProfilePage from './pages/MechanicProfilePage';
<<<<<<< HEAD
import BoltFixes from './components/BoltFixes';
=======
>>>>>>> 261cd55a3f4ba1db30df60f77a435fb7f277d55c

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

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Main app routes */}
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/vehicles\" replace />} />
        <Route path="/vehicles" element={<VehicleManagementPage />} />
        <Route path="/vehicle-setup" element={<VehicleSetupPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/mechanic-support" element={<MechanicSupportPage />} />
        <Route path="/mechanic-support/chat/:mechanicId" element={<MechanicChatPage />} />
        <Route path="/mechanic/settings" element={<MechanicSettingsPage />} />
        <Route path="/mechanic/:id" element={<MechanicProfilePage />} />
        <Route path="/clubs" element={<ClubListPage />} />
        <Route path="/clubs/create" element={<CreateClubPage />} />
        <Route path="/clubs/:id" element={<ClubDetailPage />} />
<<<<<<< HEAD
        <Route path="/bolt-fixes" element={<BoltFixes />} />
=======
        
>>>>>>> 261cd55a3f4ba1db30df60f77a435fb7f277d55c
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
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUserManagement />} />
        <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
        <Route path="/admin/ai-feedback" element={<AdminAiFeedback />} />
        <Route path="/admin/ai-performance" element={<AdminAiPerformancePage />} />
      </Route>
    </Routes>
  );
}

export default App;