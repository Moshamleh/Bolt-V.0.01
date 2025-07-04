import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MobilePageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MobilePageMenu: React.FC<MobilePageMenuProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-neutral-100 dark:bg-gray-800 shadow-xl z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-neutral-500 dark:text-gray-400 hover:text-neutral-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-64px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobilePageMenu;