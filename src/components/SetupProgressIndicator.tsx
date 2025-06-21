import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface SetupProgressIndicatorProps {
  steps: Step[];
  className?: string;
}

const SetupProgressIndicator: React.FC<SetupProgressIndicatorProps> = ({ 
  steps,
  className = ''
}) => {
  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-gray-200 dark:bg-gray-700"></div>
        
        {/* Completed Progress */}
        <div 
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-blue-600 dark:bg-blue-500 transition-all duration-300"
          style={{ 
            width: `${(steps.filter(step => step.completed).length / (steps.length - 1)) * 100}%` 
          }}
        ></div>
        
        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                  step.completed 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                    : step.current
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                } transition-colors duration-300`}
              >
                {step.completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </motion.div>
              
              <span className={`mt-2 text-xs font-medium ${
                step.current 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : step.completed
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SetupProgressIndicator;