import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { getLevelName } from '../lib/xpSystem';

interface XpLog {
  id: string;
  amount: number;
  reason: string;
  previous_xp: number;
  new_xp: number;
  previous_level: number;
  new_level: number;
  created_at: string;
}

const XpHistoryPanel: React.FC = () => {
  const [logs, setLogs] = useState<XpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    const loadXpLogs = async () => {
      try {
        setLoading(true);
        
        // Get user's XP logs
        const { data, error } = await supabase
          .from('xp_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(showAll ? 50 : 10);
        
        if (error) throw error;
        
        setLogs(data || []);
        
        // Get user's total XP
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('xp')
          .single();
        
        if (userError) throw userError;
        
        setTotalXp(userData?.xp || 0);
      } catch (err) {
        console.error('Failed to load XP logs:', err);
        setError('Failed to load XP history');
      } finally {
        setLoading(false);
      }
    };
    
    loadXpLogs();
  }, [showAll]);

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

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No XP activity yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete activities to earn XP and level up
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          XP History
        </h2>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total XP: {totalXp}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const levelUp = log.new_level > log.previous_level;
            
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
                  levelUp 
                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      levelUp 
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400' 
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    }`}>
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {levelUp ? 'Level Up!' : log.reason || 'XP Earned'}
                        </h3>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.amount > 0 
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                        }`}>
                          {log.amount > 0 ? `+${log.amount}` : log.amount} XP
                        </span>
                      </div>
                      
                      {levelUp && (
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Congratulations! You reached Level {log.new_level}: {getLevelName(log.new_level)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {format(new Date(log.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {format(new Date(log.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.previous_xp} → {log.new_xp}
                    </div>
                    {levelUp && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Level {log.previous_level} → {log.new_level}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show More
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default XpHistoryPanel;