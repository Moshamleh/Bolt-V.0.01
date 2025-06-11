import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, MessageSquare, Phone, Shield, MapPin, Star, User, CheckCircle } from 'lucide-react';
import { getApprovedMechanics, getOrCreateMechanicChat, Mechanic } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const MechanicSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat');
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const data = await getApprovedMechanics();
        setMechanics(data);
      } catch (err) {
        console.error('Failed to load mechanics:', err);
        setError('Failed to load mechanics');
      } finally {
        setLoading(false);
      }
    };

    loadMechanics();
  }, []);

  const handleStartChat = async (mechanic: Mechanic) => {
    setStartingChat(mechanic.id);
    try {
      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Please log in to start a chat');
        navigate('/login');
        return;
      }

      // Create or get existing chat
      const chatId = await getOrCreateMechanicChat(user.id, mechanic.id);
      
      // Navigate to the chat page
      navigate(`/mechanic-support/chat/${chatId}`);
      
      toast.success(`Starting chat with ${mechanic.full_name}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setStartingChat(null);
    }
  };

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Callback request submitted');
    // TODO: Implement callback request
  };

  const MechanicCard: React.FC<{ mechanic: Mechanic }> = ({ mechanic }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
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
                <span>{mechanic.specialties.join(', ')}</span>
              </div>
            </div>
            <button
              onClick={() => handleStartChat(mechanic)}
              disabled={startingChat === mechanic.id}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="h-5 w-5" />
              {startingChat === mechanic.id ? 'Starting Chat...' : 'Start Chat'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

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
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="h-5 w-5 inline-block mr-2" />
              Chat with a Mechanic
            </button>
            <button
              onClick={() => setActiveTab('call')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'call'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Phone className="h-5 w-5 inline-block mr-2" />
              Call a Mechanic
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6">
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
                    No mechanics available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please try again later or request a callback
                  </p>
                </div>
              ) : (
                mechanics.map((mechanic) => (
                  <MechanicCard key={mechanic.id} mechanic={mechanic} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="call"
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
    </div>
  );
};

export default MechanicSupportPage;