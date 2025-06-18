import React from 'react';
import { motion } from 'framer-motion';
import { getXpProgress, getLevelName } from '../lib/xpSystem';

interface XpProgressBarProps {
  xp: number;
  level: number;
  className?: string;
  showDetails?: boolean;
}

const XpProgressBar: React.FC<XpProgressBarProps> = ({ 
  xp, 
  level, 
  className = '',
  showDetails = true
}) => {
  const { currentXp, maxXp, percentage, nextLevel } = getXpProgress(xp, level);
  const levelName = getLevelName(level);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 ${className}`}>
      {showDetails && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Level {level} – {levelName} ({currentXp}/{maxXp} XP)
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {maxXp - currentXp} XP until level {nextLevel}
          </span>
        </div>
      )}
      
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-glowing-gradient rounded-full shadow-glow"
        />
      </div>
      
      {!showDetails && (
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{currentXp} XP</span>
          <span>{maxXp} XP</span>
        </div>
      )}
    </div>
  );
};

export default XpProgressBar;