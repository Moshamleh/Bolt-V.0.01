import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  MapPin,
  Phone,
  Video,
  MessageSquare,
  Calendar,
  Filter,
  User,
  CheckCircle,
  Shield,
  DollarSign,
  Star,
  Clock,
  Loader2,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  getApprovedMechanics,
  getOrCreateMechanicChat,
  type Mechanic,
} from "../lib/supabase_modules/mechanics";
import { awardXp, XP_VALUES } from "../lib/supabase_modules/gamification";

export default function MechanicSupportPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"findMobile" | "callChat">(
    "findMobile"
  );
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        setLoading(true);
        const data = await getApprovedMechanics();
        setMechanics(data);
      } catch (err) {
        console.error("Failed to load mechanics:", err);
        setError("Failed to load mechanics");
      } finally {
        setLoading(false);
      }
    };

    loadMechanics();
  }, []);

  const handleStartChat = async (mechanic: Mechanic) => {
    setStartingChat(mechanic.id);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Please log in to start a chat");
        navigate("/login");
        return;
      }

      const chatId = await getOrCreateMechanicChat(user.id, mechanic.id);

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
      }

      navigate(`/mechanic-support/chat/${chatId}`);
      toast.success(`Starting chat with ${mechanic.full_name}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      toast.error("Failed to start chat. Please try again.");
    } finally {
      setStartingChat(null);
    }
  };

  const MechanicCard: React.FC<{ mechanic: Mechanic }> = ({ mechanic }) => {
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
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{mechanic.average_rating.toFixed(1)} rating</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{mechanic.is_online ? "Online now" : "Offline"}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleStartChat(mechanic)}
                  disabled={startingChat === mechanic.id}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  {startingChat === mechanic.id ? "Starting..." : "Chat"}
                </button>

                <button
                  onClick={() => toast.info("Booking feature coming soon!")}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  <Calendar className="h-4 w-4" />
                  Book
                </button>

                {mechanic.is_available_for_calls && (
                  <>
                    <button
                      onClick={() =>
                        toast.info("Voice call feature coming soon!")
                      }
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      Voice
                    </button>
                    <button
                      onClick={() =>
                        toast.info("Video call feature coming soon!")
                      }
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Video className="h-4 w-4" />
                      Video
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
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {!loading && !error && mechanics.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No mechanics available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please check back later for available mechanics.
                  </p>
                </div>
              )}

              {!loading && !error && mechanics.length > 0 && (
                <div className="grid gap-6">
                  {mechanics.map((mechanic) => (
                    <MechanicCard key={mechanic.id} mechanic={mechanic} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="callChat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Phone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Instant Help
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Request a callback from a certified mechanic
              </p>
              <button
                onClick={() => toast.info("Callback feature coming soon!")}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mx-auto"
              >
                <Phone className="h-5 w-5" />
                Request Callback
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
