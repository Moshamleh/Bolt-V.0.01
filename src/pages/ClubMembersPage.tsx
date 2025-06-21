import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Loader2, User, Search, 
  Users, Shield, Mail, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Club, getUserClubMemberships, getClubs, getClubMembers } from '../lib/supabase';

interface ClubWithMembers extends Club {
  members: Profile[];
}

const ClubMembersPage: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<ClubWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState<string>('');

  useEffect(() => {
    const loadClubMembers = async () => {
      try {
        setLoading(true);
        
        // Get user's club memberships
        const memberships = await getUserClubMemberships();
        const membershipIds = memberships.map(club => club.id);
        
        // Get all clubs
        const allClubs = await getClubs();
        
        // Filter to only include clubs the user is a member of
        const userClubs = allClubs.filter(club => membershipIds.includes(club.id));
        
        // For each club, get its members
        const clubsWithMembers = await Promise.all(
          userClubs.map(async (club) => {
            const members = await getClubMembers(club.id);
            return { ...club, members };
          })
        );
        
        setClubs(clubsWithMembers);
        
        // Set the first club as selected by default
        if (clubsWithMembers.length > 0 && !selectedClub) {
          setSelectedClub(clubsWithMembers[0].id);
        }
      } catch (err) {
        console.error('Failed to load club members:', err);
        setError('Failed to load club members');
      } finally {
        setLoading(false);
      }
    };

    loadClubMembers();
  }, [selectedClub]);

  const filteredMembers = selectedClub 
    ? clubs.find(club => club.id === selectedClub)?.members.filter(member => 
        (member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         member.username?.toLowerCase().includes(searchTerm.toLowerCase()))
      ) || []
    : [];

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage club memberships
          </p>
        </motion.div>

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
              <UserPlus className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              You're not a member of any clubs yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join clubs to connect with other car enthusiasts
            </p>
            <button
              onClick={() => navigate('/clubs')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Browse Clubs
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Club Selection Sidebar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 h-fit">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Clubs
              </h2>
              <div className="space-y-2">
                {clubs.map(club => (
                  <button
                    key={club.id}
                    onClick={() => setSelectedClub(club.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedClub === club.id
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {club.image_url ? (
                        <img
                          src={club.image_url}
                          alt={club.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{club.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {club.members.length} members
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Members List */}
            <div className="lg:col-span-3">
              {selectedClub ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {clubs.find(club => club.id === selectedClub)?.name} Members
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                        {filteredMembers.length} members
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          {searchTerm ? 'No members match your search' : 'No members found'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence initial={false}>
                          {filteredMembers.map((member, index) => (
                            <motion.div
                              key={member.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-start gap-4"
                            >
                              <div className="flex-shrink-0">
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.full_name || member.username || 'Member'}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {member.full_name || member.username || 'Anonymous Member'}
                                  </h4>
                                  {member.role === 'admin' && (
                                    <span className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                      <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </span>
                                  )}
                                </div>
                                
                                {member.username && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    @{member.username}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {member.location && (
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span>{member.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => {/* TODO: Implement message member */}}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors"
                                title="Message member"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                  <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Club
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a club from the sidebar to view its members
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubMembersPage;