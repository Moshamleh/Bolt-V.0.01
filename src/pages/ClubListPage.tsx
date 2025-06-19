import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Heart, Loader2, MapPin, Tag, Menu, ChevronDown, ChevronUp, Search, Filter,
  Globe, CheckCircle, Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Club, getClubs, getUserClubMemberships, joinClub, leaveClub, supabase } from '../lib/supabase';
import BlurImage from '../components/BlurImage';
import { extractErrorMessage } from '../lib/errorHandling';

type TabType = 'all' | 'joined' | 'regional' | 'vehicle';

// Define filter chips
const filterChips = [
  { id: 'all', label: 'All', icon: <Globe className="h-4 w-4" />, filters: {} },
  { id: 'joined', label: 'Joined', icon: <CheckCircle className="h-4 w-4" />, filters: {} },
  { id: 'regional', label: 'Regional', icon: <MapPin className="h-4 w-4" />, filters: {} },
  { id: 'vehicle', label: 'Vehicle-Specific', icon: <Car className="h-4 w-4" />, filters: {} }
];

const ClubListPage: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [userClubs, setUserClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const [clubsData, memberships] = await Promise.all([
          getClubs(),
          getUserClubMemberships()
        ]);

        setClubs(clubsData);
        setUserClubs(memberships.map(club => club.id));
      } catch (err) {
        console.error('Failed to load clubs:', err);
        const errorMessage = extractErrorMessage(err);
        setError(`Failed to load clubs: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, [navigate]);

  const handleCreateClub = () => {
    navigate('/clubs/create');
  };

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  const handleJoinClub = async (e: React.MouseEvent, clubId: string) => {
    e.stopPropagation();
    if (actionInProgress) return;

    setActionInProgress(clubId);
    try {
      await joinClub(clubId);
      setUserClubs(prev => [...prev, clubId]);
      toast.success('Successfully joined the club');
    } catch (err) {
      console.error('Failed to join club:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to join club: ${errorMessage}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLeaveClub = async (e: React.MouseEvent, clubId: string) => {
    e.stopPropagation();
    if (actionInProgress) return;

    setActionInProgress(clubId);
    try {
      await leaveClub(clubId);
      setUserClubs(prev => prev.filter(id => id !== clubId));
      toast.success('Successfully left the club');
    } catch (err) {
      console.error('Failed to leave club:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to leave club: ${errorMessage}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredClubs = clubs.filter(club => {
    if (activeTab === 'joined' && !userClubs.includes(club.id)) return false;
    if (activeTab === 'regional' && selectedRegion && club.region !== selectedRegion) return false;
    if (activeTab === 'vehicle' && selectedTopic && club.topic !== selectedTopic) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        club.name.toLowerCase().includes(searchLower) ||
        club.description?.toLowerCase().includes(searchLower) ||
        club.region?.toLowerCase().includes(searchLower) ||
        club.topic?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleClearFilters = () => {
    setSelectedRegion('');
    setSelectedTopic('');
    setSearchTerm('');
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="mt-4 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => {
    const hasFilters = searchTerm || selectedRegion || selectedTopic || activeTab !== 'all';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-dashed border-blue-300 dark:border-blue-700 p-8 text-center relative overflow-hidden"
      >
        {/* Background animation elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-t-4 border-l-4 border-blue-500 rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-full animate-spin-slow"></div>
          <div className="absolute top-1/2 left-1/4 w-40 h-1 bg-blue-500 rotate-45 animate-pulse-slow"></div>
          <div className="absolute top-1/4 right-1/3 w-40 h-1 bg-blue-500 -rotate-45 animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <Users className="h-20 w-20 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🚘 No car clubs yet? That's your sign to start one.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
            Rally your crew and build something legendary.
          </p>
          {hasFilters ? (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={handleCreateClub}
              className="inline-flex items-center px-6 py-3 bg-glowing-gradient text-white rounded-lg font-medium shadow-lg hover:shadow-glow transition-all duration-300 animate-pulse-slow"
            >
              <Plus className="h-5 w-5 mr-2" />
              + Create a Club
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Try Again
          </button>
        </div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clubs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Join communities of car enthusiasts</p>
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setActiveTab(chip.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTab === chip.id
                      ? 'bg-blue-600 text-white shadow-glow'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Filter className="h-5 w-5" />
                <span>Advanced Filters</span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {(showFilters || searchTerm || selectedRegion || selectedTopic || activeTab !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {activeTab === 'regional' && (
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Regions</option>
                        <option value="North America">North America</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia">Asia</option>
                        <option value="Australia">Australia</option>
                      </select>
                    )}

                    {activeTab === 'vehicle' && (
                      <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Topics</option>
                        <option value="Performance">Performance</option>
                        <option value="Classic">Classic</option>
                        <option value="Restoration">Restoration</option>
                        <option value="Racing">Racing</option>
                        <option value="Off-Road">Off-Road</option>
                      </select>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : filteredClubs.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleClubClick(club.id)}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <BlurImage
                      src={club.image_url}
                      alt={club.name}
                      className="absolute inset-0 w-full h-full group-hover:scale-102 transition-transform duration-300"
                      objectFit="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {club.name}
                      </h3>
                      <div className="flex items-center text-sm text-white/90">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{club.member_count} members</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 h-10">
                      {club.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        <MapPin className="h-3 w-3 mr-1" />
                        {club.region}
                      </div>
                      <div className="flex items-center px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                        <Tag className="h-3 w-3 mr-1" />
                        {club.topic}
                      </div>
                    </div>

                    <button
                      onClick={(e) => 
                        userClubs.includes(club.id)
                          ? handleLeaveClub(e, club.id)
                          : handleJoinClub(e, club.id)
                      }
                      disabled={actionInProgress === club.id}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        userClubs.includes(club.id)
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionInProgress === club.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : userClubs.includes(club.id) ? (
                        'Leave Club'
                      ) : (
                        'Join Club'
                      )}
                    </button>
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

export default ClubListPage;