import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import OfferForm from './OfferForm';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  receiverId: string;
  partTitle: string;
  partPrice: number;
  onSuccess?: () => void;
}

const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  partId,
  receiverId,
  partTitle,
  partPrice,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <OfferForm
          partId={partId}
          receiverId={receiverId}
          partTitle={partTitle}
          partPrice={partPrice}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </motion.div>
    </div>
  );
};

export default OfferModal;