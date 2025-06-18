import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2, ThumbsUp, ThumbsDown, ChevronRight, AlertCircle, Battery, Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vehicle, ServiceRecord, getUserVehicles, getAllServiceRecords } from '../lib/supabase';

interface RepairTip {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  vehicleId: string;
  vehicleName: string;
  dueDate?: string;
  mileage?: number;
}

const RepairTipsPanel: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [repairTips, setRepairTips] = useState<RepairTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiclesData, recordsData] = await Promise.all([
          getUserVehicles(),
          getAllServiceRecords()
        ]);
        
        setVehicles(vehiclesData);
        setServiceRecords(recordsData);
        
        // Generate personalized tips based on vehicle data and service history
        const tips = generatePersonalizedTips(vehiclesData, recordsData);
        setRepairTips(tips);
      } catch (err) {
        console.error('Failed to load repair tips data:', err);
        setError('Failed to load repair tips');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generatePersonalizedTips = (vehicles: Vehicle[], records: ServiceRecord[]): RepairTip[] => {
    const tips: RepairTip[] = [];
    
    vehicles.forEach(vehicle => {
      const vehicleRecords = records.filter(record => record.vehicle_id === vehicle.id);
      const vehicleName = vehicle.other_vehicle_description || 
        `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
      
      // Check for oil change recommendation
      const lastOilChange = vehicleRecords
        .filter(record => record.service_type.toLowerCase().includes('oil'))
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
      
      if (lastOilChange) {
        const lastOilChangeDate = new Date(lastOilChange.service_date);
        const monthsSinceOilChange = Math.floor((new Date().getTime() - lastOilChangeDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        
        if (monthsSinceOilChange >= 5) {
          tips.push({
            id: `oil-${vehicle.id}`,
            title: '🛢️ Oil Refresh',
            description: `Your ${vehicleName} is due for an oil change. It's been ${monthsSinceOilChange} months since your last oil change.`,
            priority: monthsSinceOilChange >= 7 ? 'high' : 'medium',
            vehicleId: vehicle.id,
            vehicleName,
            dueDate: new Date(lastOilChangeDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
      } else if (vehicle.year) {
        // If no oil change record exists, suggest one for vehicles with year data
        tips.push({
          id: `first-oil-${vehicle.id}`,
          title: '🛢️ Oil Refresh',
          description: `We recommend regular oil changes for your ${vehicleName} to maintain optimal engine performance.`,
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
      
      // Check for tire rotation
      const lastTireRotation = vehicleRecords
        .filter(record => record.service_type.toLowerCase().includes('tire') && record.service_type.toLowerCase().includes('rotation'))
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
      
      if (lastTireRotation) {
        const lastRotationDate = new Date(lastTireRotation.service_date);
        const monthsSinceRotation = Math.floor((new Date().getTime() - lastRotationDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        
        if (monthsSinceRotation >= 6) {
          tips.push({
            id: `tire-${vehicle.id}`,
            title: 'Tire Rotation Recommended',
            description: `Your ${vehicleName} is due for a tire rotation. Regular rotations help ensure even tire wear and extend tire life.`,
            priority: 'medium',
            vehicleId: vehicle.id,
            vehicleName
          });
        }
      }
      
      // Check for brake service
      const lastBrakeService = vehicleRecords
        .filter(record => record.service_type.toLowerCase().includes('brake'))
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
      
      if (lastBrakeService) {
        const lastBrakeDate = new Date(lastBrakeService.service_date);
        const monthsSinceBrakeService = Math.floor((new Date().getTime() - lastBrakeDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        
        if (monthsSinceBrakeService >= 12) {
          tips.push({
            id: `brake-${vehicle.id}`,
            title: 'Brake Inspection Due',
            description: `It's been over a year since your last brake service for your ${vehicleName}. We recommend a brake inspection to ensure safety.`,
            priority: 'high',
            vehicleId: vehicle.id,
            vehicleName
          });
        }
      }
      
      // Seasonal tips based on current month
      const currentMonth = new Date().getMonth();
      
      // Winter preparation (October-November)
      if (currentMonth >= 9 && currentMonth <= 10) {
        tips.push({
          id: `winter-${vehicle.id}`,
          title: 'Winter Preparation',
          description: `Winter is coming! Consider checking your ${vehicleName}'s battery, antifreeze levels, and tire condition before cold weather arrives.`,
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
      
      // Summer preparation (April-May)
      if (currentMonth >= 3 && currentMonth <= 4) {
        tips.push({
          id: `summer-${vehicle.id}`,
          title: 'Summer Preparation',
          description: `As temperatures rise, ensure your ${vehicleName}'s air conditioning system is working properly and check coolant levels to prevent overheating.`,
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName
        });
      }
      
      // Vehicle age-based tips
      if (vehicle.year) {
        const vehicleAge = new Date().getFullYear() - vehicle.year;
        
        if (vehicleAge >= 5 && vehicleAge < 10) {
          tips.push({
            id: `age5-${vehicle.id}`,
            title: 'Timing Belt Inspection',
            description: `Your ${vehicleName} is ${vehicleAge} years old. Many vehicles need timing belt replacement between 60,000-100,000 miles. Consider having it inspected.`,
            priority: 'medium',
            vehicleId: vehicle.id,
            vehicleName
          });
        }
        
        if (vehicleAge >= 3) {
          tips.push({
            id: `battery-${vehicle.id}`,
            title: '🔋 Battery Checkup',
            description: `Your ${vehicleName} is ${vehicleAge} years old. Car batteries typically last 3-5 years. Consider having your battery tested.`,
            priority: vehicleAge >= 4 ? 'high' : 'low',
            vehicleId: vehicle.id,
            vehicleName
          });
        }
      }
    });
    
    // Sort tips by priority
    return tips.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const handleFeedback = (tipId: string, helpful: boolean) => {
    setFeedbackSubmitting(tipId);
    
    // Simulate feedback submission
    setTimeout(() => {
      // In a real implementation, this would send feedback to the server
      console.log(`Feedback for tip ${tipId}: ${helpful ? 'helpful' : 'not helpful'}`);
      
      // Remove the tip after feedback
      setRepairTips(prev => prev.filter(tip => tip.id !== tipId));
      setFeedbackSubmitting(null);
    }, 500);
  };

  const getPriorityStyles = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityBarColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 dark:bg-red-600';
      case 'medium':
        return 'bg-amber-500 dark:bg-amber-600';
      case 'low':
        return 'bg-green-500 dark:bg-green-600';
      default:
        return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error Loading Repair Tips</h3>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  if (repairTips.length === 0) {
    return (
      <div className="p-8 text-center">
        <Lightbulb className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No repair tips available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your vehicles are in good shape! Check back later for maintenance recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {repairTips.map((tip) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden pl-3"
          >
            {/* Colored vertical bar based on priority */}
            <div 
              className={`absolute left-0 top-0 bottom-0 w-3 ${getPriorityBarColor(tip.priority)}`}
            />
            
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getPriorityStyles(tip.priority)}`}>
                  <Lightbulb className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {tip.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityStyles(tip.priority)}`}>
                      {tip.priority.charAt(0).toUpperCase() + tip.priority.slice(1)} Priority
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    For: {tip.vehicleName}
                  </p>
                  
                  <div className="mt-2">
                    <button
                      onClick={() => setExpandedTipId(expandedTipId === tip.id ? null : tip.id)}
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {expandedTipId === tip.id ? 'Show less' : 'Show more'}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${
                        expandedTipId === tip.id ? 'rotate-90' : ''
                      }`} />
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {expandedTipId === tip.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                      >
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {tip.description}
                        </p>
                        
                        {tip.dueDate && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">Recommended by:</span> {tip.dueDate}
                          </p>
                        )}
                        
                        {tip.mileage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">Recommended mileage:</span> {tip.mileage.toLocaleString()} miles
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Was this tip helpful?
                          </span>
                          <button
                            onClick={() => handleFeedback(tip.id, true)}
                            disabled={!!feedbackSubmitting}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleFeedback(tip.id, false)}
                            disabled={!!feedbackSubmitting}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          
                          {feedbackSubmitting === tip.id && (
                            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin ml-2" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* AI Suggested tag */}
              <div className="absolute bottom-2 right-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  AI Suggested
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RepairTipsPanel;