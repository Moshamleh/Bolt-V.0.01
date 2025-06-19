import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onExploreMarketplace: () => void;
  onSetupVehicle: () => void;
  userName?: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ 
  isOpen, 
  onExploreMarketplace, 
  onSetupVehicle, 
  userName = '' 
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <button
            onClick={onExploreMarketplace}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="h-6 w-6 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <h2 className="text-2xl font-bold">Welcome to Bolt Auto{userName ? `, ${userName}` : ''}!</h2>
          </div>
          
          <p className="text-white/90">
            We've got your back with diagnostics, repairs, and parts. Let's get your garage set up.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onSetupVehicle}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🚗 Set Up My Vehicle
            </button>
            <button
              onClick={onExploreMarketplace}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              🛒 Explore Marketplace
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeModal;