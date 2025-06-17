import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Heart, Loader2, MapPin, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Club, getUserClubMemberships, getClubs } from '../lib/supabase';

const MyClubsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true);
        
        // Get user's club memberships
        const memberships = await getUserClubMemberships();
        const membershipIds = memberships.map(club => club.id);
        
        // Get all clubs
        const allClubs = await getClubs();
        
        // Filter to only include clubs the user is a member of
        const userClubs = allClubs.filter(club => membershipIds.includes(club.id));
        
        setClubs(userClubs);
      } catch (err) {
        console.error('Failed to load clubs:', err);
        setError('Failed to load your clubs');
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, []);

  const handleCreateClub = () => {
    navigate('/clubs/create');
  };

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Clubs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Clubs you've joined or created</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleCreateClub}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Club
          </motion.button>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : clubs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <Heart className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              You haven't joined any clubs yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join clubs to connect with other car enthusiasts or create your own
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/clubs')}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                Browse Clubs
              </button>
              <button
                onClick={handleCreateClub}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Club
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleClubClick(club.id)}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={club.image_url}
                      alt={club.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {club.name}
                      </h3>
                      <div className="flex items-center text-sm text-white/90">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{club.member_count} members</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {club.description}
                    </p>

                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {club.region}
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {club.topic}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MyClubsPage;