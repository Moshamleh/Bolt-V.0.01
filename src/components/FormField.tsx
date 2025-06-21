import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  description?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required = false,
  children,
  description,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      
      <div className="relative">
        {children}
        
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FormField;