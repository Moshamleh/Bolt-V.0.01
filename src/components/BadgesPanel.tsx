import React from 'react';
import { Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserEarnedBadge } from '../lib/supabase';

interface BadgesPanelProps {
  badges: UserEarnedBadge[];
  loading?: boolean;
}

const BadgesPanel: React.FC<BadgesPanelProps> = ({ badges, loading = false }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'milestone':
        return 'from-blue-400 to-blue-600';
      case 'rare':
        return 'from-purple-400 to-purple-600';
      case 'exclusive':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityTag = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return { label: 'Common', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
      case 'milestone':
        return { label: 'Milestone', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' };
      case 'rare':
        return { label: 'Rare', color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' };
      case 'exclusive':
        return { label: 'Exclusive', color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' };
      default:
        return { label: 'Common', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="w-12 h-12 mb-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No achievements yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Complete activities to earn your first badge
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {badges.map((badge, index) => {
        const rarityTag = getRarityTag(badge.rarity);
        
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.4,
              ease: "easeOut"
            }}
            className="group relative flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer"
          >
            {/* Badge Icon */}
            <div className={`w-14 h-14 mb-3 bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              {badge.icon_url ? (
                <img
                  src={badge.icon_url}
                  alt={badge.name}
                  className="w-8 h-8 text-white"
                  onError={(e) => {
                    // Fallback to Award icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Award className={`h-8 w-8 text-white ${badge.icon_url ? 'hidden' : ''}`} />
            </div>

            {/* Badge Name */}
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-1 line-clamp-2">
              {badge.name}
            </h4>

            {/* Badge Description */}
            {badge.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 line-clamp-2">
                {badge.description}
              </p>
            )}

            {/* Rarity Tag */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${rarityTag.color}`}>
              {rarityTag.label}
            </span>

            {/* Awarded Date (on hover) */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              Earned {new Date(badge.awarded_at).toLocaleDateString()}
            </div>

            {/* Note (if available) */}
            {badge.note && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap max-w-48 truncate">
                {badge.note}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default BadgesPanel;