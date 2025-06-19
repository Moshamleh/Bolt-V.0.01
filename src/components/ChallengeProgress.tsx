import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronRight, Loader2 } from 'lucide-react';
import { Challenge, UserChallenge } from '../lib/supabase';
import { getInProgressChallenges } from '../lib/supabase_modules/challenges';
import { useNavigate } from 'react-router-dom';

interface ChallengeProgressProps {
  limit?: number;
  className?: string;
}

const ChallengeProgress: React.FC<ChallengeProgressProps> = ({
  limit = 3,
  className = ''
}) => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        const data = await getInProgressChallenges();
        setChallenges(data);
      } catch (err) {
        console.error('Failed to load challenges:', err);
        setError('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };
    
    loadChallenges();
  }, []);
  
  const displayChallenges = challenges.slice(0, limit);
  
  const handleViewAllClick = () => {
    navigate('/challenges');
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Challenge Progress
            </h2>
          </div>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Challenge Progress
            </h2>
          </div>
        </div>
        
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Challenge Progress
          </h2>
        </div>
        
        <button
          onClick={handleViewAllClick}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {displayChallenges.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No active challenges
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Check the challenges page to start new challenges
          </p>
          <button
            onClick={handleViewAllClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Challenges
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayChallenges.map((userChallenge) => (
            <div key={userChallenge.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {userChallenge.challenge?.name}
                </h3>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {userChallenge.challenge?.xp_reward} XP
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress: {userChallenge.current_progress}/{userChallenge.challenge?.target_value}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {Math.round((userChallenge.current_progress / (userChallenge.challenge?.target_value || 1)) * 100)}%
                </span>
              </div>
              
              <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round((userChallenge.current_progress / (userChallenge.challenge?.target_value || 1)) * 100))}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                />
              </div>
            </div>
          ))}
          
          {challenges.length > limit && (
            <button
              onClick={handleViewAllClick}
              className="w-full py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View {challenges.length - limit} more challenges
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeProgress;