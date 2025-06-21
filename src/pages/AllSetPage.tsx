import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShoppingBag, Users, Wrench, Car, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProfile } from '../lib/supabase';
import Confetti from '../components/Confetti';
import { playPopSound } from '../lib/utils';

const AllSetPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Play sound effect when component mounts
    playPopSound();

    // Load user profile to get name
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile?.full_name) {
          // Get first name only
          setUserName(profile.full_name.split(' ')[0]);
        } else if (profile?.username) {
          setUserName(profile.username);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleAction = (path: string) => {
    playPopSound();
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-gray-900 dark:to-blue-900 p-4 flex items-center justify-center">
      {showConfetti && (
        <Confetti 
          duration={5000} 
          onComplete={() => setShowConfetti(false)} 
          pieces={300}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="h-8 w-8" />
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold"
            >
              You're all set, {userName || 'there'}! 🎉
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90"
          >
            Your first diagnostic awaits. Or explore the marketplace, clubs, and more.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <div className="p-8 space-y-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => handleAction('/diagnostic')}
            className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench className="h-6 w-6" />
              </div>
              <span className="text-lg">Run Diagnostic</span>
            </div>
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => handleAction('/marketplace')}
            className="w-full flex items-center justify-between p-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-green-500/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className="text-lg">Browse Parts</span>
            </div>
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => handleAction('/clubs')}
            className="w-full flex items-center justify-between p-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg hover:shadow-purple-500/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-lg">Join a Club</span>
            </div>
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Car className="h-5 w-5" />
              <span>Your garage is ready</span>
            </div>
            <button
              onClick={() => handleAction('/vehicles')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
            >
              Manage Vehicles
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AllSetPage;