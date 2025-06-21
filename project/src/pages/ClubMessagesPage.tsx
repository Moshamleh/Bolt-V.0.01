import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Loader2, User, Search, 
  Users, Calendar, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Club, getUserClubMemberships, getClubs } from '../lib/supabase';

interface ClubMessage {
  id: string;
  clubId: string;
  clubName: string;
  clubImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// Mock data for club messages
const generateMockMessages = (clubs: Club[]): ClubMessage[] => {
  return clubs.map(club => ({
    id: club.id,
    clubId: club.id,
    clubName: club.name,
    clubImage: club.image_url,
    lastMessage: `Latest discussion about ${club.topic} events`,
    lastMessageTime: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    unreadCount: Math.floor(Math.random() * 5)
  }));
};

const ClubMessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadClubMessages = async () => {
      try {
        setLoading(true);
        
        // Get user's club memberships
        const memberships = await getUserClubMemberships();
        const membershipIds = memberships.map(club => club.id);
        
        // Get all clubs
        const allClubs = await getClubs();
        
        // Filter to only include clubs the user is a member of
        const userClubs = allClubs.filter(club => membershipIds.includes(club.id));
        
        // Generate mock messages for each club
        const mockMessages = generateMockMessages(userClubs);
        
        setMessages(mockMessages);
      } catch (err) {
        console.error('Failed to load club messages:', err);
        setError('Failed to load club messages');
      } finally {
        setLoading(false);
      }
    };

    loadClubMessages();
  }, []);

  const filteredMessages = messages.filter(message => 
    message.clubName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessageClick = (clubId: string) => {
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay connected with your car clubs
          </p>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search club messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : filteredMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <MessageSquare className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matching messages found' : 'No club messages yet'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Join clubs to start receiving messages and updates'}
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
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleMessageClick(message.clubId)}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
                    message.unreadCount > 0 
                      ? 'border-blue-200 dark:border-blue-800' 
                      : 'border-gray-100 dark:border-gray-700'
                  } p-4 cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                      {message.clubImage ? (
                        <img
                          src={message.clubImage}
                          alt={message.clubName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {message.clubName}
                        </h3>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(message.lastMessageTime), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {message.lastMessage}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      {message.unreadCount > 0 && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full mr-2">
                          {message.unreadCount}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubMessagesPage;