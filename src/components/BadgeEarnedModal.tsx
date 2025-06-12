import React from 'react';
import { motion } from 'framer-motion';
import { Award, X } from 'lucide-react';
import { UserEarnedBadge } from '../lib/supabase';

interface BadgeEarnedModalProps {
  badge: UserEarnedBadge;
  onClose: () => void;
}

const BadgeEarnedModal: React.FC<BadgeEarnedModalProps> = ({ badge, onClose }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'milestone':
        return 'from-blue-400 to-blue-600';
      case 'rare':
        return 'from-purple-400 to-purple-600';
      case 'exclusive':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'Common';
      case 'milestone':
        return 'Milestone';
      case 'rare':
        return 'Rare';
      case 'exclusive':
        return 'Exclusive';
      default:
        return 'Common';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300,
          duration: 0.4 
        }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Celebration Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.2,
            type: "spring", 
            damping: 15, 
            stiffness: 200 
          }}
          className="mb-6"
        >
          <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-full flex items-center justify-center shadow-2xl`}>
            {badge.icon_url ? (
              <img
                src={badge.icon_url}
                alt={badge.name}
                className="w-12 h-12 text-white"
                onError={(e) => {
                  // Fallback to Award icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Award className={`h-12 w-12 text-white ${badge.icon_url ? 'hidden' : ''}`} />
          </div>
        </motion.div>

        {/* Badge Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Achievement Unlocked!
          </h2>
          
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {badge.name}
          </h3>

          {badge.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {badge.description}
            </p>
          )}

          {badge.note && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4 italic">
              "{badge.note}"
            </p>
          )}

          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-800 dark:text-blue-200 mb-6">
            {getRarityLabel(badge.rarity)} Badge
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Nice! 🎉
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default BadgeEarnedModal;