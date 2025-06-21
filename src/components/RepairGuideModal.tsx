import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Wrench, Link, ExternalLink, Car, Shield } from 'lucide-react';
import { RepairKnowledge } from '../lib/supabase';

interface RepairGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairGuide: RepairKnowledge | null;
}

const RepairGuideModal: React.FC<RepairGuideModalProps> = ({
  isOpen,
  onClose,
  repairGuide
}) => {
  if (!isOpen || !repairGuide) return null;

  // Parse steps from JSON
  const steps = Array.isArray(repairGuide.steps) 
    ? repairGuide.steps 
    : typeof repairGuide.steps === 'object' && repairGuide.steps !== null
      ? Object.values(repairGuide.steps)
      : [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wrench className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">
              {repairGuide.component} Repair Guide
            </h2>
          </div>
          
          <div className="flex items-center gap-3 text-white/90">
            <Car className="h-4 w-4" />
            <span>
              {repairGuide.year} {repairGuide.make} {repairGuide.model}
              {repairGuide.trim ? ` ${repairGuide.trim}` : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Safety Notes */}
          {repairGuide.safety_notes && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">Safety Warning</h3>
                  <p className="text-red-700 dark:text-red-200 text-sm whitespace-pre-line">
                    {repairGuide.safety_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Repair Steps */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Repair Steps
            </h3>
            
            <ol className="space-y-4 list-decimal list-outside pl-6">
              {steps.map((step: any, index: number) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 pl-2">
                  <div className="font-medium mb-1">{step.title || `Step ${index + 1}`}</div>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {step.description || step}
                  </p>
                  {step.image_url && (
                    <img 
                      src={step.image_url} 
                      alt={`Step ${index + 1}`} 
                      className="mt-2 rounded-lg max-h-48 object-contain"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Source URL */}
          {repairGuide.source_url && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Link className="h-4 w-4" />
                <span className="font-medium">Source:</span>
                <a 
                  href={repairGuide.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  View Original Guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                This repair guide is provided for informational purposes only. Always consult your vehicle's service manual and follow proper safety procedures. Bolt Auto is not responsible for any damage or injury resulting from following these instructions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RepairGuideModal;