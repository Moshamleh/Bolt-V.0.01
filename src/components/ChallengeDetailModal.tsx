import React from 'react';
import { motion } from 'framer-motion';
import { X, Award, Zap, CheckCircle, Calendar, Clock } from 'lucide-react';
import { UserChallenge } from '../lib/supabase';
import { format } from 'date-fns';

interface ChallengeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userChallenge: UserChallenge;
}

const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  isOpen,
  onClose,
  userChallenge
}) => {
  if (!isOpen || !userChallenge.challenge) return null;
  
  const { challenge, current_progress, completed, completed_at } = userChallenge;
  const progressPercentage = Math.min(100, Math.round((current_progress / challenge.target_value) * 100));
  
  // Get color based on challenge frequency
  const getColorClasses = () => {
    if (completed) return 'from-green-500 to-emerald-600';
    
    switch (challenge.frequency) {
      case 'daily':
        return 'from-blue-500 to-indigo-600';
      case 'weekly':
        return 'from-purple-500 to-indigo-600';
      default:
        return 'from-amber-500 to-orange-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header with gradient background */}
        <div className={`relative bg-gradient-to-r ${getColorClasses()} p-6 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              {completed ? <CheckCircle className="h-6 w-6" /> : <Award className="h-6 w-6" />}
            </div>
            <h2 className="text-2xl font-bold">{challenge.name}</h2>
          </div>
          
          <p className="text-white/90">
            {challenge.description}
          </p>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
              {challenge.frequency === 'daily' ? 'Daily Challenge' : 
               challenge.frequency === 'weekly' ? 'Weekly Challenge' : 
               'One-time Challenge'}
            </span>
            
            <span className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              {challenge.xp_reward} XP Reward
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Progress</h3>
            
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {current_progress} of {challenge.target_value} completed
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progressPercentage}%
              </span>
            </div>
            
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full ${
                  completed 
                    ? 'bg-green-500 dark:bg-green-400' 
                    : 'bg-blue-500 dark:bg-blue-400'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {completed && completed_at && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Challenge Completed!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                You completed this challenge on {format(new Date(completed_at), 'MMMM d, yyyy')}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {(challenge.start_date || challenge.end_date) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Time Frame</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {challenge.start_date && (
                      <p>Starts: {format(new Date(challenge.start_date), 'MMMM d, yyyy')}</p>
                    )}
                    {challenge.end_date && (
                      <p>Ends: {format(new Date(challenge.end_date), 'MMMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Challenge Type</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {challenge.type.includes('diagnostic') && 'Run diagnostics with Bolt AI'}
                  {challenge.type.includes('part') && 'List parts in the marketplace'}
                  {challenge.type.includes('club') && 'Participate in car clubs'}
                  {challenge.type.includes('service') && 'Track vehicle service records'}
                  {challenge.type.includes('vehicle') && 'Add vehicles to your garage'}
                  {challenge.type.includes('feedback') && 'Provide feedback on AI diagnostics'}
                </p>
              </div>
            </div>
            
            {challenge.badge_reward_id && (
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Badge Reward</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete this challenge to earn a special badge!
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChallengeDetailModal;