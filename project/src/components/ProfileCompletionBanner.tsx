import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, X } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface ProfileCompletionBannerProps {
  profile: Profile | null;
  onDismiss: () => void;
}

const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ 
  profile, 
  onDismiss 
}) => {
  const navigate = useNavigate();
  
  if (!profile) return null;
  
  // Calculate completion percentage
  const fields = [
    !!profile.full_name,
    !!profile.username,
    !!profile.avatar_url,
    !!profile.bio,
    !!profile.location
  ];
  
  const completedFields = fields.filter(Boolean).length;
  const totalFields = fields.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);
  
  // Don't show if profile is complete
  if (completionPercentage === 100) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mt-0.5">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Complete your profile
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Your profile is {completionPercentage}% complete. A complete profile helps you connect with other users and enhances your experience.
            </p>
            
            <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            
            <button
              onClick={() => navigate('/account')}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="p-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileCompletionBanner;