import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, X, Zap, ArrowUp } from 'lucide-react';
import { getLevelName } from '../lib/xpSystem';
import Confetti from './Confetti';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  previousLevel: number;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ 
  isOpen, 
  onClose, 
  level,
  previousLevel
}) => {
  // Auto-close after 10 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const levelName = getLevelName(level);
  const previousLevelName = getLevelName(previousLevel);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Confetti duration={5000} />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="p-8 text-center text-white">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
            </div>
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center animate-badge-unlock">
                <Award className="h-12 w-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
                <ArrowUp className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Level Up!</h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="px-3 py-1 bg-white/20 rounded-lg">
              <span className="text-lg font-semibold">{previousLevelName}</span>
            </div>
            <Zap className="h-5 w-5" />
            <div className="px-3 py-1 bg-white/20 rounded-lg">
              <span className="text-lg font-semibold">{levelName}</span>
            </div>
          </div>
          
          <p className="text-white/90 mb-6">
            Congratulations! You've reached <strong>Level {level}</strong>. Keep up the great work!
          </p>
          
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Level {level} Perks:</h3>
            <ul className="text-left space-y-2 text-white/90">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span>Exclusive {levelName} badge</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span>Increased visibility in the community</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span>New diagnostic capabilities unlocked</span>
              </li>
            </ul>
          </div>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LevelUpModal;