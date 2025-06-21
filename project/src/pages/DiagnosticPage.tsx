import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, Settings, Wrench, Loader2, FileText, Calendar, Lightbulb, Menu, Zap, PenTool as Tool, Sparkles, History, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, getUserVehicles, getAllUserDiagnosesWithVehicles, Diagnosis, updateProfile, awardBadge, sendDiagnosticPrompt, subscribeToDiagnosisUpdates } from '../lib/supabase';
import { useOnboarding } from '../hooks/useOnboarding';
import { useProfile } from '../hooks/useProfile';
import { hasCompletedFirstDiagnostic, markFirstDiagnosticCompleted } from '../lib/utils';
import { awardXp, XP_VALUES } from '../lib/xpSystem';
import Confetti from '../components/Confetti';
import ChatHistorySkeleton from '../components/ChatHistorySkeleton';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import { incrementChallengeProgress } from '../lib/supabase_modules/challenges';

// Lazy load components
const ChatInterface = lazy(() => import('../components/ChatInterface'));
const MobileTopNavBar = lazy(() => import('../components/MobileTopNavBar'));
const MobileCollapsibleMenu = lazy(() => import('../components/MobileCollapsibleMenu'));
const ChatHistory = lazy(() => import('../components/ChatHistory'));
const RepairTipsPanel = lazy(() => import('../components/RepairTipsPanel'));
const TipCarousel = lazy(() => import('../components/TipCarousel'));
const ChallengeProgress = lazy(() => import('../components/ChallengeProgress'));

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

// Interface for grouped diagnoses
interface VehicleDiagnoses {
  vehicle: Vehicle;
  diagnoses: Diagnosis[];
}

