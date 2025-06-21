import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { PartChatPreview, getMyPartChats } from '../lib/supabase';

const MyChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<PartChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await getMyPartChats();
        setChats(data);
      } catch (err) {
        console.error('Failed to load chats:', err);
        setError('Failed to load your chats');
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  const handleChatClick = (chatId: string) => {
    navigate(`/marketplace/messages/${chatId}`);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center"
    >
      <div className="flex justify-center mb-4">
        <MessageSquare className="h-16 w-16 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No messages yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Start a conversation by messaging a seller in the marketplace
      </p>
      <button
        onClick={() => navigate('/marketplace')}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Browse Marketplace
      </button>
    </motion.div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
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
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/marketplace')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Marketplace
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your conversations with buyers and sellers
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : chats.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {chats.map((chat, index) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleChatClick(chat.id)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {chat.other_user.avatar_url ? (
                        <img
                          src={chat.other_user.avatar_url}
                          alt={chat.other_user.full_name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {chat.other_user.full_name || chat.other_user.username || 'Anonymous'}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {chat.last_message
                            ? formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true })
                            : formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                        {chat.part.title}
                      </p>

                      {chat.last_message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {chat.last_message.content}
                        </p>
                      )}
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

export default MyChatsPage;