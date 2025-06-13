import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, ArrowLeft, Zap, Car, Store, 
  UsersRound, Settings, CheckCircle, Sparkles 
} from 'lucide-react';
import { updateProfile } from '../lib/supabase';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'navigate' | 'click' | 'highlight';
    value?: string;
  };
}

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Bolt Auto! 🚗',
    description: 'Your personal AI mechanic is here to help diagnose car issues, connect with professionals, and find parts. Let\'s take a quick tour!',
    target: 'center',
    icon: <Sparkles className="h-6 w-6" />,
    position: 'center'
  },
  {
    id: 'diagnostic',
    title: 'AI Diagnostic Chat',
    description: 'Start here to describe your car issues. Our AI will help diagnose problems and suggest solutions.',
    target: '[data-tour="diagnostic"]',
    icon: <Zap className="h-5 w-5" />,
    position: 'top',
    action: { type: 'highlight' }
  },
  {
    id: 'vehicles',
    title: 'Vehicle Management',
    description: 'Add and manage your vehicles here. Having your car details helps us provide more accurate diagnostics.',
    target: '[data-tour="vehicles"]',
    icon: <Car className="h-5 w-5" />,
    position: 'top',
    action: { type: 'highlight' }
  },
  {
    id: 'marketplace',
    title: 'Parts Marketplace',
    description: 'Find and sell car parts with other enthusiasts. Browse listings or sell your own parts.',
    target: '[data-tour="marketplace"]',
    icon: <Store className="h-5 w-5" />,
    position: 'top',
    action: { type: 'highlight' }
  },
  {
    id: 'clubs',
    title: 'Car Clubs',
    description: 'Join communities of car enthusiasts. Share experiences, get advice, and connect with like-minded people.',
    target: '[data-tour="clubs"]',
    icon: <UsersRound className="h-5 w-5" />,
    position: 'top',
    action: { type: 'highlight' }
  },
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Customize your profile, manage preferences, and access your achievements here.',
    target: '[data-tour="account"]',
    icon: <Settings className="h-5 w-5" />,
    position: 'top',
    action: { type: 'highlight' }
  },
  {
    id: 'complete',
    title: 'You\'re all set! 🎉',
    description: 'You\'re ready to start using Bolt Auto. Begin by adding your first vehicle or asking our AI about any car issues you\'re experiencing.',
    target: 'center',
    icon: <CheckCircle className="h-6 w-6" />,
    position: 'center'
  }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  isVisible, 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentTourStep = tourSteps[currentStep];

  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !currentTourStep) return;

    // Position the tooltip relative to the target element
    const positionTooltip = () => {
      if (currentTourStep.target === 'center') return;

      const targetElement = document.querySelector(currentTourStep.target);
      if (!targetElement || !tooltipRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (currentTourStep.position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - 12;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = targetRect.bottom + 12;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left - tooltipRect.width - 12;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + 12;
          break;
      }

      // Ensure the tooltip stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 16) left = 16;
      if (left + tooltipRect.width > viewportWidth - 16) {
        left = viewportWidth - tooltipRect.width - 16;
      }

      if (top < 16) top = 16;
      if (top + tooltipRect.height > viewportHeight - 16) {
        top = viewportHeight - tooltipRect.height - 16;
      }

      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    };

    // Highlight the target element
    const highlightTarget = () => {
      if (currentTourStep.target === 'center' || !currentTourStep.action) return;
      
      const targetElement = document.querySelector(currentTourStep.target);
      if (!targetElement) return;

      if (currentTourStep.action.type === 'highlight') {
        targetElement.classList.add('tour-highlight');
      }
    };

    // Clean up highlight
    const cleanupHighlight = () => {
      if (currentTourStep.target === 'center' || !currentTourStep.action) return;
      
      const targetElement = document.querySelector(currentTourStep.target);
      if (!targetElement) return;

      if (currentTourStep.action.type === 'highlight') {
        targetElement.classList.remove('tour-highlight');
      }
    };

    // Position tooltip and highlight target
    positionTooltip();
    highlightTarget();

    // Reposition on resize
    window.addEventListener('resize', positionTooltip);

    return () => {
      window.removeEventListener('resize', positionTooltip);
      cleanupHighlight();
    };
  }, [currentStep, isVisible, currentTourStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Update user profile to mark onboarding as complete
      await updateProfile({ initial_setup_complete: true });
      onComplete();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      // Update user profile to mark onboarding as complete
      await updateProfile({ initial_setup_complete: true });
      onSkip();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTourStep.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          ref={tooltipRef}
          className={`absolute pointer-events-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 max-w-md ${
            currentTourStep.target === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : ''
          }`}
          style={{ 
            zIndex: 60,
            maxWidth: '90vw',
            width: currentTourStep.target === 'center' ? '400px' : 'auto'
          }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              {currentTourStep.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentTourStep.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentTourStep.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Skip tour
              </button>
              <button
                onClick={handleNext}
                disabled={isCompleting}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {currentStep === tourSteps.length - 1 ? (
                  isCompleting ? 'Finishing...' : 'Finish'
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2">
            <div className="flex gap-1.5">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600 dark:bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Add tour-specific styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 55;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingTour;