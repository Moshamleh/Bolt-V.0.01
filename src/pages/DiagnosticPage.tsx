import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Car, Loader2 } from 'lucide-react';
import { Vehicle, getUserVehicles, getUserDiagnoses, Diagnosis } from '../lib/supabase';
import { useOnboarding } from '../hooks/useOnboarding';
import WelcomeModal from '../components/WelcomeModal';

// Lazy load components
const ChatInterface = lazy(() => import('../components/ChatInterface'));
const MobileTopNavBar = lazy(() => import('../components/MobileTopNavBar'));
const MobileCollapsibleMenu = lazy(() => import('../components/MobileCollapsibleMenu'));

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
  </div>
);

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isError?: boolean;
  timestamp: Date;
  originalPrompt?: string;
  isTypingIndicator?: boolean;
  diagnosisId?: string;
  hasFeedback?: boolean;
}

const DiagnosticPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [activeDiagnosisId, setActiveDiagnosisId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const { showOnboarding, completeOnboarding, isInitialized } = useOnboarding();

  useEffect(() => {
    // Show welcome modal for new users when onboarding is initialized
    if (isInitialized && showOnboarding) {
      setShowWelcomeModal(true);
    }
  }, [isInitialized, showOnboarding]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehicles = await getUserVehicles();
        setVehicles(vehicles);
        if (vehicles.length > 0) {
          setSelectedVehicleId(vehicles[0].id);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  useEffect(() => {
    const loadDiagnoses = async () => {
      if (!selectedVehicleId) return;
      
      try {
        const data = await getUserDiagnoses(selectedVehicleId);
        setDiagnoses(data);

        // Initialize chat with most recent diagnosis if available
        if (data.length > 0) {
          const mostRecent = data[data.length - 1];
          const messages: ChatMessage[] = [
            {
              id: `user-${mostRecent.id}`,
              text: mostRecent.prompt,
              isUser: true,
              timestamp: new Date(mostRecent.timestamp),
              diagnosisId: mostRecent.id
            },
            {
              id: `ai-${mostRecent.id}`,
              text: mostRecent.response,
              isUser: false,
              timestamp: new Date(mostRecent.timestamp),
              diagnosisId: mostRecent.id
            }
          ];
          setActiveChatMessages(messages);
          setActiveDiagnosisId(mostRecent.id);
        } else {
          setActiveChatMessages([]);
          setActiveDiagnosisId(null);
        }
      } catch (err) {
        console.error('Failed to load diagnoses:', err);
        setError('Failed to load diagnostic history');
      }
    };

    loadDiagnoses();
  }, [selectedVehicleId]);

  const handleDiagnosisAdded = (diagnosis: Diagnosis) => {
    setDiagnoses(prev => [...prev, diagnosis]);
  };

  const handleDiagnosisStatusChange = (diagnosisId: string, resolved: boolean) => {
    setDiagnoses(prev => prev.map(d => 
      d.id === diagnosisId ? { ...d, resolved } : d
    ));
  };

  const handleLoadDiagnosis = (diagnosis: Diagnosis) => {
    const diagnosisMessages: ChatMessage[] = [
      {
        id: `user-${diagnosis.id}`,
        text: diagnosis.prompt,
        isUser: true,
        timestamp: new Date(diagnosis.timestamp),
        diagnosisId: diagnosis.id
      },
      {
        id: `ai-${diagnosis.id}`,
        text: diagnosis.response,
        isUser: false,
        timestamp: new Date(diagnosis.timestamp),
        diagnosisId: diagnosis.id
      }
    ];
    setActiveChatMessages(diagnosisMessages);
    setActiveDiagnosisId(diagnosis.id);
    setIsMenuOpen(false);
  };

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    // The tour will automatically start since showOnboarding is true
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-100 dark:bg-gray-900 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-gray-400">Loading your vehicles...</p>
        </div>
      </div>
    );
  }

  if (!selectedVehicleId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Car className="h-16 w-16 text-neutral-400 dark:text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          No Vehicle Selected
        </h2>
        <p className="text-neutral-600 dark:text-gray-400 mb-6 max-w-md">
          Please add a vehicle to your profile to start getting diagnostic assistance
        </p>
        <button
          onClick={() => window.location.href = '/vehicle-setup'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Add Vehicle
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900">
      <Suspense fallback={<ComponentLoader />}>
        <MobileTopNavBar
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleChange={setSelectedVehicleId}
          onMenuToggle={() => setIsMenuOpen(true)}
        />
      </Suspense>

      <Suspense fallback={<ComponentLoader />}>
        <MobileCollapsibleMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          diagnoses={diagnoses}
          loading={loading}
          error={error}
          onStatusChange={handleDiagnosisStatusChange}
          onLoadDiagnosis={handleLoadDiagnosis}
        />
      </Suspense>

      <div className="pt-[104px] pb-[64px] h-screen">
        <Suspense fallback={<ComponentLoader />}>
          <ChatInterface 
            selectedVehicleId={selectedVehicleId}
            onDiagnosisAdded={handleDiagnosisAdded}
            messages={activeChatMessages}
            setMessages={setActiveChatMessages}
            activeDiagnosisId={activeDiagnosisId}
            setActiveDiagnosisId={setActiveDiagnosisId}
          />
        </Suspense>
      </div>

      {/* Welcome Modal for new users */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => {
          setShowWelcomeModal(false);
          completeOnboarding();
        }}
        onStartTour={handleStartTour}
      />
    </div>
  );
};

export default DiagnosticPage;