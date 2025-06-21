import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2, Award, ChevronRight } from 'lucide-react';
import { Challenge, UserChallenge } from '../lib/supabase';
import { getDailyChallenges, getUserChallengeProgress } from '../lib/supabase_modules/challenges';
import ChallengeCard from './ChallengeCard';
import ChallengeDetailModal from './ChallengeDetailModal';

interface DailyChallengesProps {
  className?: string;
  onViewAllClick?: () => void;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({
  className = '',
  onViewAllClick
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Record<string, UserChallenge>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<UserChallenge | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        
        // Load daily challenges
        const dailyChallenges = await getDailyChallenges();
        setChallenges(dailyChallenges);
        
        // Load user progress for each challenge
        const userProgress: Record<string, UserChallenge> = {};
        
        for (const challenge of dailyChallenges) {
          try {
            const progress = await getUserChallengeProgress(challenge.id);
            if (progress) {
              userProgress[challenge.id] = progress;
            }
          } catch (err) {
            console.error(`Failed to load progress for challenge ${challenge.id}:`, err);
          }
        }
        
        setUserChallenges(userProgress);
      } catch (err) {
        console.error('Failed to load daily challenges:', err);
        setError('Failed to load daily challenges');
      } finally {
        setLoading(false);
      }
    };
    
    loadChallenges();
  }, []);
  
  const handleChallengeClick = (challenge: Challenge) => {
    const userChallenge = userChallenges[challenge.id] || {
      id: '',
      user_id: '',
      challenge_id: challenge.id,
      current_progress: 0,
      completed: false,
      challenge
    };
    
    setSelectedChallenge(userChallenge);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Award className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No daily challenges available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Check back later for new challenges
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Challenges
          </h2>
        </div>
        
        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            userChallenge={userChallenges[challenge.id]}
            onClick={() => handleChallengeClick(challenge)}
          />
        ))}
      </div>
      
      {selectedChallenge && (
        <ChallengeDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          userChallenge={selectedChallenge}
        />
      )}
    </div>
  );
};

export default DailyChallenges;