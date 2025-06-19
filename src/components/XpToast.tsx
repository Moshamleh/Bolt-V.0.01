import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface XpToastProps {
  amount: number;
  reason?: string;
}

const XpToast: React.FC<XpToastProps> = ({ amount, reason }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg"
    >
      <div className="p-1 bg-white/20 rounded-full">
        <Zap className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold">+{amount} XP</div>
        {reason && <div className="text-sm text-white/90">{reason}</div>}
      </div>
    </motion.div>
  );
};

export default XpToast;