const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [groupedDiagnoses, setGroupedDiagnoses] = useState<VehicleDiagnoses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [activeDiagnosisId, setActiveDiagnosisId] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [urgentTipContent, setUrgentTipContent] = useState<string | null>(null);
  const [urgentTipLoading, setUrgentTipLoading] = useState(false);
  const [urgentTipVisible, setUrgentTipVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [recheckPrompt, setRecheckPrompt] = useState<string | null>(null);
  const desktopHistoryRef = useRef<HTMLDivElement>(null);
  
  const { showOnboarding, completeOnboarding, isInitialized } = useOnboarding();
  const { profile } = useProfile();

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        
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
        // Load all diagnoses with vehicle info
        const allDiagnoses = await getAllUserDiagnosesWithVehicles();
        
        // Filter diagnoses for the selected vehicle
        const vehicleDiagnoses = allDiagnoses.filter(d => d.vehicle_id === selectedVehicleId);
        setDiagnoses(vehicleDiagnoses);

        // Group diagnoses by vehicle
        const groupedByVehicle: Record<string, VehicleDiagnoses> = {};
        
        allDiagnoses.forEach(diagnosis => {
          if (diagnosis.vehicle) {
            const vehicleId = diagnosis.vehicle.id;
            
            if (!groupedByVehicle[vehicleId]) {
              groupedByVehicle[vehicleId] = {
                vehicle: diagnosis.vehicle,
                diagnoses: []
              };
            }
            
            groupedByVehicle[vehicleId].diagnoses.push(diagnosis);
          }
        });
        
        // Convert to array and sort by most recent diagnosis
        const groupedArray = Object.values(groupedByVehicle).sort((a, b) => {
          const aLatest = new Date(a.diagnoses[0]?.timestamp || 0).getTime();
          const bLatest = new Date(b.diagnoses[0]?.timestamp || 0).getTime();
          return bLatest - aLatest;
        });
        
        setGroupedDiagnoses(groupedArray);

        // Initialize chat with most recent diagnosis if available
        if (vehicleDiagnoses.length > 0) {
          const mostRecent = vehicleDiagnoses[0];
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
    
    // Update grouped diagnoses
    setGroupedDiagnoses(prev => {
      const vehicleId = diagnosis.vehicle_id;
      const vehicleGroup = prev.find(g => g.vehicle.id === vehicleId);
      
      if (vehicleGroup) {
        // Update existing group
        return prev.map(group => {
          if (group.vehicle.id === vehicleId) {
            return {
              ...group,
              diagnoses: [diagnosis, ...group.diagnoses]
            };
          }
          return group;
        });
      } else {
        // Create new group if vehicle info is available
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          return [
            {
              vehicle,
              diagnoses: [diagnosis]
            },
            ...prev
          ];
        }
        return prev;
      }
    });
    
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
        
        // Update challenge progress
        try {
          // First Diagnosis challenge
          await incrementChallengeProgress('First Diagnosis');
          
          // Diagnostic Expert challenge
          await incrementChallengeProgress('Diagnostic Expert');
          
          // Daily Diagnostics challenge
          await incrementChallengeProgress('Daily Diagnostics');
          
          // Weekly Mechanic challenge
          await incrementChallengeProgress('Weekly Mechanic');
        } catch (challengeError) {
          console.error('Failed to update challenge progress:', challengeError);
        }
      } catch (badgeError) {
        console.error('Failed to award First Diagnosis badge:', badgeError);
        // Don't fail the diagnostic if badge awarding fails
      }
    } else {
      // Award XP for regular diagnostics
      try {
        await awardXp(undefined, XP_VALUES.RUN_DIAGNOSTIC, "Completed AI diagnostic");
        toast.success(`🎉 +${XP_VALUES.RUN_DIAGNOSTIC} XP added to your profile!`);
        
        // Update challenge progress
        try {
          // Diagnostic Expert challenge
          await incrementChallengeProgress('Diagnostic Expert');
          
          // Daily Diagnostics challenge
          await incrementChallengeProgress('Daily Diagnostics');
          
          // Weekly Mechanic challenge
          await incrementChallengeProgress('Weekly Mechanic');
        } catch (challengeError) {
          console.error('Failed to update challenge progress:', challengeError);
        }
      } catch (xpError) {
        console.error('Failed to award XP:', xpError);
        // Don't fail the diagnostic if XP awarding fails
      }
    }
  };

  const handleDiagnosisStatusChange = async (diagnosisId: string, resolved: boolean) => {
    // Update local state
    setDiagnoses(prev => prev.map(d => 
      d.id === diagnosisId ? { ...d, resolved } : d
    ));
    
    // Update grouped diagnoses
    setGroupedDiagnoses(prev => 
      prev.map(group => ({
        ...group,
        diagnoses: group.diagnoses.map(d => 
          d.id === diagnosisId ? { ...d, resolved } : d
        )
      }))
    );
    
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

  const handleRecheckDiagnosis = (prompt: string) => {
    // Set the recheck prompt
    setRecheckPrompt(prompt);
    
    // Clear current chat
    setActiveChatMessages([]);
    setActiveDiagnosisId(null);
    
    // Close the history menu if it's open
    setIsHistoryMenuOpen(false);
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

  // Get user's first name
  const getFirstName = () => {
    if (!profile) return '';
    
    if (profile.full_name) {
      return profile.full_name.split(' ')[0];
    }
    
    return profile.username || '';
  };

  // Function to start a new diagnostic session
  const handleStartNewSession = () => {
    setActiveChatMessages([]);
    setActiveDiagnosisId(null);
    setRecheckPrompt(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 p-4">
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
      <Suspense fallback={<ComponentLoader />}>
        <MobileTopNavBar
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleChange={setSelectedVehicleId}
          onMenuToggle={() => setIsHistoryMenuOpen(true)}
          onSettingsToggle={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
        />
      </Suspense>

      <Suspense fallback={<ComponentLoader />}>
        <MobileCollapsibleMenu
          isOpen={isHistoryMenuOpen}
          onClose={() => setIsHistoryMenuOpen(false)}
          diagnoses={diagnoses}
          loading={loading}
          error={error}
          onStatusChange={handleDiagnosisStatusChange}
          onLoadDiagnosis={handleLoadDiagnosis}
          onRecheckDiagnosis={handleRecheckDiagnosis}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />
      </Suspense>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen pt-0">
        {/* Desktop History Sidebar */}
        <div ref={desktopHistoryRef} className="w-72 border-r border-neutral-200 dark:border-gray-700 h-full overflow-y-auto">
          <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">History</h2>
              </div>
              
              {/* Start New Session Button */}
              <button
                onClick={handleStartNewSession}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                New Session
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs rounded-full ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 text-xs rounded-full ${
                  filterStatus === 'active'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-3 py-1.5 text-xs rounded-full ${
                  filterStatus === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistory
              diagnoses={diagnoses}
              loading={loading}
              error={error}
              onStatusChange={handleDiagnosisStatusChange}
              onLoadDiagnosis={handleLoadDiagnosis}
              onRecheckDiagnosis={handleRecheckDiagnosis}
              filterStatus={filterStatus}
            />
          </Suspense>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Vehicle Info Bar */}
          <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-medium text-neutral-900 dark:text-white">{vehicleDisplayName}</h2>
                  <p className="text-xs text-neutral-500 dark:text-gray-400">
                    {selectedVehicle?.vin ? `VIN: ${selectedVehicle.vin}` : 'No VIN provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Start New Session Button */}
                <button
                  onClick={handleStartNewSession}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Start New Session
                </button>
                <button
                  onClick={handleUrgentTipRequest}
                  disabled={urgentTipLoading}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {urgentTipLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>Priority Maintenance</span>
                </button>
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
                className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-3 overflow-hidden"
              >
                <div className="max-w-3xl mx-auto rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Priority Maintenance
                        </h3>
                        <button
                          onClick={() => setUrgentTipVisible(false)}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                      {urgentTipLoading ? (
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Analyzing your vehicle data...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {urgentTipContent}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Challenge Progress - Compact Version */}
          <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-3">
            <Suspense fallback={<div className="h-8"></div>}>
              <ChallengeProgress limit={1} />
            </Suspense>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex">
            <div className="flex-1">
              <Suspense fallback={<ComponentLoader />}>
                <ChatInterface 
                  selectedVehicleId={selectedVehicleId}
                  onDiagnosisAdded={handleDiagnosisAdded}
                  messages={activeChatMessages}
                  setMessages={setActiveChatMessages}
                  activeDiagnosisId={activeDiagnosisId}
                  setActiveDiagnosisId={setActiveDiagnosisId}
                  suggestedPrompts={suggestedPrompts}
                  recheckPrompt={recheckPrompt}
                  setRecheckPrompt={setRecheckPrompt}
                  userName={getFirstName()}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pt-[104px] pb-[64px] h-screen">
        {/* Urgent Maintenance Tip (Mobile) */}
        <AnimatePresence>
          {urgentTipVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-3 mb-3"
            >
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Priority Maintenance
                      </h3>
                      <button
                        onClick={() => setUrgentTipVisible(false)}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                    {urgentTipLoading ? (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing your vehicle data...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {urgentTipContent}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Challenge Progress (Mobile) */}
        <div className="px-3 mb-3">
          <Suspense fallback={<div className="h-8"></div>}>
            <ChallengeProgress limit={1} />
          </Suspense>
        </div>

        {/* Start New Session Button (Mobile) */}
        <div className="px-3 mb-3">
          <button
            onClick={handleStartNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Start New Session
          </button>
        </div>

        <Suspense fallback={<ComponentLoader />}>
          <ChatInterface 
            selectedVehicleId={selectedVehicleId}
            onDiagnosisAdded={handleDiagnosisAdded}
            messages={activeChatMessages}
            setMessages={setActiveChatMessages}
            activeDiagnosisId={activeDiagnosisId}
            setActiveDiagnosisId={setActiveDiagnosisId}
            suggestedPrompts={suggestedPrompts}
            recheckPrompt={recheckPrompt}
            setRecheckPrompt={setRecheckPrompt}
            userName={getFirstName()}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default DiagnosticPage;