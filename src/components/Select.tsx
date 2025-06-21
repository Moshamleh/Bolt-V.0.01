import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  success?: boolean;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, success, placeholder, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full rounded-lg border px-4 py-2 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none',
            error 
              ? 'border-red-300 dark:border-red-500 focus:ring-red-500' 
              : success
              ? 'border-green-300 dark:border-green-500 focus:ring-green-500'
              : 'border-gray-300 dark:border-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;