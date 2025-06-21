import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Loader2, ArrowLeft, Users, ShoppingBag, Zap, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLeaderboardData, LeaderboardData } from '../lib/supabase';
import LeaderboardTable from '../components/LeaderboardTable';

type LeaderboardTab = 'overall' | 'diagnosticians' | 'sellers' | 'contributors';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('overall');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboardData = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboardData('all');
        setLeaderboardData(data);
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboardData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const tabs = [
    { id: 'overall', label: 'Overall', icon: <Trophy className="h-5 w-5" /> },
    { id: 'diagnosticians', label: 'Diagnosticians', icon: <Zap className="h-5 w-5" /> },
    { id: 'sellers', label: 'Marketplace', icon: <ShoppingBag className="h-5 w-5" /> },
    { id: 'contributors', label: 'Contributors', icon: <Users className="h-5 w-5" /> },
  ];

  const getLeaderboardColumns = () => {
    switch (activeTab) {
      case 'overall':
        return [
          { key: 'total_score', label: 'Score', format: (val: number) => formatNumber(val) },
          { key: 'total_diagnoses', label: 'Diagnoses', format: (val: number) => formatNumber(val) },
          { key: 'total_badges', label: 'Badges', format: (val: number) => formatNumber(val) },
        ];
      case 'diagnosticians':
        return [
          { key: 'total_diagnoses', label: 'Diagnoses', format: (val: number) => formatNumber(val) },
          { key: 'resolved_diagnoses', label: 'Resolved', format: (val: number) => formatNumber(val) },
          { key: 'helpful_feedback', label: 'Helpful', format: (val: number) => formatNumber(val) },
        ];
      case 'sellers':
        return [
          { key: 'parts_sold', label: 'Parts Sold', format: (val: number) => formatNumber(val) },
          { key: 'parts_listed', label: 'Parts Listed', format: (val: number) => formatNumber(val) },
          { key: 'total_sales_value', label: 'Sales Value', format: (val: number) => formatCurrency(val) },
        ];
      case 'contributors':
        return [
          { key: 'total_score', label: 'Score', format: (val: number) => formatNumber(val) },
          { key: 'clubs_founded', label: 'Clubs Founded', format: (val: number) => formatNumber(val) },
          { key: 'clubs_joined', label: 'Clubs Joined', format: (val: number) => formatNumber(val) },
        ];
      default:
        return [];
    }
  };

  const getLeaderboardDescription = () => {
    switch (activeTab) {
      case 'overall':
        return 'Top users ranked by overall activity and contributions';
      case 'diagnosticians':
        return 'Users who have run the most diagnostic sessions';
      case 'sellers':
        return 'Top sellers in the marketplace';
      case 'contributors':
        return 'Most active community contributors';
      default:
        return '';
    }
  };

  const getUserRank = () => {
    if (!leaderboardData?.userRank) return null;
    
    switch (activeTab) {
      case 'overall':
        return leaderboardData.userRank.overall;
      case 'diagnosticians':
        return leaderboardData.userRank.diagnosticians;
      case 'sellers':
        return leaderboardData.userRank.sellers;
      case 'contributors':
        return leaderboardData.userRank.contributors;
      default:
        return null;
    }
  };

  const getCurrentLeaderboardData = () => {
    if (!leaderboardData) return [];
    
    switch (activeTab) {
      case 'overall':
        return leaderboardData.overall;
      case 'diagnosticians':
        return leaderboardData.diagnosticians;
      case 'sellers':
        return leaderboardData.sellers;
      case 'contributors':
        return leaderboardData.contributors;
      default:
        return [];
    }
  };

  if (loading && !leaderboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboards</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                See how you rank against other Bolt Auto users
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top Users Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tabs.map((tab) => {
            const data = leaderboardData?.[tab.id as LeaderboardTab] || [];
            const topUser = data[0];
            
            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                }`}
                onClick={() => setActiveTab(tab.id as LeaderboardTab)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <h3 className="font-medium text-gray-900 dark:text-white">{tab.label}</h3>
                  </div>
                  {topUser && (
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  )}
                </div>
                
                {topUser ? (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {topUser.avatar_url ? (
                          <img
                            src={topUser.avatar_url}
                            alt={topUser.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {topUser.full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tab.id === 'overall' && `Score: ${formatNumber(topUser.total_score)}`}
                          {tab.id === 'diagnosticians' && `Diagnoses: ${formatNumber(topUser.total_diagnoses)}`}
                          {tab.id === 'sellers' && `Parts Sold: ${formatNumber(topUser.parts_sold)}`}
                          {tab.id === 'contributors' && `Score: ${formatNumber(topUser.total_score)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-16">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LeaderboardTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <LeaderboardTable
            data={getCurrentLeaderboardData()}
            title={tabs.find(tab => tab.id === activeTab)?.label || ''}
            description={getLeaderboardDescription()}
            loading={loading}
            error={error}
            userRank={getUserRank()}
            columns={getLeaderboardColumns()}
          />
        </motion.div>

        {/* Achievements Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How to Climb the Leaderboard
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Run diagnostic sessions and mark them as resolved</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span>List and sell parts in the marketplace</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Create and join car clubs</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Earn badges by completing achievements</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Track your vehicle maintenance with service records</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;