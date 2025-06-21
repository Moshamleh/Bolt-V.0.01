import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveFilterTagsProps {
  filters: {
    searchTerm?: string;
    partNumber?: string;
    oemNumber?: string;
    selectedMakes?: string[];
    selectedModels?: string[];
    selectedCategories?: string[];
    selectedConditions?: string[];
    priceRange?: [number, number];
    priceRangeLimits?: { min: number; max: number };
    yearRange?: [number, number];
    yearRangeLimits?: { min: number; max: number };
    showTrustedSellersOnly?: boolean;
    showBoostedOnly?: boolean;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  };
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}

const ActiveFilterTags: React.FC<ActiveFilterTagsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll
}) => {
  // Check if any filters are active
  const hasActiveFilters = 
    !!filters.searchTerm || 
    !!filters.partNumber || 
    !!filters.oemNumber || 
    (filters.selectedMakes && filters.selectedMakes.length > 0) ||
    (filters.selectedModels && filters.selectedModels.length > 0) ||
    (filters.selectedCategories && filters.selectedCategories.length > 0) ||
    (filters.selectedConditions && filters.selectedConditions.length > 0) ||
    (filters.priceRange && 
      (filters.priceRange[0] > (filters.priceRangeLimits?.min || 0) || 
       filters.priceRange[1] < (filters.priceRangeLimits?.max || 10000))) ||
    (filters.yearRange && 
      (filters.yearRange[0] > (filters.yearRangeLimits?.min || 1990) || 
       filters.yearRange[1] < (filters.yearRangeLimits?.max || new Date().getFullYear()))) ||
    filters.showTrustedSellersOnly ||
    filters.showBoostedOnly;

  if (!hasActiveFilters) return null;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2 items-center">
        <AnimatePresence>
          {filters.searchTerm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
            >
              <span>Search: {filters.searchTerm}</span>
              <button
                onClick={() => onRemoveFilter('searchTerm')}
                className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {filters.partNumber && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
            >
              <span>Part #: {filters.partNumber}</span>
              <button
                onClick={() => onRemoveFilter('partNumber')}
                className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {filters.oemNumber && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
            >
              <span>OEM #: {filters.oemNumber}</span>
              <button
                onClick={() => onRemoveFilter('oemNumber')}
                className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {filters.selectedMakes && filters.selectedMakes.map(make => (
            <motion.div
              key={`make-${make}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
            >
              <span>Make: {make}</span>
              <button
                onClick={() => onRemoveFilter('selectedMakes', make)}
                className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}

          {filters.selectedModels && filters.selectedModels.map(model => (
            <motion.div
              key={`model-${model}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
            >
              <span>Model: {model}</span>
              <button
                onClick={() => onRemoveFilter('selectedModels', model)}
                className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}

          {filters.selectedCategories && filters.selectedCategories.map(category => (
            <motion.div
              key={`category-${category}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
            >
              <span>Category: {category}</span>
              <button
                onClick={() => onRemoveFilter('selectedCategories', category)}
                className="p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}

          {filters.selectedConditions && filters.selectedConditions.map(condition => (
            <motion.div
              key={`condition-${condition}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm"
            >
              <span>Condition: {condition}</span>
              <button
                onClick={() => onRemoveFilter('selectedConditions', condition)}
                className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}

          {filters.priceRange && 
           (filters.priceRange[0] > (filters.priceRangeLimits?.min || 0) || 
            filters.priceRange[1] < (filters.priceRangeLimits?.max || 10000)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm"
            >
              <span>Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}</span>
              <button
                onClick={() => onRemoveFilter('priceRange')}
                className="p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {filters.yearRange && 
           (filters.yearRange[0] > (filters.yearRangeLimits?.min || 1990) || 
            filters.yearRange[1] < (filters.yearRangeLimits?.max || new Date().getFullYear())) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
            >
              <span>Year: {filters.yearRange[0]} - {filters.yearRange[1]}</span>
              <button
                onClick={() => onRemoveFilter('yearRange')}
                className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {filters.showTrustedSellersOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
            >
              <span>Verified Sellers Only</span>
              <button
                onClick={() => onRemoveFilter('showTrustedSellersOnly')}
                className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {filters.showBoostedOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm"
            >
              <span>Boosted Listings Only</span>
              <button
                onClick={() => onRemoveFilter('showBoostedOnly')}
                className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClearAll}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActiveFilterTags;