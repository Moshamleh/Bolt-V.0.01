import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Award, Filter, Search, X } from 'lucide-react';
import { Challenge, UserChallenge } from '../lib/supabase';
import { getUserChallenges, getInProgressChallenges, getCompletedChallenges } from '../lib/supabase_modules/challenges';
import ChallengeCard from './ChallengeCard';
import ChallengeDetailModal from './ChallengeDetailModal';
import { extractErrorMessage } from '../lib/errorHandling';

interface ChallengesListProps {
  filter?: 'all' | 'active' | 'completed';
  limit?: number;
  showSearch?: boolean;
  className?: string;
}

const ChallengesList: React.FC<ChallengesListProps> = ({
  filter = 'all',
  limit,
  showSearch = true,
  className = ''
}) => {
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<UserChallenge | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        let data: UserChallenge[] = [];
        
        switch (filter) {
          case 'active':
            data = await getInProgressChallenges();
            break;
          case 'completed':
            const response = await getCompletedChallenges();
            data = response.data;
            break;
          default:
            const allResponse = await getUserChallenges(undefined, true);
            data = allResponse.data;
            break;
        }
        
        setChallenges(data);
      } catch (err) {
        console.error('Failed to load challenges:', err);
        const errorMessage = extractErrorMessage(err);
        setError(`Failed to load challenges: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadChallenges();
  }, [filter]);
  
  const filteredChallenges = challenges.filter(challenge => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      challenge.challenge?.name.toLowerCase().includes(searchLower) ||
      challenge.challenge?.description.toLowerCase().includes(searchLower) ||
      challenge.challenge?.type.toLowerCase().includes(searchLower)
    );
  });
  
  const displayChallenges = limit ? filteredChallenges.slice(0, limit) : filteredChallenges;
  
  const handleChallengeClick = (challenge: UserChallenge) => {
    setSelectedChallenge(challenge);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        <p>{error}</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No challenges found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {filter === 'active' 
            ? 'You have no active challenges at the moment.' 
            : filter === 'completed'
            ? 'You haven\'t completed any challenges yet.'
            : 'No challenges are available at the moment.'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showSearch && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      
      <AnimatePresence>
        <div className="space-y-3">
          {displayChallenges.map((userChallenge) => (
            <ChallengeCard
              key={userChallenge.id}
              challenge={userChallenge.challenge!}
              userChallenge={userChallenge}
              onClick={() => handleChallengeClick(userChallenge)}
            />
          ))}
        </div>
      </AnimatePresence>
      
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

export default ChallengesList;