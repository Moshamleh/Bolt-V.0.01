import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, MapPin, Tag, Loader2, Send, ArrowLeft, X, User,
  Settings, UserMinus, Trash2, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';
import toast from 'react-hot-toast';
import {
  Club,
  ClubMessage,
  Profile,
  getClubById,
  isUserClubMember,
  joinClub,
  leaveClub,
  getClubMessages,
  sendClubMessage,
  getClubMembers,
  getCurrentUserClubRole,
  supabase
} from '../lib/supabase';

const ClubDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const loadClubData = async () => {
      if (!id) return;

      try {
        const [clubData, memberStatus, membersList, userRole] = await Promise.all([
          getClubById(id),
          isUserClubMember(id),
          getClubMembers(id),
          getCurrentUserClubRole(id)
        ]);

        setClub(clubData);
        setMemberCount(clubData.member_count || 0);
        setIsMember(memberStatus);
        setMembers(membersList);
        setIsAdmin(userRole === 'admin');
      } catch (err) {
        console.error('Failed to load club:', err);
        setError('Failed to load club details');
      } finally {
        setLoading(false);
      }
    };

    loadClubData();
  }, [id]);

  useEffect(() => {
    const loadChatData = async () => {
      if (!id) return;

      try {
        // Get current user's email
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;
        setCurrentUserEmail(session.user.email);

        // Load messages
        const messages = await getClubMessages(id);
        setMessages(messages);

        // Clean up any existing subscription
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Set up real-time subscription
        const channel = supabase
          .channel(`club_chat:${id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'club_messages',
            filter: `club_id=eq.${id}`,
          }, (payload) => {
            const newMessage = payload.new as ClubMessage;
            setMessages(prev => [...prev, newMessage]);
          })
          .subscribe();

        // Store the channel reference
        channelRef.current = channel;
      } catch (err) {
        console.error('Error loading chat:', err);
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
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
      
      if (isScrolledToBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleMembershipAction = async () => {
    if (!club || isActionLoading) return;

    setIsActionLoading(true);
    try {
      if (isMember) {
        await leaveClub(club.id);
        setMemberCount(prev => prev - 1);
        setIsMember(false);
        setIsAdmin(false);
        toast.success('Left the club successfully');
      } else {
        await joinClub(club.id);
        setMemberCount(prev => prev + 1);
        setIsMember(true);
        toast.success('Joined the club successfully');
      }
    } catch (err) {
      console.error('Membership action failed:', err);
      toast.error(isMember ? 'Failed to leave club' : 'Failed to join club');
      setError(isMember ? 'Failed to leave club' : 'Failed to join club');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditClub = () => {
    navigate(`/clubs/${id}/edit`);
  };

  const handleManageMembers = () => {
    navigate(`/clubs/${id}/members`);
  };

  const handleDeleteClub = async () => {
    if (!window.confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Club deleted successfully');
      navigate('/clubs');
    } catch (err) {
      console.error('Failed to delete club:', err);
      toast.error('Failed to delete club');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await sendClubMessage(id, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Club not found'}
          </h2>
          <button
            onClick={() => navigate('/clubs')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={club.image_url}
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {club.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    {club.region}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Tag className="h-4 w-4 mr-1" />
                    {club.topic}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={handleEditClub}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleManageMembers}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <UserMinus className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDeleteClub}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleMembershipAction}
                  disabled={isActionLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isMember
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isMember ? (
                    'Leave Club'
                  ) : (
                    'Join Club'
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 prose prose-blue dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {club.description}
              </p>
            </div>

            {/* Members Section */}
            <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Members</h2>
              <div className="flex flex-wrap gap-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.username || member.full_name || 'Member'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-medium">
                          {(member.username || member.full_name || 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {member.username || member.full_name || 'Anonymous'}
                      {member.role === 'admin' && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Admin)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Section */}
            <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Club Chat</h2>
              
              <div className="relative">
                {!isMember && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Join this club to participate in discussions
                      </h3>
                      <button
                        onClick={handleMembershipAction}
                        disabled={isActionLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          'Join Club'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* Messages Container */}
                  <div 
                    ref={chatContainerRef}
                    className="h-[400px] overflow-y-auto p-4 space-y-4"
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Be the first to start a conversation!</p>
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
                              message.sender_email === currentUserEmail ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div className="flex items-start max-w-[80%] gap-2">
                              {message.sender_email !== currentUserEmail && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                                  {message.sender_avatar_url ? (
                                    <img
                                      src={message.sender_avatar_url}
                                      alt={message.sender_email}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-sm font-medium">
                                      {message.sender_email && getInitials(message.sender_email)}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div>
                                {message.sender_email !== currentUserEmail && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {message.sender_email?.split('@')[0]}
                                  </div>
                                )}
                                
                                <div className={`rounded-2xl px-4 py-2 ${
                                  message.sender_email === currentUserEmail
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
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
                  <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-end gap-2">
                      <TextareaAutosize
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message... (Shift + Enter for new line)"
                        className="flex-1 resize-none overflow-hidden min-h-[40px] max-h-[120px] rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSendingMessage || !isMember}
                        minRows={1}
                        maxRows={4}
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !newMessage.trim() || !isMember}
                        className={`p-2 rounded-full bg-blue-600 text-white transition-colors ${
                          isSendingMessage || !newMessage.trim() || !isMember
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-blue-700'
                        }`}
                      >
                        {isSendingMessage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {!isMember && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Join the club to participate in the chat
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClubDetailPage;