import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, ShieldCheck, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const AIDisclaimerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-8 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Safety Notice</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Important information about our AI-powered services</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 mt-6">
              <p className="text-lg text-blue-900 dark:text-blue-100 leading-relaxed">
                Bolt Auto uses AI to suggest diagnostic ideas — but it's not a certified mechanic. Always double-check and consult a pro before taking action.
              </p>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Safety First</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Safety Tip 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg mb-4">
                  <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Never Attempt Risky Repairs Alone
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  If you're unsure about a repair, it's always better to consult with a professional.
                  Your safety comes first.
                </p>
              </div>

              {/* Safety Tip 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
                  <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Call a Pro When in Doubt
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our AI can help identify issues, but a certified mechanic should always verify
                  critical problems.
                </p>
              </div>

              {/* Safety Tip 3 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Keep Safety Gear Ready
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Maintain basic safety equipment in your car: warning triangles, flashlight,
                  and first-aid kit.
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                How We Help
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Our AI assistant is designed to help you understand car issues and make informed
                decisions. We provide:
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  Initial diagnostic suggestions based on symptoms
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  Educational information about car maintenance
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  Guidance on when to seek professional help
                </li>
              </ul>
            </div>

            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              Last updated: March 1, 2025
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIDisclaimerPage;