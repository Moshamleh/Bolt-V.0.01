import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, Zap, Wrench, Gauge, Droplet, Thermometer } from 'lucide-react';

interface Tip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const tips: Tip[] = [
  {
    id: 'tire-pressure',
    icon: <Gauge className="h-6 w-6" />,
    title: '⚠️ Check tire pressure monthly',
    description: 'Maintaining proper tire pressure improves fuel economy, handling, and extends tire life.',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
  },
  {
    id: 'vin-scan',
    icon: <Zap className="h-6 w-6" />,
    title: '💡 Try scanning your vehicle VIN',
    description: 'Adding your VIN provides more accurate diagnostics and maintenance recommendations.',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
  },
  {
    id: 'part-listing',
    icon: <Wrench className="h-6 w-6" />,
    title: '🔥 Pro Tip: Add photos to listings',
    description: 'Parts with clear photos sell up to 3x faster than listings without images.',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  },
  {
    id: 'oil-change',
    icon: <Droplet className="h-6 w-6" />,
    title: '🔧 Regular oil changes save money',
    description: 'Change your oil every 5,000-7,500 miles to prevent costly engine damage.',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
  },
  {
    id: 'summer-cooling',
    icon: <Thermometer className="h-6 w-6" />,
    title: '❄️ Check cooling system before summer',
    description: 'Prevent overheating by inspecting coolant levels and radiator condition.',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }
];

interface TipCarouselProps {
  autoSlideInterval?: number;
  className?: string;
}

const TipCarousel: React.FC<TipCarouselProps> = ({ 
  autoSlideInterval = 5000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextTip = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % tips.length);
  }, []);

  const prevTip = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + tips.length) % tips.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      nextTip();
    }, autoSlideInterval);
    
    return () => clearInterval(interval);
  }, [nextTip, autoSlideInterval, isPaused]);

  return (
    <div 
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Maintenance Tips
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prevTip}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors"
              aria-label="Previous tip"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextTip}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors"
              aria-label="Next tip"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="relative h-32">
          <AnimatePresence mode="wait">
            {tips.map((tip, index) => (
              index === currentIndex && (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 p-4 rounded-lg ${tip.color}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {tip.icon}
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{tip.title}</h3>
                      <p className="text-sm">{tip.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
        
        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to tip ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TipCarousel;