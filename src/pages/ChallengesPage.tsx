import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Filter, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import ChallengesList from '../components/ChallengesList';
import DailyChallenges from '../components/DailyChallenges';

type ChallengeFilter = 'all' | 'active' | 'completed' | 'daily' | 'weekly' | 'one-time';

const ChallengesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ChallengeFilter>('all');
  
  const filterOptions: { id: ChallengeFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Challenges', icon: <Award className="h-5 w-5" /> },
    { id: 'active', label: 'In Progress', icon: <Clock className="h-5 w-5" /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle className="h-5 w-5" /> },
    { id: 'daily', label: 'Daily', icon: <Calendar className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Challenges</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete challenges to earn XP and badges
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === option.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge Content */}
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
        >
          {activeFilter === 'daily' ? (
            <DailyChallenges />
          ) : (
            <ChallengesList 
              filter={activeFilter === 'all' ? 'all' : activeFilter === 'completed' ? 'completed' : 'active'} 
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ChallengesPage;