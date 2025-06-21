import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none',
          error 
            ? 'border-red-300 dark:border-red-500 focus:ring-red-500' 
            : success
            ? 'border-green-300 dark:border-green-500 focus:ring-green-500'
            : 'border-gray-300 dark:border-gray-600',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;