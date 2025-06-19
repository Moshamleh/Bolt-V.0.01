import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, Clock, Zap, Trophy, ArrowRight } from 'lucide-react';
import { Challenge, UserChallenge } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onClick?: () => void;
  className?: string;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userChallenge,
  onClick,
  className = ''
}) => {
  const isCompleted = userChallenge?.completed || false;
  const progress = userChallenge?.current_progress || 0;
  const progressPercentage = Math.min(100, Math.round((progress / challenge.target_value) * 100));
  
  // Get icon based on challenge type
  const getIcon = () => {
    if (challenge.type.includes('diagnostic')) return <Zap className="h-5 w-5" />;
    if (challenge.type.includes('part')) return <Trophy className="h-5 w-5" />;
    if (challenge.type.includes('club')) return <Award className="h-5 w-5" />;
    if (challenge.type.includes('service')) return <Clock className="h-5 w-5" />;
    return <Award className="h-5 w-5" />;
  };
  
  // Get color based on challenge frequency
  const getColorClasses = () => {
    if (isCompleted) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    
    switch (challenge.frequency) {
      case 'daily':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-100 dark:border-blue-800';
      case 'weekly':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-100 dark:border-purple-800';
      default:
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-800';
    }
  };
  
  // Get badge for frequency
  const getFrequencyBadge = () => {
    switch (challenge.frequency) {
      case 'daily':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
            Daily
          </span>
        );
      case 'weekly':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
            Weekly
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">
            One-time
          </span>
        );
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-xl border p-4 cursor-pointer transition-all duration-300",
        getColorClasses(),
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isCompleted 
            ? "bg-green-200 dark:bg-green-800" 
            : "bg-white/50 dark:bg-gray-800/50"
        )}>
          {isCompleted ? <CheckCircle className="h-5 w-5" /> : getIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium">{challenge.name}</h3>
            {getFrequencyBadge()}
          </div>
          
          <p className="text-sm mb-3 line-clamp-2">{challenge.description}</p>
          
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress: {progress}/{challenge.target_value}</span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              {challenge.xp_reward} XP
            </span>
          </div>
          
          <div className="relative h-2 bg-white/30 dark:bg-gray-700/30 rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full rounded-full",
                isCompleted 
                  ? "bg-green-500 dark:bg-green-400" 
                  : "bg-blue-500 dark:bg-blue-400"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {isCompleted && (
            <div className="flex justify-end mt-2">
              <span className="text-xs flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed
              </span>
            </div>
          )}
        </div>
        
        <ArrowRight className="h-5 w-5 self-center opacity-70" />
      </div>
    </motion.div>
  );
};

export default ChallengeCard;