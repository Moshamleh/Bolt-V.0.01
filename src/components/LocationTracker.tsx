import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  EyeOff,
  Activity,
  DollarSign,
} from "lucide-react";
import {
  locationService,
  LocationData,
  DistancePricing,
} from "../lib/locationService";
import toast from "react-hot-toast";

interface LocationTrackerProps {
  mechanicId: string;
  isOnline: boolean;
  onStatusChange: (isOnline: boolean, isAvailable: boolean) => void;
}

interface NearbyCustomer {
  id: string;
  name: string;
  distance: number;
  estimated_arrival: number;
  service_type: string;
  urgency: "low" | "medium" | "high";
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  mechanicId,
  isOnline,
  onStatusChange,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(true);
  const [nearbyCustomers, setNearbyCustomers] = useState<NearbyCustomer[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [trackingAccuracy, setTrackingAccuracy] = useState<
    "high" | "medium" | "low"
  >("medium");
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [workingHours, setWorkingHours] = useState(0);

  useEffect(() => {
    if (isOnline && !isTracking) {
      startTracking();
    } else if (!isOnline && isTracking) {
      stopTracking();
    }
  }, [isOnline]);

  useEffect(() => {
    // Subscribe to location updates
    const unsubscribe = locationService.onLocationUpdate((location) => {
      setCurrentLocation(location);
      updateDistanceTraveled(location);
    });

    return unsubscribe;
  }, []);

  const startTracking = async () => {
    try {
      setLocationError(null);
      await locationService.startLocationTracking(mechanicId);
      setIsTracking(true);

      // Get initial location
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      toast.success("Location tracking started");
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      setLocationError(
        error instanceof Error ? error.message : "Failed to start tracking"
      );
      toast.error("Failed to start location tracking");
    }
  };

  const stopTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
    setCurrentLocation(null);
    toast.success("Location tracking stopped");
  };

  const toggleAvailability = async () => {
    try {
      const newAvailabilityStatus = !isOnline;
      await locationService.setMechanicAvailability(
        mechanicId,
        newAvailabilityStatus
      );
      onStatusChange(newAvailabilityStatus, newAvailabilityStatus);
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability");
    }
  };

  const updateDistanceTraveled = (newLocation: LocationData) => {
    if (currentLocation && isTracking) {
      const distance = locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // Only count significant movements (more than 0.01 miles)
      if (distance > 0.01) {
        setDistanceTraveled((prev) => prev + distance);
      }
    }
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return "text-gray-400";
    if (accuracy < 10) return "text-green-600 dark:text-green-400";
    if (accuracy < 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return "Unknown";
    if (accuracy < 10) return "High";
    if (accuracy < 50) return "Medium";
    return "Low";
  };

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
      >
        <Eye className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-40"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Location Tracker
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <EyeOff className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <button
              onClick={toggleAvailability}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isOnline
                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {isOnline ? "Available" : "Offline"}
            </button>
          </div>

          {currentLocation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Accuracy:
                </span>
                <span
                  className={`text-xs font-medium ${getAccuracyColor(
                    currentLocation.accuracy
                  )}`}
                >
                  {getAccuracyText(currentLocation.accuracy)} (
                  {currentLocation.accuracy?.toFixed(0)}m)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Coordinates:
                </span>
                <span className="text-xs text-gray-900 dark:text-white font-mono">
                  {currentLocation.latitude.toFixed(4)},{" "}
                  {currentLocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {locationError && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {locationError}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        {isTracking && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Distance
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {distanceTraveled.toFixed(1)}mi
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Online
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.floor(workingHours)}h
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Opportunities */}
        {nearbyCustomers.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Nearby Customers ({nearbyCustomers.length})
                </h4>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {nearbyCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {customer.service_type} • {customer.distance.toFixed(1)}
                        mi
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          customer.urgency === "high"
                            ? "bg-red-500"
                            : customer.urgency === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {customer.estimated_arrival}min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Stop Tracking
              </button>
            )}

            <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationTracker;
