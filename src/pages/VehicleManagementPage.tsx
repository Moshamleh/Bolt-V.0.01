import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, Settings, Wrench, Loader2, FileText, Calendar, Lightbulb, Menu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, getUserVehicles, getProfile } from '../lib/supabase';
import MobilePageMenu from '../components/MobilePageMenu';

// Lazy load components
const RepairTipsPanel = lazy(() => import('../components/RepairTipsPanel'));

const VehicleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRepairTips, setShowRepairTips] = useState(false);
  const [aiTipsEnabled, setAiTipsEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiclesData, profileData] = await Promise.all([
          getUserVehicles(),
          getProfile()
        ]);
        
        setVehicles(vehiclesData);
        setProfile(profileData);
        
        // Check user preference for AI repair tips
        if (profileData) {
          setAiTipsEnabled(profileData.ai_repair_tips_enabled);
          // Show repair tips by default if enabled and there are vehicles
          setShowRepairTips(profileData.ai_repair_tips_enabled && vehiclesData.length > 0);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddVehicle = () => {
    navigate('/vehicle-setup');
    setIsMobileMenuOpen(false);
  };

  const handleEditVehicle = (vehicleId: string) => {
    // TODO: Implement edit vehicle functionality
    console.log('Edit vehicle:', vehicleId);
  };

  const handleRunDiagnostic = (vehicleId: string) => {
    navigate('/diagnostic');
  };

  const handleAddServiceRecord = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}/add-service`);
  };

  const handleViewServiceHistory = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}/service-history`);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-neutral-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-neutral-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-10 bg-neutral-200 dark:bg-gray-700 rounded-lg mt-4"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <Car className="h-16 w-16 text-neutral-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        No vehicles added yet
      </h2>
      <p className="text-neutral-600 dark:text-gray-400 mb-6">
        Add your first vehicle to get started with diagnostics
      </p>
      <button
        onClick={handleAddVehicle}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Vehicle
      </button>
    </motion.div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Your Vehicles</h1>
            <p className="text-neutral-600 dark:text-gray-400 mt-1">
              Manage your vehicles, service records, and run diagnostics
            </p>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : vehicles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {vehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-sm border border-neutral-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {vehicle.other_vehicle_description || `${vehicle.year} ${vehicle.make}`}
                      </h3>
                      <p className="text-neutral-600 dark:text-gray-400">
                        {vehicle.other_vehicle_description ? '' : `${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditVehicle(vehicle.id)}
                      className="p-2 text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-300 transition-colors"
                      aria-label="Edit vehicle"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => handleRunDiagnostic(vehicle.id)}
                      className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-glowing-gradient text-white font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Run Diagnostic
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAddServiceRecord(vehicle.id)}
                        className="flex items-center justify-center px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Service
                      </button>
                      
                      <button
                        onClick={() => handleViewServiceHistory(vehicle.id)}
                        className="flex items-center justify-center px-3 py-2 rounded-lg bg-neutral-200 dark:bg-gray-700 text-neutral-700 dark:text-gray-300 font-medium hover:bg-neutral-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Service History
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: vehicles.length * 0.1 }}
                className="bg-neutral-200 dark:bg-gray-900 rounded-xl border border-dashed border-neutral-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-300 dark:hover:bg-gray-800 transition-colors"
                onClick={handleAddVehicle}
              >
                <Plus className="h-8 w-8 text-neutral-400 dark:text-gray-500 mb-2" />
                <span className="text-neutral-600 dark:text-gray-400 font-medium">Add Another Vehicle</span>
              </motion.div>
            </div>

            {/* AI Repair Tips Section */}
            {aiTipsEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8"
              >
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Personalized Repair Tips
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowRepairTips(!showRepairTips)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showRepairTips ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showRepairTips && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6">
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
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <MobilePageMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Vehicle Options"
      >
        <div className="p-4 space-y-6">
          <button
            onClick={handleAddVehicle}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add New Vehicle</span>
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Your Vehicles</h3>
            
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  className="bg-white dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {vehicle.other_vehicle_description || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </h4>
                    <button
                      onClick={() => handleEditVehicle(vehicle.id)}
                      className="p-1 text-gray-500 dark:text-gray-400"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => {
                        handleRunDiagnostic(vehicle.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center px-3 py-2 rounded-lg bg-glowing-gradient text-white text-sm font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Diagnose
                    </button>
                    
                    <button
                      onClick={() => {
                        handleViewServiceHistory(vehicle.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {aiTipsEnabled && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => {
                  setShowRepairTips(!showRepairTips);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <Lightbulb className="h-5 w-5" />
                <span>{showRepairTips ? 'Hide Repair Tips' : 'Show Repair Tips'}</span>
              </button>
            </div>
          )}
        </div>
      </MobilePageMenu>
    </div>
  );
};

export default VehicleManagementPage;