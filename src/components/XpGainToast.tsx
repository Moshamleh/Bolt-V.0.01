import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import XpToast from './XpToast';
import LevelUpModal from './LevelUpModal';

const XpGainToast: React.FC = () => {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(0);

  useEffect(() => {
    // Set up real-time subscription for XP logs
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('xp-logs-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_logs',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          const xpLog = payload.new as {
            amount: number;
            reason: string;
            previous_level: number;
            new_level: number;
          };
          
          // Show XP toast
          toast.custom((t) => (
            <XpToast amount={xpLog.amount} reason={xpLog.reason} />
          ));
          
          // Check for level up
          if (xpLog.new_level > xpLog.previous_level) {
            setPreviousLevel(xpLog.previous_level);
            setNewLevel(xpLog.new_level);
            setShowLevelUpModal(true);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

  return (
    <>
      <Toaster position="bottom-right" />
      <LevelUpModal 
        isOpen={showLevelUpModal} 
        onClose={() => setShowLevelUpModal(false)} 
        level={newLevel}
        previousLevel={previousLevel}
      />
    </>
  );
};

export default XpGainToast;