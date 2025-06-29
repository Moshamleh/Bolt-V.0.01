import React, { useState, useRef, useEffect } from "react";
import {
  SendHorizonal,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Link as LinkIcon,
  Repeat,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import toast from "react-hot-toast";
import {
  sendDiagnosticPrompt,
  recordAiFeedback,
  subscribeToDiagnosisUpdates,
  Diagnosis,
} from "../lib/supabase";
import {
  playPopSound,
  hasCompletedFirstDiagnostic,
  markFirstDiagnosticCompleted,
} from "../lib/utils";
import Confetti from "./Confetti";
import { awardXp, XP_VALUES } from "../lib/xpSystem";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isError?: boolean;
  timestamp: Date;
  originalPrompt?: string;
  isTypingIndicator?: boolean;
  diagnosisId?: string;
  hasFeedback?: boolean;
}

interface ChatInterfaceProps {
  selectedVehicleId: string;
  onDiagnosisAdded: (diagnosis: Diagnosis) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeDiagnosisId: string | null;
  setActiveDiagnosisId: React.Dispatch<React.SetStateAction<string | null>>;
  suggestedPrompts?: string[];
  recheckPrompt?: string | null;
  setRecheckPrompt?: React.Dispatch<React.SetStateAction<string | null>>;
  userName?: string;
}

// AI flair messages to randomly append to responses
const AI_FLAIRS = [
  "– Bolt ⚡🔧",
  "Let's fix that 💪",
  "Classic issue — easy win 🧠",
  "Hope that helps! ⚡",
  "You've got this! 🔧",
  "Happy wrenching! 🛠️",
  "Drive safe! 🚗",
  "Bolt's got your back 🔩",
  "That should do the trick 👍",
  "Let me know how it goes! 🤔",
  "Sounds like a plan? 🧰",
];

// Maximum number of AI responses allowed in a single session
const MAX_AI_RESPONSES = 5;

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedVehicleId,
  onDiagnosisAdded,
  messages,
  setMessages,
  activeDiagnosisId,
  setActiveDiagnosisId,
  suggestedPrompts = [],
  recheckPrompt = null,
  setRecheckPrompt,
  userName = "",
}) => {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(
    null
  );
  const [messageVersion, setMessageVersion] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInitialGreeting, setShowInitialGreeting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Count AI responses in the current session
  const aiResponseCount = messages.filter(
    (msg) => !msg.isUser && !msg.isError && !msg.isTypingIndicator
  ).length;
  const isAtResponseLimit = aiResponseCount >= MAX_AI_RESPONSES;

  // Default prompt chips
  const defaultPromptChips = [
    "🚨 I got a warning light on",
    "🔊 Weird noise when braking",
    "💨 My car feels sluggish",
  ];

  // Use provided suggested prompts or default ones
  const promptChips =
    suggestedPrompts.length > 0 ? suggestedPrompts : defaultPromptChips;

  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3"
    );
    audioRef.current.volume = 0.2;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Handle recheckPrompt changes
  useEffect(() => {
    if (recheckPrompt && setRecheckPrompt) {
      setInput(recheckPrompt);
      setRecheckPrompt(null); // Clear it after setting input
    }
  }, [recheckPrompt, setRecheckPrompt]);

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom =
        container.scrollHeight - container.clientHeight <=
        container.scrollTop + 100;

      if (isScrolledToBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, messageVersion]);

  // Show initial greeting when chat is empty
  useEffect(() => {
    if (messages.length === 0 && showInitialGreeting) {
      // Add typing indicator
      const typingIndicatorId = `typing-${Date.now()}`;
      setMessages([
        {
          id: typingIndicatorId,
          text: "",
          isUser: false,
          isTypingIndicator: true,
          timestamp: new Date(),
        },
      ]);
      setMessageVersion((prev) => prev + 1);

      // After 2 seconds, replace with welcome message
      setTimeout(() => {
        // Create personalized greeting
        const greeting = `👋 Hey ${
          userName ? userName : "there"
        }, I'm Bolt — your personal AI mechanic.

I'm here to help with anything under the hood.
Try saying: "My car makes a weird clicking sound when I turn."`;

        setMessages([
          {
            id: `greeting-${Date.now()}`,
            text: greeting,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        setMessageVersion((prev) => prev + 1);
        setShowInitialGreeting(false);
      }, 2000);
    }
  }, [messages, showInitialGreeting, userName, setMessages]);

  const provideFeedback = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const formatAiResponse = (text: string) => {
    // Replace keywords with emojis
    const emojiReplacements = {
      battery: "🔋 battery",
      engine: "🛠️ engine",
      oil: "🛢 oil",
      brake: "🛑 brake",
      "warning light": "⚠️ warning light",
      replace: "🔁 replace",
      check: "✅ check",
      transmission: "⚙️ transmission",
      coolant: "🧊 coolant",
      temperature: "🌡️ temperature",
      tire: "🛞 tire",
      "spark plug": "⚡ spark plug",
      filter: "🧹 filter",
      steering: "🎮 steering",
      exhaust: "💨 exhaust",
      fuel: "⛽ fuel",
    };

    // Process text with emoji replacements (case-insensitive)
    let processedText = text;
    Object.entries(emojiReplacements).forEach(([keyword, replacement]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      processedText = processedText.replace(regex, replacement);
    });

    // Process special link formats like [PART:Brake Pads] or [REPAIR:Oil Change]
    processedText = processedText.replace(
      /\[(PART|REPAIR|DIAGNOSTIC):([^\]]+)\]/g,
      (match, type, content) => {
        let url = "";
        let icon = "";

        switch (type) {
          case "PART":
            url = `/marketplace?search=${encodeURIComponent(content)}`;
            icon = "🔍";
            break;
          case "REPAIR":
            url = `/help?search=${encodeURIComponent(content)}`;
            icon = "🔧";
            break;
          case "DIAGNOSTIC":
            url = `/diagnostic?prompt=${encodeURIComponent(content)}`;
            icon = "🔎";
            break;
          default:
            return match;
        }

        return `<a href="${url}" class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">${icon} ${content} <span class="inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg></span></a>`;
      }
    );

    const paragraphs = processedText.split("\n\n");
    const elements: JSX.Element[] = [];

    paragraphs.forEach((block, blockIndex) => {
      const lines = block.split("\n");
      let isListBlock = false;
      let listType: "ul" | "ol" | null = null;
      const listItems: string[] = [];

      if (lines.length > 0) {
        if (lines[0].match(/^\s*[-*•]\s/)) {
          isListBlock = true;
          listType = "ul";
        } else if (lines[0].match(/^\s*\d+\.\s/)) {
          isListBlock = true;
          listType = "ol";
        }
      }

      if (isListBlock) {
        lines.forEach((line) => {
          const trimmedLine = line.trim();
          if (
            listType === "ul" &&
            (trimmedLine.startsWith("- ") ||
              trimmedLine.startsWith("* ") ||
              trimmedLine.startsWith("• "))
          ) {
            listItems.push(trimmedLine.replace(/^[-*•]\s/, "").trim());
          } else if (listType === "ol" && trimmedLine.match(/^\d+\.\s/)) {
            listItems.push(trimmedLine.replace(/^\d+\.\s/, "").trim());
          } else {
            if (listItems.length > 0) {
              listItems[listItems.length - 1] += ` ${trimmedLine}`;
            } else if (trimmedLine.length > 0) {
              elements.push(
                <p
                  key={`p-${blockIndex}-${elements.length}`}
                  className="mb-2 last:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: formatTextWithMarkdown(trimmedLine),
                  }}
                />
              );
            }
          }
        });

        if (listItems.length > 0) {
          const ListTag = listType === "ol" ? "ol" : "ul";
          elements.push(
            <ListTag
              key={`list-${blockIndex}`}
              className={`${
                listType === "ol" ? "list-decimal" : "list-disc"
              } list-inside mb-2 space-y-1 pl-4`}
            >
              {listItems.map((item, itemIndex) => (
                <li
                  key={`list-item-${blockIndex}-${itemIndex}`}
                  className="text-neutral-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{
                    __html: formatTextWithMarkdown(item),
                  }}
                />
              ))}
            </ListTag>
          );
        }
      } else {
        if (block.trim().length > 0) {
          elements.push(
            <p
              key={`p-${blockIndex}`}
              className="mb-2 last:mb-0"
              dangerouslySetInnerHTML={{
                __html: formatTextWithMarkdown(block.trim()),
              }}
            />
          );
        }
      }
    });

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {elements}
      </div>
    );
  };

  // Helper function to format text with markdown-like syntax
  const formatTextWithMarkdown = (text: string) => {
    // Format bold text
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formattedText = formattedText.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Format italic text
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

    // Format inline code
    formattedText = formattedText.replace(/`(.*?)`/g, "<code>$1</code>");

    return formattedText;
  };

  const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
    e?.preventDefault();
    const textToSubmit = promptText || input.trim();
    if (!textToSubmit || isSubmitting || !selectedVehicleId) return;

    // Check if we've reached the maximum number of AI responses
    if (isAtResponseLimit) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: "You've reached the maximum number of AI responses in this session. Please click 'Start New Session' to continue with a fresh conversation.",
          isUser: false,
          isError: true,
          timestamp: new Date(),
        },
      ]);
      setMessageVersion((prev) => prev + 1);
      return;
    }

    await provideFeedback();
    setIsSubmitting(true);

    const currentTime = new Date();
    const userMessage: ChatMessage = {
      id: currentTime.getTime().toString(),
      text: textToSubmit,
      isUser: true,
      timestamp: currentTime,
    };

    const typingIndicator: ChatMessage = {
      id: `typing-${currentTime.getTime()}`,
      text: "",
      isUser: false,
      isTypingIndicator: true,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMessage, typingIndicator]);
    setMessageVersion((prev) => prev + 1);
    setInput("");

    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const diagnosis = await sendDiagnosticPrompt(
        selectedVehicleId,
        textToSubmit
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, diagnosisId: diagnosis.id }
            : msg
        )
      );
      setMessageVersion((prev) => prev + 1);

      setActiveDiagnosisId(diagnosis.id);

      unsubscribeRef.current = subscribeToDiagnosisUpdates(
        diagnosis.id,
        (updatedDiagnosis) => {
          if (updatedDiagnosis.response) {
            // Randomly decide whether to add a flair message (50% chance)
            let responseText = updatedDiagnosis.response;
            if (Math.random() > 0.5) {
              // Select a random flair message
              const randomFlair =
                AI_FLAIRS[Math.floor(Math.random() * AI_FLAIRS.length)];
              // Append the flair to the response
              responseText = `${responseText}\n\n${randomFlair}`;
            }

            setMessages((prev) => {
              // Remove typing indicator
              const filteredMessages = prev.filter(
                (msg) => !msg.isTypingIndicator
              );

              // Find existing AI message for this diagnosis
              const aiMessageIndex = filteredMessages.findIndex(
                (msg) => msg.diagnosisId === updatedDiagnosis.id && !msg.isUser
              );

              if (aiMessageIndex >= 0) {
                // Update existing AI message
                const updatedMessages = [...filteredMessages];
                updatedMessages[aiMessageIndex] = {
                  ...updatedMessages[aiMessageIndex],
                  text: responseText,
                };
                return updatedMessages;
              } else {
                // Add new AI message
                return [
                  ...filteredMessages,
                  {
                    id: `ai-${Date.now()}`,
                    text: responseText,
                    isUser: false,
                    timestamp: new Date(),
                    diagnosisId: updatedDiagnosis.id,
                  },
                ];
              }
            });
            setMessageVersion((prev) => prev + 1);

            onDiagnosisAdded(updatedDiagnosis);
            setIsSubmitting(false);

            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }

            window.dispatchEvent(new Event("resize"));

            // Check if this is the first diagnostic and show confetti
            if (!hasCompletedFirstDiagnostic()) {
              setShowConfetti(true);
              markFirstDiagnosticCompleted();
            }

            // Award XP for completing a diagnostic
            try {
              awardXp(
                undefined,
                XP_VALUES.RUN_DIAGNOSTIC,
                "Completed AI diagnostic"
              );
            } catch (xpError) {
              console.error("Failed to award XP:", xpError);
              // Don't fail the diagnostic if XP awarding fails
            }
          }
        }
      );
    } catch (err) {
      console.error("❌ Error submitting diagnostic:", err);

      setMessages((prev) => {
        const filteredMessages = prev.filter((msg) => !msg.isTypingIndicator);
        return [
          ...filteredMessages,
          {
            id: `error-${Date.now()}`,
            text: "Something went wrong. Please try again.",
            isUser: false,
            isError: true,
            timestamp: new Date(),
            originalPrompt: textToSubmit,
          },
        ];
      });
      setMessageVersion((prev) => prev + 1);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFeedback = async (
    messageId: string,
    diagnosisId: string,
    wasHelpful: boolean
  ) => {
    setSubmittingFeedback(messageId);
    try {
      await recordAiFeedback(diagnosisId, wasHelpful);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, hasFeedback: true } : msg
        )
      );
      setMessageVersion((prev) => prev + 1);
      toast.success("Thanks for your feedback!");

      // Play sound effect
      playPopSound();

      // Award XP for providing feedback
      try {
        await awardXp(
          undefined,
          XP_VALUES.PROVIDE_FEEDBACK,
          "Provided feedback on AI diagnostic"
        );
      } catch (xpError) {
        console.error("Failed to award XP for feedback:", xpError);
        // Don't fail the feedback if XP awarding fails
      }
    } catch (err) {
      console.error("Failed to record feedback:", err);
      toast.error("Failed to record feedback");
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    handleSubmit(undefined, prompt);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {showConfetti && (
        <Confetti duration={3000} onComplete={() => setShowConfetti(false)} />
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Message Limit Indicator */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
            {aiResponseCount}/{MAX_AI_RESPONSES} AI responses used in this
            session
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="max-w-md w-full rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 animate-chat-bubble-glow shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-blink-wrench"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    👋 Hey there, I'm Bolt — your personal AI mechanic.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    I'm here to help with anything under the hood.
                    <br />
                    Try saying: "My car makes a weird clicking sound when I
                    turn."
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg ${
                      message.isUser
                        ? "bg-blue-600 text-white rounded-br-none px-4 py-2"
                        : message.isError
                        ? "bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4"
                        : "bg-neutral-100 dark:bg-gray-800 text-neutral-800 dark:text-gray-200 rounded-bl-none p-4 border border-neutral-200 dark:border-gray-700"
                    }`}
                  >
                    {message.isTypingIndicator ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </div>
                    ) : message.isUser ? (
                      message.text
                    ) : message.isError ? (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{message.text}</p>
                          {isAtResponseLimit && (
                            <p className="mt-2 text-sm">
                              This limit helps keep conversations focused and
                              efficient. Click the "Start New Session" button
                              above to continue with a fresh conversation.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      formatAiResponse(message.text)
                    )}
                  </div>
                </div>

                {!message.isUser &&
                  !message.isError &&
                  message.diagnosisId &&
                  !message.hasFeedback && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 pl-4"
                      >
                        <span className="text-sm text-neutral-500 dark:text-gray-400">
                          Was this helpful?
                        </span>
                        <button
                          onClick={() =>
                            handleFeedback(
                              message.id,
                              message.diagnosisId!,
                              true
                            )
                          }
                          disabled={!!submittingFeedback}
                          className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-gray-700 transition-colors ${
                            submittingFeedback === message.id
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          {submittingFeedback === message.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                          ) : (
                            <ThumbsUp className="h-5 w-5 text-neutral-400" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleFeedback(
                              message.id,
                              message.diagnosisId!,
                              false
                            )
                          }
                          disabled={!!submittingFeedback}
                          className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-gray-700 transition-colors ${
                            submittingFeedback === message.id
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          <ThumbsDown className="h-5 w-5 text-neutral-400" />
                        </button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex flex-wrap gap-2 pl-4 mt-2"
                      >
                        <button
                          onClick={() =>
                            handleSubmit(
                              undefined,
                              "🧰 Can you walk me through steps to fix it?"
                            )
                          }
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                        >
                          🧰 Can you walk me through steps to fix it?
                        </button>
                        <button
                          onClick={() =>
                            handleSubmit(undefined, "🛒 What part do I need?")
                          }
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                        >
                          🛒 What part do I need?
                        </button>
                      </motion.div>
                    </>
                  )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Chips */}
      {messages.length === 0 && (
        <div className="px-4 pb-4">
          <div className="text-sm font-medium text-neutral-500 dark:text-gray-400 mb-2">
            Common issues:
          </div>
          <div className="flex flex-wrap gap-2">
            {promptChips.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPromptClick(prompt)}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-[64px] left-0 right-0 bg-white dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 px-4 py-2 shadow-md"
      >
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your car issue..."
            className="flex-1 resize-none overflow-hidden min-h-[40px] max-h-[120px] rounded-lg border border-neutral-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isAtResponseLimit}
            minRows={1}
            maxRows={4}
          />
          <button
            type="submit"
            disabled={isSubmitting || !input.trim() || isAtResponseLimit}
            className={`rounded-lg bg-blue-600 p-2 text-white transition-colors ${
              isSubmitting || !input.trim() || isAtResponseLimit
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
            aria-label="Send message"
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
