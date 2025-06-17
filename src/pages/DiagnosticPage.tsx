import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Car, Loader2, Lightbulb, Menu, History, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, getUserVehicles, getUserDiagnoses, Diagnosis } from '../lib/supabase';
import { useOnboarding } from '../hooks/useOnboarding';
import WelcomeModal from '../components/WelcomeModal';

// Lazy load components
const ChatInterface = lazy(() => import('../components/ChatInterface'));
const MobileTopNavBar = lazy(() => import('../components/MobileTopNavBar'));
const MobilePageMenu = lazy(() => import('../components/MobilePageMenu'));
const ChatHistory = lazy(() => import('../components/ChatHistory'));
const RepairTipsPanel = lazy(() => import('../components/RepairTipsPanel'));

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
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [activeDiagnosisId, setActiveDiagnosisId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showRepairTips, setShowRepairTips] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const desktopHistoryRef = useRef<HTMLDivElement>(null);
  
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
          const mostRecent = data[0];
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

  useEffect(() => {
    // Generate suggested prompts based on selected vehicle
    if (selectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        const vehicleInfo = vehicle.other_vehicle_description || 
          `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
        
        setSuggestedPrompts([
          `Why is my ${vehicleInfo} making a grinding noise when braking?`,
          `My ${vehicleInfo} won't start. What could be wrong?`,
          `What's causing the check engine light on my ${vehicleInfo}?`,
          `How often should I change the oil in my ${vehicleInfo}?`,
          `My ${vehicleInfo} is overheating. What should I check?`
        ]);
      }
    }
  }, [selectedVehicleId, vehicles]);

  const handleDiagnosisAdded = (diagnosis: Diagnosis) => {
    setDiagnoses(prev => [diagnosis, ...prev]);
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
    setIsHistoryMenuOpen(false);
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

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const vehicleDisplayName = selectedVehicle 
    ? (selectedVehicle.other_vehicle_description || 
       `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.trim ? ` ${selectedVehicle.trim}` : ''}`)
    : '';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900">
      <Suspense fallback={<ComponentLoader />}>
        <MobileTopNavBar
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleChange={setSelectedVehicleId}
          onMenuToggle={() => setIsHistoryMenuOpen(true)}
        />
      </Suspense>

      <Suspense fallback={<ComponentLoader />}>
        <MobilePageMenu
          isOpen={isHistoryMenuOpen}
          onClose={() => setIsHistoryMenuOpen(false)}
          title="Diagnostic History"
        >
          <ChatHistory
            diagnoses={diagnoses}
            loading={loading}
            error={error}
            onStatusChange={handleDiagnosisStatusChange}
            onLoadDiagnosis={handleLoadDiagnosis}
          />
        </MobilePageMenu>
      </Suspense>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen pt-16">
        {/* Desktop History Sidebar */}
        <div ref={desktopHistoryRef} className="w-80 border-r border-neutral-200 dark:border-gray-700 h-full overflow-y-auto">
          <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Diagnostic History</h2>
            </div>
          </div>
          <Suspense fallback={<ComponentLoader />}>
            <ChatHistory
              diagnoses={diagnoses}
              loading={loading}
              error={error}
              onStatusChange={handleDiagnosisStatusChange}
              onLoadDiagnosis={handleLoadDiagnosis}
            />
          </Suspense>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Vehicle Info Bar */}
          <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-medium text-neutral-900 dark:text-white">{vehicleDisplayName}</h2>
                  <p className="text-sm text-neutral-500 dark:text-gray-400">
                    {selectedVehicle?.vin ? `VIN: ${selectedVehicle.vin}` : 'No VIN provided'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRepairTips(!showRepairTips)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <Lightbulb className="h-4 w-4" />
                <span>{showRepairTips ? 'Hide Tips' : 'Show Tips'}</span>
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex">
            <div className={`flex-1 ${showRepairTips ? 'md:w-2/3' : 'w-full'}`}>
              <Suspense fallback={<ComponentLoader />}>
                <ChatInterface 
                  selectedVehicleId={selectedVehicleId}
                  onDiagnosisAdded={handleDiagnosisAdded}
                  messages={activeChatMessages}
                  setMessages={setActiveChatMessages}
                  activeDiagnosisId={activeDiagnosisId}
                  setActiveDiagnosisId={setActiveDiagnosisId}
                  suggestedPrompts={suggestedPrompts}
                />
              </Suspense>
            </div>

            {/* Repair Tips Panel (Desktop) */}
            {showRepairTips && (
              <div className="hidden md:block md:w-1/3 border-l border-neutral-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Repair Tips</h2>
                    </div>
                    <button
                      onClick={() => setShowRepairTips(false)}
                      className="text-neutral-500 dark:text-gray-400 hover:text-neutral-700 dark:hover:text-gray-300"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <Suspense fallback={<ComponentLoader />}>
                  <RepairTipsPanel />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pt-[104px] pb-[64px] h-screen">
        {/* Repair Tips Toggle Button */}
        <div className="fixed top-[120px] right-4 z-40">
          <button
            onClick={() => setShowRepairTips(!showRepairTips)}
            className="flex items-center justify-center w-10 h-10 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full shadow-md hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
            title="Show repair tips"
          >
            <Lightbulb className="h-5 w-5" />
          </button>
        </div>

        {/* History Button */}
        <div className="fixed top-[120px] left-4 z-40">
          <button
            onClick={() => setIsHistoryMenuOpen(true)}
            className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full shadow-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
            title="Show chat history"
          >
            <History className="h-5 w-5" />
          </button>
        </div>

        {/* Repair Tips Panel (Mobile) */}
        <AnimatePresence>
          {showRepairTips && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-[160px] right-0 bottom-[64px] md:bottom-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 z-30 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Personalized Repair Tips
                  </h2>
                </div>
                <button
                  onClick={() => setShowRepairTips(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full"
                >
                  &times;
                </button>
              </div>
              <div className="p-4">
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                }>
                  <RepairTipsPanel />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Suspense fallback={<ComponentLoader />}>
          <ChatInterface 
            selectedVehicleId={selectedVehicleId}
            onDiagnosisAdded={handleDiagnosisAdded}
            messages={activeChatMessages}
            setMessages={setActiveChatMessages}
            activeDiagnosisId={activeDiagnosisId}
            setActiveDiagnosisId={setActiveDiagnosisId}
            suggestedPrompts={suggestedPrompts}
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