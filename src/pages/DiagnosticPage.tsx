import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Car, Loader2, Lightbulb, Menu, History, MessageSquare, Wrench, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, getUserVehicles, getUserDiagnoses, Diagnosis, updateProfile, awardBadge, sendDiagnosticPrompt, subscribeToDiagnosisUpdates } from '../lib/supabase';
import { useOnboarding } from '../hooks/useOnboarding';
import WelcomeModal from '../components/WelcomeModal';
import { useProfile } from '../hooks/useProfile';
import { hasCompletedFirstDiagnostic, markFirstDiagnosticCompleted } from '../lib/utils';
import { awardXp, XP_VALUES } from '../lib/xpSystem';
import Confetti from '../components/Confetti';

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
  const navigate = useNavigate();
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
  const [urgentTipContent, setUrgentTipContent] = useState<string | null>(null);
  const [urgentTipLoading, setUrgentTipLoading] = useState(false);
  const [urgentTipVisible, setUrgentTipVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const desktopHistoryRef = useRef<HTMLDivElement>(null);
  
  const { showOnboarding, completeOnboarding, isInitialized } = useOnboarding();
  const { profile } = useProfile();

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
        
        // Check if the error is due to JWT expiration
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (
          errorMessage.includes('JWT expired') || 
          errorMessage.includes('invalid JWT') ||
          errorMessage.includes('PGRST301')
        ) {
          console.log('JWT expired, redirecting to login');
          navigate('/login');
          return;
        }
        
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, [navigate]);

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
        
        // Check if the error is due to JWT expiration
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (
          errorMessage.includes('JWT expired') || 
          errorMessage.includes('invalid JWT') ||
          errorMessage.includes('PGRST301')
        ) {
          console.log('JWT expired, redirecting to login');
          navigate('/login');
          return;
        }
        
        setError('Failed to load diagnostic history');
      }
    };

    loadDiagnoses();
  }, [selectedVehicleId, navigate]);

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

  const handleDiagnosisAdded = async (diagnosis: Diagnosis) => {
    setDiagnoses(prev => [diagnosis, ...prev]);
    
    // Check if this is the first diagnostic and award badge
    if (!hasCompletedFirstDiagnostic()) {
      markFirstDiagnosticCompleted();
      
      try {
        // Update the profile to mark first_diagnostic_completed as true
        await updateProfile({ first_diagnostic_completed: true });
        
        // Award the badge
        await awardBadge(undefined, "First Diagnosis", "Completed your first AI diagnostic");
        
        // Award XP for completing first diagnostic
        await awardXp(undefined, XP_VALUES.RUN_DIAGNOSTIC, "Completed first AI diagnostic");
        
        // Show XP toast notification
        toast.success(`🎉 +${XP_VALUES.RUN_DIAGNOSTIC} XP added to your profile!`);
        
        // Show confetti animation
        setShowConfetti(true);
      } catch (badgeError) {
        console.error('Failed to award First Diagnosis badge:', badgeError);
        // Don't fail the diagnostic if badge awarding fails
      }
    } else {
      // Award XP for regular diagnostics
      try {
        await awardXp(undefined, XP_VALUES.RUN_DIAGNOSTIC, "Completed AI diagnostic");
        toast.success(`🎉 +${XP_VALUES.RUN_DIAGNOSTIC} XP added to your profile!`);
      } catch (xpError) {
        console.error('Failed to award XP:', xpError);
        // Don't fail the diagnostic if XP awarding fails
      }
    }
  };

  const handleDiagnosisStatusChange = async (diagnosisId: string, resolved: boolean) => {
    setDiagnoses(prev => prev.map(d => 
      d.id === diagnosisId ? { ...d, resolved } : d
    ));
    
    // Award XP for resolving a diagnostic
    if (resolved) {
      try {
        const { levelUpOccurred } = await awardXp(undefined, XP_VALUES.RESOLVE_DIAGNOSTIC, "Resolved a diagnostic issue");
        toast.success(`🎉 +${XP_VALUES.RESOLVE_DIAGNOSTIC} XP added for resolving the issue!`);
        
        // Show confetti if level up occurred
        if (levelUpOccurred) {
          setShowConfetti(true);
        }
      } catch (xpError) {
        console.error('Failed to award XP for resolving diagnostic:', xpError);
      }
    }
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

  // Get user's first name
  const getFirstName = () => {
    if (!profile) return 'there';
    
    if (profile.full_name) {
      return profile.full_name.split(' ')[0];
    }
    
    return profile.username || 'there';
  };

  const handleUrgentTipRequest = async () => {
    if (!selectedVehicleId) return;
    
    setUrgentTipLoading(true);
    setUrgentTipVisible(true);
    
    try {
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (!selectedVehicle) throw new Error('Vehicle not found');
      
      // Construct a specific prompt for the urgent maintenance tip
      const vehicleInfo = selectedVehicle.other_vehicle_description || 
        `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.trim ? ` ${selectedVehicle.trim}` : ''}`;
      
      const mileageInfo = selectedVehicle.mileage 
        ? `with ${selectedVehicle.mileage} miles` 
        : '';
      
      const prompt = `Based on this ${vehicleInfo} ${mileageInfo}, what is the single most urgent maintenance task I should prioritize right now? Please be specific and explain why it's important. Keep your answer concise.`;
      
      // Send the diagnostic prompt
      const diagnosis = await sendDiagnosticPrompt(selectedVehicleId, prompt);
      
      // Subscribe to updates for the diagnosis
      const unsubscribe = subscribeToDiagnosisUpdates(diagnosis.id, (updatedDiagnosis) => {
        if (updatedDiagnosis.response) {
          setUrgentTipContent(updatedDiagnosis.response);
          setUrgentTipLoading(false);
          
          // Clean up subscription
          unsubscribe();
        }
      });
      
    } catch (err) {
      console.error('Failed to get urgent maintenance tip:', err);
      setUrgentTipContent('Sorry, I was unable to determine the most urgent maintenance task. Please try again later.');
      setUrgentTipLoading(false);
    }
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
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter</h3>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            <div className="flex mt-2 gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-sm rounded-full ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Show All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 text-sm rounded-full ${
                  filterStatus === 'active'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Only Active
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-3 py-1.5 text-sm rounded-full ${
                  filterStatus === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Only Resolved
              </button>
            </div>
          </div>
          <ChatHistory
            diagnoses={diagnoses}
            loading={loading}
            error={error}
            onStatusChange={handleDiagnosisStatusChange}
            onLoadDiagnosis={handleLoadDiagnosis}
            filterStatus={filterStatus}
          />
        </MobilePageMenu>
      </Suspense>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen pt-16">
        {/* Desktop History Sidebar */}
        <div ref={desktopHistoryRef} className="w-80 border-r border-neutral-200 dark:border-gray-700 h-full overflow-y-auto">
          <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Diagnostic History</h2>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-sm rounded-full ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Show All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 text-sm rounded-full ${
                  filterStatus === 'active'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Only Active
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-3 py-1.5 text-sm rounded-full ${
                  filterStatus === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Only Resolved
              </button>
            </div>
          </div>
          <Suspense fallback={<ComponentLoader />}>
            <ChatHistory
              diagnoses={diagnoses}
              loading={loading}
              error={error}
              onStatusChange={handleDiagnosisStatusChange}
              onLoadDiagnosis={handleLoadDiagnosis}
              filterStatus={filterStatus}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUrgentTipRequest}
                  disabled={urgentTipLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {urgentTipLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>🔮 What should I fix first?</span>
                </button>
                <button
                  onClick={() => setShowRepairTips(!showRepairTips)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>{showRepairTips ? 'Hide Tips' : 'Show Tips'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4">
            <div className="max-w-3xl mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 animate-chat-bubble-glow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-blink-wrench" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    👋 Hey {getFirstName()}! I'm Bolt, your personal AI mechanic.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Ask me anything about your car — I've got you covered.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Maintenance Tip */}
          <AnimatePresence>
            {urgentTipVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4 overflow-hidden"
              >
                <div className="max-w-3xl mx-auto rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 shadow-glow border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-amber-800 dark:text-amber-200">
                          Priority Maintenance Task
                        </h3>
                        <div className="px-2 py-0.5 bg-amber-200/50 dark:bg-amber-800/50 rounded text-xs font-medium text-amber-700 dark:text-amber-300 animate-pulse">
                          AI Suggested
                        </div>
                      </div>
                      {urgentTipLoading ? (
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Analyzing your vehicle data...</span>
                        </div>
                      ) : (
                        <p className="text-amber-700 dark:text-amber-300">
                          {urgentTipContent}
                        </p>
                      )}
                      <button
                        onClick={() => setUrgentTipVisible(false)}
                        className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

        {/* Urgent Maintenance Button */}
        <div className="fixed top-[180px] right-4 z-40">
          <button
            onClick={handleUrgentTipRequest}
            disabled={urgentTipLoading}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600 text-white rounded-full shadow-md hover:from-amber-500 hover:to-yellow-500 dark:hover:from-amber-700 dark:hover:to-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="What should I fix first?"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>

        {/* Welcome Message (Mobile) */}
        <div className="px-4 mb-4">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 animate-chat-bubble-glow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-blink-wrench" />
                </div>
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  👋 Hey {getFirstName()}! I'm Bolt, your personal AI mechanic.
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Ask me anything about your car — I've got you covered.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Maintenance Tip (Mobile) */}
        <AnimatePresence>
          {urgentTipVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 mb-4"
            >
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 shadow-glow border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-amber-800 dark:text-amber-200">
                        Priority Maintenance Task
                      </h3>
                      <div className="px-2 py-0.5 bg-amber-200/50 dark:bg-amber-800/50 rounded text-xs font-medium text-amber-700 dark:text-amber-300 animate-pulse">
                        AI Suggested
                      </div>
                    </div>
                    {urgentTipLoading ? (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analyzing your vehicle data...</span>
                      </div>
                    ) : (
                      <p className="text-amber-700 dark:text-amber-300">
                        {urgentTipContent}
                      </p>
                    )}
                    <button
                      onClick={() => setUrgentTipVisible(false)}
                      className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        userName={getFirstName()}
      />
    </div>
  );
};

export default DiagnosticPage;