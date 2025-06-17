import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, User, MapPin, FileText, Camera } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface ProfileCompletionIndicatorProps {
  profile: Profile | null;
  className?: string;
}

interface ProfileField {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({ 
  profile, 
  className = '' 
}) => {
  if (!profile) return null;

  const profileFields: ProfileField[] = [
    {
      id: 'full_name',
      label: 'Full Name',
      description: 'Add your full name to personalize your experience',
      icon: <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      completed: !!profile.full_name
    },
    {
      id: 'username',
      label: 'Username',
      description: 'Choose a unique username for your profile',
      icon: <User className="h-5 w-5 text-green-600 dark:text-green-400" />,
      completed: !!profile.username
    },
    {
      id: 'avatar_url',
      label: 'Profile Picture',
      description: 'Upload a profile picture to personalize your account',
      icon: <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      completed: !!profile.avatar_url
    },
    {
      id: 'bio',
      label: 'Bio',
      description: 'Tell the community about yourself',
      icon: <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      completed: !!profile.bio
    },
    {
      id: 'location',
      label: 'Location',
      description: 'Add your location to connect with nearby users',
      icon: <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />,
      completed: !!profile.location
    }
  ];

  const completedFields = profileFields.filter(field => field.completed).length;
  const completionPercentage = Math.round((completedFields / profileFields.length) * 100);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile Completion
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {completionPercentage}%
            </span>
            {completionPercentage === 100 ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        </div>
        
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${
              completionPercentage === 100 
                ? 'bg-green-600 dark:bg-green-500' 
                : 'bg-blue-600 dark:bg-blue-500'
            }`}
          />
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {profileFields.map(field => (
            <div 
              key={field.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                field.completed 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className={`p-2 rounded-full ${
                field.completed 
                  ? 'bg-green-100 dark:bg-green-900/50' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                {field.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {field.label}
                  </h4>
                  {field.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                      Incomplete
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {field.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionIndicator;