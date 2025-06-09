import React, { useState } from 'react';
import { MessageSquare, HelpCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

const SupportFeedbackSection: React.FC = () => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@boltauto.com';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Help & Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get help or send us feedback</p>
          </div>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            Send Feedback
          </button>

          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
            Contact Support
          </button>
        </div>
      </div>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};

export default SupportFeedbackSection;