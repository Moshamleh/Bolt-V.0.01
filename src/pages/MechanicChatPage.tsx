import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  CheckCircle,
  DollarSign,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import TextareaAutosize from "react-textarea-autosize";
import toast from "react-hot-toast";
import {
  supabase,
  Mechanic,
  getMechanicChatDetails,
  getMechanicMessages,
  MechanicMessage,
} from "../lib/supabase";
import { awardXp, XP_VALUES } from "../lib/xpSystem";
import CheckoutModal from "../components/payments/CheckoutModal";

const MechanicChatPage: React.FC = () => {
  const { mechanicId: chatId } = useParams<{ mechanicId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MechanicMessage[]>([]);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0); // minutes
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const loadChatData = async () => {
      if (!chatId) return;

      try {
        setLoading(true);

        // Load chat details and messages in parallel
        const [chatDetails, chatMessages] = await Promise.all([
          getMechanicChatDetails(chatId),
          getMechanicMessages(chatId),
        ]);

        if (!chatDetails) {
          setError("Chat not found");
          return;
        }

        setMechanic(chatDetails.mechanic || null);
        setMessages(chatMessages);

        // Clean up any existing subscription
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Set up real-time subscription
        const channel = supabase
          .channel(`mechanic_messages:${chatId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "mechanic_messages",
              filter: `chat_id=eq.${chatId}`,
            },
            (payload) => {
              const newMessage = payload.new as MechanicMessage;
              setMessages((prev) => [...prev, newMessage]);
            }
          )
          .subscribe();

        // Store the channel reference
        channelRef.current = channel;
      } catch (err) {
        console.error("Failed to load chat data:", err);
        setError("Failed to load chat");
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
  }, [chatId]);

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom =
        container.scrollHeight - container.clientHeight <=
        container.scrollTop + 100;

      if (isScrolledToBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      }
    }
  }, [messages]);

  // Start session timer when first message is sent
  useEffect(() => {
    if (messages.length > 0 && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
  }, [messages.length, sessionStartTime]);

  // Update session duration every minute
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor(
        (Date.now() - sessionStartTime.getTime()) / (1000 * 60)
      );
      setSessionDuration(duration);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !chatId) return;

    setSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.from("mechanic_messages").insert({
        chat_id: chatId,
        sender_id: session.user.id,
        sender_type: "user",
        message: input.trim(),
      });

      if (error) throw error;

      // Award XP for sending a message
      try {
        await awardXp(
          undefined,
          XP_VALUES.SEND_CLUB_MESSAGE,
          "Sent a message to a mechanic"
        );
      } catch (xpError) {
        console.error("Failed to award XP for mechanic message:", xpError);
        // Don't fail the message send if XP awarding fails
      }

      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Top Bar Skeleton */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div>
              <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Chat Messages Skeleton */}
            <div className="h-[500px] p-4 space-y-4">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading chat...
                  </p>
                </div>
              </div>
            </div>

            {/* Input Skeleton */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => navigate("/mechanic-support")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Back to Mechanic Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/mechanic-support")}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Find Mechanics
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {mechanic?.full_name || "Professional Mechanic"}
                {mechanic?.is_certified && (
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mechanic?.is_certified
                  ? "Certified Mechanic"
                  : "Professional Mechanic"}{" "}
                • Available now
              </p>
            </div>
          </div>

          {/* Session Timer & Payment Section */}
          {sessionStartTime && (
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{sessionDuration} min</span>
                {mechanic?.hourly_rate && (
                  <span className="text-green-600 dark:text-green-400">
                    ($
                    {(sessionDuration * (mechanic.hourly_rate / 60)).toFixed(2)}
                    )
                  </span>
                )}
              </div>

              {sessionDuration > 0 && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Pay for Session
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                        message.sender_type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="flex items-start max-w-[80%] gap-2">
                        {message.sender_type === "mechanic" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {message.sender?.avatar_url ? (
                              <img
                                src={message.sender.avatar_url}
                                alt={message.sender.full_name || "Mechanic"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          {message.sender_type === "mechanic" &&
                            message.sender?.full_name && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                {message.sender.full_name}
                                {mechanic?.is_certified && (
                                  <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            )}

                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.sender_type === "user"
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
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
            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-100 dark:border-gray-700 p-4"
            >
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
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
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

      {/* Payment Modal */}
      {mechanic && (
        <CheckoutModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          type="service"
          data={{
            mechanic_id: mechanic.id,
            customer_id: "", // Will be set by the modal
            amount: Math.round(
              (sessionDuration * (mechanic.hourly_rate || 50) * 100) / 60
            ), // Convert to cents
            duration_minutes: sessionDuration,
            service_type: "chat_consultation",
            title: `${sessionDuration} minute consultation with ${mechanic.full_name}`,
            description: `Professional automotive consultation via chat`,
          }}
          onSuccess={(result) => {
            console.log("Payment successful:", result);
            toast.success(
              "Payment completed! Thank you for using our service."
            );
            setIsPaymentModalOpen(false);
            // Reset session timer
            setSessionStartTime(null);
            setSessionDuration(0);
          }}
        />
      )}
    </div>
  );
};

export default MechanicChatPage;
