import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Car, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';
import toast from 'react-hot-toast';
import {
  PartMessage,
  Part,
  Profile,
  getPartMessages,
  sendPartMessage,
  getPartChatDetails,
  supabase
} from '../lib/supabase';
import { playPopSound } from '../lib/utils';

const PartChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<PartMessage[]>([]);
  const [part, setPart] = useState<Part | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const loadChatData = async () => {
      if (!chatId) return;

      try {
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }
        setCurrentUserId(session.user.id);

        // Load chat details and messages
        const [chatDetails, chatMessages] = await Promise.all([
          getPartChatDetails(chatId),
          getPartMessages(chatId)
        ]);

        setPart(chatDetails.part);
        
        // Determine other user based on current user's role
        const isCurrentUserBuyer = session.user.id === chatDetails.buyer.id;
        setOtherUser(isCurrentUserBuyer ? chatDetails.seller : chatDetails.buyer);
        
        setMessages(chatMessages);

        // Clean up any existing subscription
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Set up real-time subscription
        const channel = supabase
          .channel(`part_chat:${chatId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'part_messages',
            filter: `chat_id=eq.${chatId}`,
          }, (payload) => {
            const newMessage = payload.new as PartMessage;
            setMessages(prev => [...prev, newMessage]);
          })
          .subscribe();

        // Store the channel reference
        channelRef.current = channel;
      } catch (err) {
        console.error('Failed to load chat:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    loadChatData();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, navigate]);

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
      
      if (isScrolledToBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !chatId) return;

    setSending(true);
    try {
      await sendPartMessage(chatId, input.trim());
      setInput('');
      
      // Play sound effect
      playPopSound();
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          {/* Back Button Skeleton */}
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>

          {/* Chat Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header Skeleton */}
            <div className="border-b border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>

            {/* Messages Skeleton */}
            <div className="h-[500px] p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Skeleton */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !part || !otherUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Chat not found'}
          </h2>
          <button
            onClick={() => navigate('/marketplace/messages')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Back to Messages
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
          onClick={() => navigate('/marketplace/messages')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Messages
        </motion.button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Chat Header */}
          <div className="border-b border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                {otherUser.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt={otherUser.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {otherUser.full_name || otherUser.username || 'Anonymous'}
                </h2>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Car className="h-4 w-4 mr-1" />
                  {part.year} {part.make} {part.model} - {part.title}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="h-[500px] overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Send className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${
                      message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className="flex items-start max-w-[80%] gap-2">
                      {message.sender_id !== currentUserId && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                          {message.sender_avatar_url ? (
                            <img
                              src={message.sender_avatar_url}
                              alt="Sender"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                              <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <div className={`rounded-2xl px-4 py-2 ${
                          message.sender_id === currentUserId
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}>
                          {message.content}
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-end gap-2">
              <TextareaAutosize
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift + Enter for new line)"
                className="flex-1 resize-none overflow-hidden min-h-[40px] max-h-[120px] rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
                minRows={1}
                maxRows={4}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className={`p-2 rounded-lg bg-blue-600 text-white transition-colors ${
                  sending || !input.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                }`}
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartChatPage;