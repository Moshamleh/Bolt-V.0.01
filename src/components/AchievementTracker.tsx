import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Award, Users, Package, Share2, User, Car } from 'lucide-react';
import { Profile, getUserVehicles, hasUserAchievementBeenAwarded, recordUserAchievement } from '../lib/supabase';
import { hasCompletedFirstDiagnostic, hasJoinedFirstClub } from '../lib/utils';
import { awardXp, XP_VALUES } from '../lib/xpSystem';
import { awardBadge } from '../lib/supabase';

interface AchievementTrackerProps {
  profile: Profile | null;
  className?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  badgeName: string;
  xp: number;
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ profile, className = '' }) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedAchievements, setCompletedAchievements] = useState<string[]>([]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehiclesData = await getUserVehicles();
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  useEffect(() => {
    // Check which achievements have already been awarded
    const checkAchievements = async () => {
      if (!profile) return;

      const achievementIds = [
        'profile',
        'vehicle',
        'diagnostic',
        'club',
        'part'
      ];

      const awarded = await Promise.all(
        achievementIds.map(async (id) => {
          const isAwarded = await hasUserAchievementBeenAwarded(undefined, id);
          return isAwarded ? id : null;
        })
      );

      setCompletedAchievements(awarded.filter(Boolean) as string[]);
    };

    checkAchievements();
  }, [profile]);

  useEffect(() => {
    // Award XP and badges for completed achievements that haven't been awarded yet
    const awardAchievements = async () => {
      if (!profile) return;

      const achievements = getAchievements(profile);
      
      for (const achievement of achievements) {
        if (achievement.completed && !completedAchievements.includes(achievement.id)) {
          try {
            // Award XP
            await awardXp(undefined, achievement.xp, `Completed ${achievement.title}`);
            
            // Award badge
            await awardBadge(undefined, achievement.badgeName, `Completed ${achievement.title}`);
            
            // Record achievement
            await recordUserAchievement(undefined, achievement.id, achievement.xp, achievement.badgeName);
            
            // Update local state
            setCompletedAchievements(prev => [...prev, achievement.id]);
          } catch (error) {
            console.error(`Failed to award achievement ${achievement.id}:`, error);
          }
        }
      }
    };

    awardAchievements();
  }, [profile, completedAchievements]);

  const getAchievements = (profile: Profile | null): Achievement[] => {
    if (!profile) return [];

    // Check local storage for achievements not stored in the database
    const firstDiagnosticCompleted = profile.first_diagnostic_completed || hasCompletedFirstDiagnostic();
    const firstClubJoined = profile.first_club_joined || hasJoinedFirstClub();

    // Calculate profile completion percentage
    const profileFields = [
      !!profile.full_name,
      !!profile.username,
      !!profile.avatar_url,
      !!profile.bio,
      !!profile.location
    ];
    const completedProfileFields = profileFields.filter(Boolean).length;
    const profileComplete = completedProfileFields === profileFields.length;

    return [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Fill out all profile fields',
        icon: <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
        completed: profileComplete,
        badgeName: 'Profile Complete',
        xp: XP_VALUES.COMPLETE_PROFILE
      },
      {
        id: 'vehicle',
        title: 'Add Your First Vehicle',
        description: 'Add a vehicle to your garage',
        icon: <Car className="h-6 w-6 text-green-600 dark:text-green-400" />,
        completed: vehicles.length > 0,
        badgeName: 'First Vehicle',
        xp: XP_VALUES.ADD_VEHICLE
      },
      {
        id: 'diagnostic',
        title: 'Run First Diagnostic',
        description: 'Use Bolt AI to diagnose a car issue',
        icon: <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
        completed: firstDiagnosticCompleted,
        badgeName: 'First Diagnosis',
        xp: XP_VALUES.RUN_DIAGNOSTIC
      },
      {
        id: 'club',
        title: 'Join a Club',
        description: 'Connect with other car enthusiasts',
        icon: <Users className="h-6 w-6 text-green-600 dark:text-green-400" />,
        completed: firstClubJoined,
        badgeName: 'Club Member',
        xp: XP_VALUES.JOIN_CLUB
      },
      {
        id: 'part',
        title: 'List a Part',
        description: 'Sell your first part in the marketplace',
        icon: <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
        completed: !!profile.first_part_listed,
        badgeName: 'First Listing',
        xp: XP_VALUES.LIST_PART
      }
    ];
  };

  if (!profile) return null;

  const achievements = getAchievements(profile);
  
  // Calculate total XP and progress
  const totalXP = achievements.reduce((sum, achievement) => sum + (achievement.completed ? achievement.xp : 0), 0);
  const maxXP = achievements.reduce((sum, achievement) => sum + achievement.xp, 0);
  const xpProgress = Math.round((totalXP / maxXP) * 100);
  
  // Count completed achievements
  const completedCount = achievements.filter(achievement => achievement.completed).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Get Started Tasks
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {completedCount}/{achievements.length} Complete
            </span>
          </div>
        </div>
        
        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-glowing-gradient rounded-full"
          />
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{totalXP} XP</span>
          <span>{maxXP} XP</span>
        </div>
        
        <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
          {completedCount === achievements.length 
            ? "You've completed all starter tasks! 🎉" 
            : `You're ${achievements.length - completedCount} ${achievements.length - completedCount === 1 ? 'task' : 'tasks'} away from greatness 🧰`}
        </p>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                achievement.completed 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                achievement.completed 
                  ? 'bg-green-100 dark:bg-green-900/50' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {achievement.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  achievement.icon
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {achievement.title}
                  </h3>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    +{achievement.xp} XP
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {achievement.description}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${achievement.completed ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-500'}`}
                      style={{ width: achievement.completed ? '100%' : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {achievement.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementTracker;