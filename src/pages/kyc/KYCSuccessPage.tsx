import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const KYCSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  // Auto-redirect after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/marketplace');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          KYC Submitted Successfully!
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for submitting your verification documents. Our team will review your information within 24-48 hours and notify you once verified.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">What happens next?</h3>
          <ul className="text-blue-700 dark:text-blue-200 text-sm space-y-2">
            <li>• Our team will review your submitted documents</li>
            <li>• You'll receive an email notification once verified</li>
            <li>• After approval, you can start selling parts in the marketplace</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/marketplace')}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Continue to Marketplace
          <ArrowRight className="h-5 w-5" />
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          You'll be redirected automatically in a few seconds...
        </p>
      </motion.div>
    </div>
  );
};

export default KYCSuccessPage;