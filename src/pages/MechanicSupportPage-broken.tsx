import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  MessageSquare,
  Phone,
  Shield,
  MapPin,
  Star,
  User,
  CheckCircle,
  Filter,
  X,
  Video,
  Calendar,
  Clock,
  DollarSign,
  Navigation,
  Loader2,
  Video,
  Calendar,
  Clock,
  DollarSign,
  Navigation,
  Loader2,
} from "lucide-react";
import {
  getApprovedMechanics,
  getOrCreateMechanicChat,
  Mechanic,
  getNearbyMechanics,
  initiateVideoCall,
  VideoCall,
  Appointment,
} from "../lib/supabase_modules/mechanics";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase_modules/mechanics";
import { awardXp, XP_VALUES } from "../lib/xpSystem";
import BookingCalendar from "../components/BookingCalendar";
import VideoCallModal from "../components/VideoCallModal";
import LocationTracker from "../components/LocationTracker";
import InvoiceModal from "../components/InvoiceModal";
import { locationService, DistancePricing } from "../lib/locationService";
import { PaymentService, Invoice } from "../lib/stripe";

// Define expertise areas for filtering
const EXPERTISE_AREAS = [
  "Engine Repair",
  "Transmission",
  "Brakes",
  "Suspension",
  "Electrical Systems",
  "Air Conditioning",
  "Diagnostics",
  "Oil Changes",
  "Tire Service",
  "Body Work",
  "Paint",
  "Welding",
  "Performance Tuning",
  "Hybrid/Electric Vehicles",
  "Diesel Engines",
  "Classic Cars",
  "Motorcycles",
  "Heavy Duty Trucks",
];

const MechanicSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"findMobile" | "callOrChat">(
    "findMobile"
  );
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for enhanced features
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeVideoCall, setActiveVideoCall] = useState<VideoCall | null>(
    null
  );
  const [startingCall, setStartingCall] = useState<string | null>(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get user location on component mount
    getUserLocation();
  }, []);

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        setLoading(true);

        let data: Mechanic[];
        if (nearbyOnly && userLocation) {
          data = await getNearbyMechanics(userLocation.lat, userLocation.lng);
        } else {
          data = await getApprovedMechanics(selectedSpecialties);
        }

        setMechanics(data);
      } catch (err) {
        console.error("Failed to load mechanics:", err);
        setError("Failed to load mechanics");
      } finally {
        setLoading(false);
      }
    };

    loadMechanics();
  }, [selectedSpecialties, nearbyOnly, userLocation]);

  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // New state for enhanced features
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [distancePricing, setDistancePricing] =
    useState<DistancePricing | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  useEffect(() => {
    // Get user location on component mount
    getUserLocation();
  }, []);

  const handleStartChat = async (mechanic: Mechanic) => {
    setStartingChat(mechanic.id);
    try {
      // Get current user session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Please log in to start a chat");
        navigate("/login");
        return;
      }

      // Create or get existing chat
      const chatId = await getOrCreateMechanicChat(user.id, mechanic.id);

      // Award XP for starting a chat with a mechanic
      try {
        await awardXp(
          user.id,
          XP_VALUES.SEND_CLUB_MESSAGE,
          "Started a chat with a mechanic"
        );
        toast.success(
          `🎉 +${XP_VALUES.SEND_CLUB_MESSAGE} XP added to your profile!`
        );
      } catch (xpError) {
        console.error(
          "Failed to award XP for starting mechanic chat:",
          xpError
        );
        // Don't fail the chat creation if XP awarding fails
      }

      // Navigate to the chat page
      navigate(`/mechanic-support/chat/${chatId}`);

      toast.success(`Starting chat with ${mechanic.full_name}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      toast.error("Failed to start chat. Please try again.");
    } finally {
      setStartingChat(null);
    }
  };

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Callback request submitted");
    // TODO: Implement callback request
  };

  const handleExpertiseToggle = (expertise: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(expertise)
        ? prev.filter((item) => item !== expertise)
        : [...prev, expertise]
    );
  };

  const handleClearFilters = () => {
    setSelectedSpecialties([]);
  };

  // New handler functions for enhanced features
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to get your location");
      }
    );
  };

  const handleBookAppointment = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setShowBookingModal(true);
  };

  const handleBookingComplete = (appointment: Appointment) => {
    setShowBookingModal(false);
    setSelectedMechanic(null);
    toast.success("Appointment booked successfully!");
    // Could redirect to appointments page or show confirmation
  };

  const handleStartVideoCall = async (
    mechanic: Mechanic,
    callType: "voice" | "video"
  ) => {
    try {
      setStartingCall(mechanic.id);

      if (!mechanic.is_available_for_calls) {
        toast.error("This mechanic is not available for calls at the moment");
        return;
      }

      const videoCall = await initiateVideoCall(mechanic.id, callType);
      setActiveVideoCall(videoCall);
      setShowVideoCall(true);

      // Award XP for using live help
      await awardXp(XP_VALUES.LIVE_HELP_CALL);
    } catch (error) {
      console.error("Failed to start video call:", error);
      toast.error("Failed to start call. Please try again.");
    } finally {
      setStartingCall(null);
    }
  };

  const handleCallEnd = (duration: number, totalCost: number) => {
    setShowVideoCall(false);
    setActiveVideoCall(null);

    // Could show cost summary or redirect to payment
    toast.success(
      `Call ended. Duration: ${Math.floor(duration / 60)}:${(duration % 60)
        .toString()
        .padStart(2, "0")}`
    );
  };

  const calculateDistance = (mechanic: Mechanic) => {
    if (!userLocation || !mechanic.latitude || !mechanic.longitude) return null;

    const R = 3959; // Earth's radius in miles
    const dLat = ((mechanic.latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((mechanic.longitude - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((mechanic.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  };

  const MechanicCard: React.FC<{ mechanic: Mechanic }> = ({ mechanic }) => {
    const distance = calculateDistance(mechanic);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              {mechanic.is_online && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {mechanic.full_name}
                  {mechanic.is_certified && (
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </h3>
                {mechanic.is_certified && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Shield className="h-4 w-4 mr-1" />
                    <span className="text-sm">Certified</span>
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{mechanic.location}</span>
                  {distance && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      • {distance.toFixed(1)} miles away
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span>{mechanic.specialties.join(", ")}</span>
                </div>
                {mechanic.hourly_rate && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>${mechanic.hourly_rate}/hour</span>
                  </div>
                )}
                {mechanic.average_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>
                      {mechanic.average_rating.toFixed(1)} (
                      {mechanic.total_reviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartChat(mechanic)}
                  disabled={startingChat === mechanic.id}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  {startingChat === mechanic.id ? "Starting..." : "Chat"}
                </button>

                <button
                  onClick={() => handleBookAppointment(mechanic)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  <Calendar className="h-4 w-4" />
                  Book
                </button>

                {mechanic.is_available_for_calls && (
                  <>
                    <button
                      onClick={() => handleStartVideoCall(mechanic, "voice")}
                      disabled={startingCall === mechanic.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      {startingCall === mechanic.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Call"
                      )}
                    </button>

                    <button
                      onClick={() => handleStartVideoCall(mechanic, "video")}
                      disabled={startingCall === mechanic.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Video className="h-4 w-4" />
                      {startingCall === mechanic.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Video"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Talk to a Mechanic
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Get expert help from certified mechanics
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("findMobile")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "findMobile"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <MapPin className="h-5 w-5 inline-block mr-2" />
              Find Mobile Mechanic
            </button>
            <button
              onClick={() => setActiveTab("callChat")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "callChat"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Phone className="h-5 w-5 inline-block mr-2" />
              Call or Chat with Mechanic
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "findMobile" ? (
            <motion.div
              key="findMobile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filter Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNearbyOnly(!nearbyOnly)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        nearbyOnly
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Nearby Only</span>
                    </button>
                  </div>
                </div>
                {mechanic.hourly_rate && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>${mechanic.hourly_rate}/hour</span>
                  </div>
                )}
                {mechanic.average_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>
                      {mechanic.average_rating.toFixed(1)} (
                      {mechanic.total_reviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartChat(mechanic)}
                  disabled={startingChat === mechanic.id}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  {startingChat === mechanic.id ? "Starting..." : "Chat"}
                </button>

                <button
                  onClick={() => handleBookAppointment(mechanic)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  <Calendar className="h-4 w-4" />
                  Book
                </button>

                {mechanic.is_available_for_calls && (
                  <>
                    <button
                      onClick={() => handleStartVideoCall(mechanic, "voice")}
                      disabled={startingCall === mechanic.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      {startingCall === mechanic.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Call"
                      )}
                    </button>

                    <button
                      onClick={() => handleStartVideoCall(mechanic, "video")}
                      disabled={startingCall === mechanic.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Video className="h-4 w-4" />
                      {startingCall === mechanic.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Video"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Talk to a Mechanic
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Get expert help from certified mechanics
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
            <button
              onClick={() => setActiveTab("findMobile")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "findMobile"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <MessageSquare className="h-5 w-5 inline-block mr-2" />
              Find Mobile Mechanic
            </button>
            <button
              onClick={() => setActiveTab("callOrChat")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "callOrChat"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Phone className="h-5 w-5 inline-block mr-2" />
              Call or Chat with Mechanic
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "findMobile" ? (
            <motion.div
              key="findMobile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filter Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Filter className="h-5 w-5" />
                    <span>Filters & Search</span>
                    {(selectedSpecialties.length > 0 || nearbyOnly) && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        {selectedSpecialties.length + (nearbyOnly ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  {(selectedSpecialties.length > 0 || nearbyOnly) && (
                    <button
                      onClick={() => {
                        handleClearFilters();
                        setNearbyOnly(false);
                      }}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>

                {/* Quick location toggle */}
                <div className="mb-4 flex items-center gap-4">
                  <button
                    onClick={() => setNearbyOnly(!nearbyOnly)}
                    disabled={!userLocation}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      nearbyOnly
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Navigation className="h-4 w-4" />
                    Nearby Only
                  </button>

                  {!userLocation && locationError && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <span>Location access needed for nearby search</span>
                      <button
                        onClick={getUserLocation}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Enable
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Expertise Areas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {EXPERTISE_AREAS.map((expertise) => (
                            <motion.button
                              key={expertise}
                              onClick={() => handleExpertiseToggle(expertise)}
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                selectedSpecialties.includes(expertise)
                                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              {expertise}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              ) : mechanics.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <Wrench className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {selectedSpecialties.length > 0
                      ? "No mechanics match your filters"
                      : "No mechanics available"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedSpecialties.length > 0
                      ? "Try adjusting your filters or check back later"
                      : "Please try again later or request a callback"}
                  </p>
                  {selectedSpecialties.length > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                mechanics.map((mechanic) => (
                  <MechanicCard key={mechanic.id} mechanic={mechanic} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="callOrChat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Request a Callback
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We'll help you schedule a call with a certified mechanic.
              </p>
              <form onSubmit={handleRequestCallback} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Preferred Time
                  </label>
                  <select
                    id="time"
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a time</option>
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 8PM)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Request Callback
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedMechanic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <BookingCalendar
                mechanic={selectedMechanic}
                onBookingComplete={handleBookingComplete}
                onClose={() => setShowBookingModal(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call Modal */}
      <AnimatePresence>
        {showVideoCall && activeVideoCall && (
          <VideoCallModal
            isOpen={showVideoCall}
            onClose={() => setShowVideoCall(false)}
            videoCall={activeVideoCall}
            isInitiator={true}
            onCallEnd={handleCallEnd}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MechanicSupportPage;
