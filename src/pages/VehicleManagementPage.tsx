import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, Settings, Wrench, Loader2, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, getUserVehicles } from '../lib/supabase';

const VehicleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await getUserVehicles();
        setVehicles(data);
      } catch (err) {
        console.error('Failed to load vehicles:', err);
        setError('Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  const handleAddVehicle = () => {
    navigate('/vehicle-setup');
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
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <Car className="h-16 w-16 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No vehicles added yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Vehicles</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your vehicles, service records, and run diagnostics
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : vehicles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.other_vehicle_description || `${vehicle.year} ${vehicle.make}`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {vehicle.other_vehicle_description ? '' : `${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditVehicle(vehicle.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Edit vehicle"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => handleRunDiagnostic(vehicle.id)}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Wrench className="h-5 w-5 mr-2" />
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
                      className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
              className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={handleAddVehicle}
            >
              <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">Add Another Vehicle</span>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleManagementPage;