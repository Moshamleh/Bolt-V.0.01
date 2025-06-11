import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Sentiment = 'happy' | 'neutral' | 'angry';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sentiment) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          message: message.trim(),
          sentiment
        });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      onClose();
      setMessage('');
      setSentiment(null);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Send Feedback
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How was your experience?
            </label>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setSentiment('happy')}
                className={`text-4xl p-2 rounded-lg transition-colors ${
                  sentiment === 'happy'
                    ? 'bg-green-100 dark:bg-green-900/50 scale-110'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                😊
              </button>
              <button
                type="button"
                onClick={() => setSentiment('neutral')}
                className={`text-4xl p-2 rounded-lg transition-colors ${
                  sentiment === 'neutral'
                    ? 'bg-blue-100 dark:bg-blue-900/50 scale-110'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                😐
              </button>
              <button
                type="button"
                onClick={() => setSentiment('angry')}
                className={`text-4xl p-2 rounded-lg transition-colors ${
                  sentiment === 'angry'
                    ? 'bg-red-100 dark:bg-red-900/50 scale-110'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                😡
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Feedback
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us what you think..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || !sentiment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;