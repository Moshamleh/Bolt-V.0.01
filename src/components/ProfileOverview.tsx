import React from 'react';
import { Mail, MapPin, User, Calendar, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Profile, UserEarnedBadge } from '../lib/supabase';
import XpProgressBar from './XpProgressBar';
import OptimizedImage from './OptimizedImage';
import { formatDistanceToNow } from 'date-fns';

interface ProfileOverviewProps {
  profile: Profile | null;
  email: string;
  xp: number;
  level: number;
  badges: UserEarnedBadge[];
  className?: string;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profile,
  email,
  xp,
  level,
  badges,
  className = ''
}) => {
  if (!profile) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              {profile.avatar_url ? (
                <OptimizedImage
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  className="w-full h-full"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <User className="h-12 w-12" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.full_name || 'Add your name'}
            </h2>
            
            {profile.username && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                @{profile.username}
              </p>
            )}
            
            <div className="flex flex-col md:flex-row gap-3 mt-3">
              <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                <span>{email}</span>
              </div>
              
              {profile.location && (
                <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {formatDistanceToNow(new Date(profile.created_at || Date.now()), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              <Award className="h-4 w-4" />
              <span className="font-medium">{badges.length} Badges</span>
            </div>
          </div>
        </div>
        
        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">About</h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}
      </div>
      
      <XpProgressBar xp={xp} level={level} showDetails={true} />
    </div>
  );
};

export default ProfileOverview;