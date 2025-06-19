import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserXp, getXpProgress, getLevelName } from '../lib/xpSystem';

interface XpData {
  xp: number;
  level: number;
  currentXp: number;
  maxXp: number;
  percentage: number;
  nextLevel: number;
  levelName: string;
  loading: boolean;
  error: string | null;
}

export function useXp(): XpData {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadXpData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get user's XP data
        const { data, error: xpError } = await supabase
          .from('users')
          .select('xp, level')
          .eq('id', user.id)
          .single();
        
        if (xpError) throw xpError;
        
        setXp(data?.xp || 0);
        setLevel(data?.level || 1);
      } catch (err) {
        console.error('Failed to load XP data:', err);
        setError('Failed to load XP data');
      } finally {
        setLoading(false);
      }
    };
    
    loadXpData();
    
    // Set up real-time subscription for XP changes
    const channel = supabase
      .channel('xp-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`,
      }, (payload) => {
        const newData = payload.new as { xp: number; level: number };
        setXp(newData.xp || 0);
        setLevel(newData.level || 1);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate XP progress
  const { currentXp, maxXp, percentage, nextLevel } = getXpProgress(xp, level);
  const levelName = getLevelName(level);

  return {
    xp,
    level,
    currentXp,
    maxXp,
    percentage,
    nextLevel,
    levelName,
    loading,
    error
  };
}