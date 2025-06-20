import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options',
  className = '',
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full min-h-10 rounded-lg border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center flex-wrap gap-1 cursor-pointer",
          error 
            ? "border-red-300 dark:border-red-500 focus-within:ring-red-500" 
            : "border-gray-300 dark:border-gray-600 focus-within:ring-blue-500",
          "focus-within:outline-none focus-within:ring-2 focus-within:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {selectedValues.length === 0 ? (
          <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
        ) : (
          <>
            {selectedValues.map(value => {
              const option = options.find(o => o.value === value);
              return (
                <div 
                  key={value}
                  className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-sm flex items-center"
                >
                  {option?.label || value}
                  <button 
                    onClick={(e) => removeOption(e, value)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {selectedValues.length > 0 && (
              <button
                onClick={clearAll}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        <div className="ml-auto flex-shrink-0">
          <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
            >
              <div className={`w-4 h-4 mr-2 flex-shrink-0 border rounded ${
                selectedValues.includes(option.value) 
                  ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedValues.includes(option.value) && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-gray-900 dark:text-white">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;