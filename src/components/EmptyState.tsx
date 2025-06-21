import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
  className = '',
  iconClassName = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center",
        className
      )}
    >
      <div className={cn("flex justify-center mb-4", iconClassName)}>
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionButton}
    </motion.div>
  );
};

export default EmptyState;