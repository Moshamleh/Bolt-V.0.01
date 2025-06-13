import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface LazyErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
}

const LazyErrorBoundary: React.FC<LazyErrorBoundaryProps> = ({ 
  children, 
  componentName = 'component' 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log lazy loading errors specifically
    console.error(`Lazy loading error for ${componentName}:`, error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  const fallback = (
    <div className="min-h-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load {componentName}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          There was an error loading this section. Please check your connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default LazyErrorBoundary;