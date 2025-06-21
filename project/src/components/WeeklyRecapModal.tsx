import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Zap, MessageSquare, Package, Users, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { playPopSound } from '../lib/utils';
import Confetti from './Confetti';

interface WeeklyStats {
  diagnoses: number;
  partsListed: number;
  clubsJoined: number;
  messagesExchanged: number;
  serviceRecordsAdded: number;
}

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeeklyRecapModal: React.FC<WeeklyRecapModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<WeeklyStats>({
    diagnoses: 0,
    partsListed: 0,
    clubsJoined: 0,
    messagesExchanged: 0,
    serviceRecordsAdded: 0
  });
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardType, setRewardType] = useState<'badge' | 'points' | 'confetti'>('confetti');
  const [badgeName, setBadgeName] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchWeeklyStats = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString();
        
        // Get diagnoses count
        const { count: diagnosesCount } = await supabase
          .from('diagnoses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('timestamp', oneWeekAgoStr);
        
        // Get parts listed count
        const { count: partsCount } = await supabase
          .from('parts')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .gte('created_at', oneWeekAgoStr);
        
        // Get clubs joined count
        const { count: clubsCount } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('joined_at', oneWeekAgoStr);
        
        // Get messages count (both part messages and mechanic messages)
        const { count: partMessagesCount } = await supabase
          .from('part_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id)
          .gte('created_at', oneWeekAgoStr);
        
        const { count: mechanicMessagesCount } = await supabase
          .from('mechanic_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id)
          .gte('created_at', oneWeekAgoStr);
        
        // Get service records count
        const { count: serviceRecordsCount } = await supabase
          .from('service_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgoStr);
        
        setStats({
          diagnoses: diagnosesCount || 0,
          partsListed: partsCount || 0,
          clubsJoined: clubsCount || 0,
          messagesExchanged: (partMessagesCount || 0) + (mechanicMessagesCount || 0),
          serviceRecordsAdded: serviceRecordsCount || 0
        });
        
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [isOpen]);

  const handleClaimReward = async () => {
    // Determine reward type randomly
    const randomValue = Math.random();
    let rewardType: 'badge' | 'points' | 'confetti';
    
    if (randomValue < 0.2) {
      rewardType = 'badge';
    } else if (randomValue < 0.6) {
      rewardType = 'points';
    } else {
      rewardType = 'confetti';
    }
    
    setRewardType(rewardType);
    
    try {
      // Play sound effect
      playPopSound();
      
      // Show confetti
      setShowConfetti(true);
      
      // Handle different reward types
      if (rewardType === 'badge') {
        // Award a random badge
        const badges = [
          'Weekly Warrior',
          'Diagnostic Detective',
          'Parts Pro',
          'Club Champion'
        ];
        
        const randomBadge = badges[Math.floor(Math.random() * badges.length)];
        setBadgeName(randomBadge);
        
        // In a real implementation, we would award the badge here
        // await awardBadge(undefined, randomBadge, "Weekly reward");
      } else if (rewardType === 'points') {
        // In a real implementation, we would award points here
        // const pointsToAward = Math.floor(Math.random() * 100) + 50;
        // await awardPoints(pointsToAward);
      }
      
      setRewardClaimed(true);
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Your Weekly Bolt Recap</h2>
          </div>
          
          <p className="text-white/90">
            Here's what you've accomplished in the past 7 days
          </p>
        </div>

        {/* Stats */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Diagnoses Run</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{stats.diagnoses}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 dark:bg-blue-500"
                      style={{ width: `${Math.min(stats.diagnoses * 20, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Parts Listed</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{stats.partsListed}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 dark:bg-green-500"
                      style={{ width: `${Math.min(stats.partsListed * 33, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Clubs Joined</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{stats.clubsJoined}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 dark:bg-purple-500"
                      style={{ width: `${Math.min(stats.clubsJoined * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Messages Exchanged</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{stats.messagesExchanged}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-600 dark:bg-amber-500"
                      style={{ width: `${Math.min(stats.messagesExchanged * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reward Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {!rewardClaimed ? (
              <button
                onClick={handleClaimReward}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
              >
                <Award className="h-5 w-5" />
                🔓 Claim Weekly Reward
              </button>
            ) : (
              <div className="text-center">
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4"
                  >
                    {rewardType === 'badge' && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3 animate-badge-unlock">
                          <Award className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          New Badge Unlocked!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          You earned the "{badgeName}" badge
                        </p>
                      </div>
                    )}
                    
                    {rewardType === 'points' && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center mb-3 animate-badge-unlock">
                          <Zap className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Points Awarded!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          You earned {Math.floor(Math.random() * 100) + 50} XP points
                        </p>
                      </div>
                    )}
                    
                    {rewardType === 'confetti' && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-3 animate-badge-unlock">
                          <Zap className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Reward Claimed!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Keep up the great work!
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                <button
                  onClick={onClose}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WeeklyRecapModal;