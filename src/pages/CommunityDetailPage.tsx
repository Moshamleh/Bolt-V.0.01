import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, MapPin, Tag, MessageSquare, Loader2, 
  Send, X, User, AlertCircle, CheckCircle, 
  Settings, UserMinus, Trash2, Heart
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
  supabase,
  updateProfile,
  awardBadge
} from '../lib/supabase';
import { playPopSound, hasJoinedFirstClub, markFirstClubJoined } from '../lib/utils';
import Confetti from '../components/Confetti';
import { awardXp, XP_VALUES } from '../lib/xpSystem';
import BlurImage from '../components/BlurImage';
import { extractErrorMessage } from '../lib/errorHandling';

const CommunityDetailPage: React.FC = () => {
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
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
        const errorMessage = extractErrorMessage(err);
        setError(`Failed to load community details: ${errorMessage}`);
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
        setCurrentUserId(session.user.id);

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
        toast.success('Left the community successfully');
      } else {
        await joinClub(club.id);
        setMemberCount(prev => prev + 1);
        setIsMember(true);
        toast.success('Joined the community successfully');
        
        // Award XP for joining a club
        try {
          await awardXp(undefined, XP_VALUES.JOIN_CLUB, "Joined a community");
          toast.success(`🎉 +${XP_VALUES.JOIN_CLUB} XP added to your profile!`);
        } catch (xpError) {
          console.error('Failed to award XP for joining community:', xpError);
          // Don't fail the club join if XP awarding fails
        }
        
        // Play sound effect
        playPopSound();
        
        // Check if this is the first club joined
        if (!hasJoinedFirstClub()) {
          setShowConfetti(true);
          markFirstClubJoined();
          
          // Update the profile to mark first_club_joined as true
          await updateProfile({ first_club_joined: true });
          
          // Award the badge
          await awardBadge(undefined, "Club Member", "Joined your first car community");
        }
      }
    } catch (err) {
      console.error('Membership action failed:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(isMember ? `Failed to leave community: ${errorMessage}` : `Failed to join community: ${errorMessage}`);
      setError(isMember ? `Failed to leave community: ${errorMessage}` : `Failed to join community: ${errorMessage}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditClub = () => {
    navigate(`/communities/${id}/edit`);
  };

  const handleManageMembers = () => {
    navigate(`/communities/${id}/members`);
  };

  const handleDeleteClub = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      return;
    }

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Community deleted successfully');
      navigate('/communities');
    } catch (err) {
      console.error('Failed to delete community:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to delete community: ${errorMessage}`);
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
      
      // Award XP for sending a club message
      try {
        await awardXp(undefined, XP_VALUES.SEND_CLUB_MESSAGE, "Sent a message in a community");
      } catch (xpError) {
        console.error('Failed to award XP for club message:', xpError);
        // Don't fail the message send if XP awarding fails
      }
      
      // Play sound effect
      playPopSound();
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = extractErrorMessage(err);
      toast.error(`Failed to send message: ${errorMessage}`);
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

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    // Generate a consistent color based on the user ID
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Simple hash function to get a consistent index
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
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
            {error || 'Community not found'}
          </h2>
          <button
            onClick={() => navigate('/communities')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showConfetti && <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />}
      
      <div className="relative h-64 md:h-80 overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <BlurImage
            src={club.image_url}
            alt={club.name}
            className="w-full h-full"
            objectFit="cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
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
                    'Leave Community'
                  ) : (
                    'Join Community'
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 prose prose-blue dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {club.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
            {/* Members Section */}
            <div className="p-6 md:col-span-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Members
              </h2>
              <div className="space-y-4">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.username || member.full_name || 'Member'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(member.id)} text-white font-medium`}>
                          {getInitials(member.username || member.full_name || 'M')}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.username || member.full_name || 'Anonymous'}
                        </span>
                        {member.role === 'admin' && (
                          <CheckCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      {member.location && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {member.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length > 5 && (
                  <button
                    onClick={() => navigate(`/communities/${id}/members`)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    View all {members.length} members
                  </button>
                )}
                
                {members.length === 0 && (
                  <div className="text-center py-4">
                    <User className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No members yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Section */}
            <div className="md:col-span-3 flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Community Chat
                  </h2>
                </div>
                
                {isMember && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {messages.length} messages
                    </span>
                  </div>
                )}
              </div>
              
              <div className="relative flex-1">
                {!isMember && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Join this community to participate in discussions
                      </h3>
                      <button
                        onClick={handleMembershipAction}
                        disabled={isActionLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          'Join Community'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div 
                  ref={chatContainerRef}
                  className="h-full overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="max-w-md w-full rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 animate-chat-bubble-glow shadow-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-200">
                              No messages yet
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Be the first to start a conversation!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender_email === currentUserEmail;
                        const showSender = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                        const senderName = message.sender_email?.split('@')[0] || 'Anonymous';
                        
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                              {!isCurrentUser && showSender && (
                                <div className="flex-shrink-0 mt-1">
                                  {message.sender_avatar_url ? (
                                    <img
                                      src={message.sender_avatar_url}
                                      alt={senderName}
                                      className="w-8 h-8 rounded-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAvatarColor(message.sender_id)} text-white text-xs font-medium`}>
                                      {getInitials(senderName)}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                {showSender && !isCurrentUser && (
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">
                                    {senderName}
                                  </div>
                                )}
                                
                                <div className={`rounded-2xl px-4 py-2 ${
                                  isCurrentUser
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                                }`}>
                                  {message.content}
                                </div>
                                
                                <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </div>
                              </div>
                              
                              {isCurrentUser && showSender && (
                                <div className="flex-shrink-0 mt-1">
                                  {message.sender_avatar_url ? (
                                    <img
                                      src={message.sender_avatar_url}
                                      alt={senderName}
                                      className="w-8 h-8 rounded-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAvatarColor(message.sender_id)} text-white text-xs font-medium`}>
                                      {getInitials(senderName)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSubmit} className="border-t border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-end gap-2">
                    <TextareaAutosize
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message... (Shift + Enter for new line)"
                      className="flex-1 resize-none overflow-hidden min-h-[40px] max-h-[120px] rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Join the community to participate in the chat
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunityDetailPage;