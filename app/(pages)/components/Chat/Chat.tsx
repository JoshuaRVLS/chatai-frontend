"use client";

import React, {
  useContext,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { FaPaperPlane, FaTimes, FaEdit, FaTrash, FaRedo } from "react-icons/fa";
import MarkDown from "../MarkDown/MarkDown";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import type {
  Character,
  CharacterImage,
  Chat as ChatModel,
  Message,
  User,
  UserProfileImage,
} from "@/app/generated/prisma";
import { AnimatePresence, motion } from "motion/react";

type ChatData = ChatModel & {
  character: Character & { photo: CharacterImage };
  messages: Message[];
  user: User & { profileImage: UserProfileImage };
};

const Chat = ({ chatId }: { chatId: string }) => {
  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ChatData>({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      return res.json().then((data) => data.data);
    },
    staleTime: 1000 * 60 * 5,
  });

  const userImage = useMemo(
    () =>
      data?.user?.profileImage ? bytesToBase64(data.user.profileImage) : null,
    [data?.user?.profileImage]
  );

  const characterImage = useMemo(
    () => (data?.character?.photo ? bytesToBase64(data.character.photo) : null),
    [data?.character?.photo]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.left - 100, y: rect.top - 50 });
    setShowProfileModal(true);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || !user?.id || isSubmitting) return;

    const content = message.trim();
    setMessage("");
    setIsSubmitting(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      fromUser: true,
      chatId,
    };

    queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, messages: [...oldData.messages, optimisticMessage] };
    });

    scrollToBottom();

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content,
          userId: user.id,
          fromUser: true,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    } catch {
      queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: oldData.messages.filter(
            (m) => m.id !== optimisticMessage.id
          ),
        };
      });
      setMessage(content);
    } finally {
      setIsSubmitting(false);
    }
  }, [message, user?.id, chatId, isSubmitting, queryClient, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await fetch(`/api/messages/${messageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
  };

  const handleRegenerate = async (messageId: string) => {
    await fetch("/api/messages/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, chatId }),
    });
    await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
  };

  // ───────────────────────────────
  // UI
  // ───────────────────────────────

  if (isLoading)
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-cyan-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-cyan-300 font-medium text-lg tracking-wide"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading conversation...
        </motion.div>
      </motion.div>
    );

  if (error)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-red-400">
        Error: {error.message}
      </div>
    );

  if (!data)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-gray-400">
        No chat data found.
      </div>
    );

  return (
    <div className="fixed inset-0 pt-24 flex justify-center h-full w-full bg-gradient-to-b from-black via-slate-900 to-cyan-900">
      {/* Neon glow layer */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(0,196,179,0.2),transparent_60%)]" />

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed z-50 border-2 border-cyan-400/50 backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,196,179,0.4)]"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              width: "clamp(300px, 40vw, 500px)",
              height: "clamp(400px, 50vh, 600px)",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-cyan-950/40">
              <h3 className="text-lg font-semibold text-cyan-300">
                {data.character.name}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-cyan-500/20 rounded-full"
              >
                <FaTimes className="text-cyan-300" />
              </button>
            </div>
            <div className="relative w-full h-3/4">
              <Image
                src={characterImage || "/default-character.png"}
                alt={data.character.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-center text-xs text-cyan-400/70 py-2">
              Drag to move • Click X to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full lg:w-1/2 xl:w-2/5 flex flex-col h-full max-w-4xl rounded-3xl border border-cyan-500/30 bg-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,196,179,0.3)]"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-cyan-500/20 bg-cyan-950/40 rounded-t-3xl">
          <button
            onClick={handleProfileClick}
            className="relative active:scale-95 transition-transform"
          >
            <Image
              src={characterImage || "/default-character.png"}
              width={48}
              height={48}
              alt={data.character.name}
              className="w-12 h-12 rounded-full border-2 border-cyan-400/40 object-cover"
            />
          </button>
          <div>
            <h2 className="text-cyan-200 font-semibold">
              {data.character.name}
            </h2>
            <p className="text-xs text-cyan-400/70">
              Click to view character profile
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-cyan-300/80 italic py-3 bg-cyan-950/30 border border-cyan-500/20 rounded-2xl"
          >
            {data.character.introMessage}
          </motion.div>

          <AnimatePresence initial={false}>
            {data.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble
                  message={msg}
                  userImage={userImage}
                  characterImage={characterImage}
                  isUserMessage={msg.fromUser}
                  isOptimistic={msg.id.startsWith("temp-")}
                  onProfileClick={handleProfileClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                  isEditing={editingMessageId === msg.id}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {isSubmitting && (
            <motion.div
              className="flex items-center gap-2 text-cyan-400 text-sm pl-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-cyan-300">AI is thinking...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-cyan-500/20 bg-cyan-950/40 rounded-b-3xl">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Type your message..."
              disabled={isSubmitting}
              className="w-full bg-cyan-900/40 border border-cyan-500/30 text-cyan-100 placeholder-cyan-500/50 rounded-2xl p-4 pr-12 resize-none focus:ring-2 focus:ring-cyan-400 outline-none transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
              className="absolute right-4 bottom-4 p-3 bg-cyan-500 text-white rounded-full shadow-lg hover:bg-cyan-400 transition-all disabled:bg-cyan-700 disabled:cursor-not-allowed"
            >
              <FaPaperPlane size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MessageBubble = React.memo(
  ({
    message,
    userImage,
    characterImage,
    isUserMessage,
    isOptimistic = false,
    onProfileClick,
    onEdit,
    onDelete,
    onRegenerate,
    isEditing,
    editContent,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
  }: {
    message: Message;
    userImage: string | null;
    characterImage: string | null;
    isUserMessage: boolean;
    isOptimistic?: boolean;
    onProfileClick: (e: React.MouseEvent) => void;
    onEdit: (messageId: string, content: string) => void;
    onDelete: (messageId: string) => void;
    onRegenerate: (messageId: string) => void;
    isEditing?: boolean;
    editContent?: string;
    onEditContentChange?: (content: string) => void;
    onSaveEdit?: (messageId: string) => void;
    onCancelEdit?: () => void;
  }) => {
    const imageSrc = isUserMessage
      ? userImage || "/default-user.png"
      : characterImage || "/default-character.png";

    const altText = isUserMessage ? "User" : "Character";

    return (
      <div
        className={`flex items-start gap-3 ${
          isUserMessage ? "flex-row-reverse" : "flex-row"
        } ${isOptimistic ? "opacity-70" : ""}`}
      >
        {!isUserMessage ? (
          <button
            onClick={onProfileClick}
            className="relative hover:scale-105 transition-transform flex-shrink-0"
          >
            <Image
              src={imageSrc}
              width={40}
              height={40}
              alt={altText}
              className="w-10 h-10 rounded-full border border-var-color-borders object-cover"
              priority
            />
            <div className="absolute inset-0 rounded-full border-2 border-transparent hover:border-var-color-primary-button transition-colors" />
          </button>
        ) : (
          <Image
            src={imageSrc}
            width={40}
            height={40}
            alt={altText}
            className="w-10 h-10 rounded-full border border-var-color-borders object-cover flex-shrink-0"
            priority
          />
        )}

        <div
          className={`flex-1 max-w-[80%] ${
            isUserMessage ? "text-right" : "text-left"
          }`}
        >
          {/* Message Content */}
          <div
            className={`rounded-2xl p-4 ${
              isUserMessage
                ? "bg-var-color-primary-button text-white rounded-br-md"
                : "bg-var-color-for-dark-surface border border-var-color-borders text-var-color-primary-text rounded-bl-md"
            }`}
          >
            {isEditing && isUserMessage ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange?.(e.target.value)}
                  className="w-full bg-var-color-primary-background border border-var-color-borders rounded-lg p-3 text-var-color-primary-text resize-none focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent"
                  rows={4}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1 border border-var-color-borders rounded-lg hover:bg-var-color-borders transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onSaveEdit?.(message.id)}
                    className="px-3 py-1 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MarkDown>{message.content}</MarkDown>
                {isOptimistic && (
                  <div className="text-xs opacity-70 mt-2">Sending...</div>
                )}
              </>
            )}
          </div>

          {/* Message Actions */}
          {!isOptimistic && !isEditing && (
            <div
              className={`flex gap-2 mt-2 ${
                isUserMessage ? "justify-end" : "justify-start"
              }`}
            >
              {/* Edit Button (only for user messages) */}
              {isUserMessage && (
                <button
                  onClick={() => onEdit(message.id, message.content)}
                  className="p-2 bg-var-color-for-dark-surface border border-var-color-borders rounded-lg hover:bg-var-color-primary-button hover:text-white transition-colors text-xs"
                  title="Edit message"
                >
                  <FaEdit size={10} />
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={() => onDelete(message.id)}
                className="p-2 bg-var-color-for-dark-surface border border-var-color-borders rounded-lg hover:bg-var-color-error hover:text-white transition-colors text-xs"
                title="Delete message"
              >
                <FaTrash size={10} />
              </button>

              {/* Regenerate Button (only for AI messages) */}
              {!isUserMessage && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="p-2 bg-var-color-for-dark-surface border border-var-color-borders rounded-lg hover:bg-var-color-secondary-button hover:text-white transition-colors text-xs"
                  title="Regenerate response"
                >
                  <FaRedo size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default Chat;
