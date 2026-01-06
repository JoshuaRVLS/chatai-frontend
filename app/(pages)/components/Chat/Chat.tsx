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
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FaPaperPlane, FaTimes, FaEdit, FaTrash, FaRedo, FaUndo, FaBrain, FaThumbtack } from "react-icons/fa";
import ChatNavbar from "./ChatNavbar";
import dynamic from "next/dynamic";
const ChatSettingsModal = dynamic(() => import("./ChatSettingsModal"), { ssr: false });
const BrainPanel = dynamic(() => import("./BrainPanel"), { ssr: false });
import { useRouter } from "next/navigation";
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
  UserSettings,
  UserPersona,
} from "@/app/generated/prisma";
import { AnimatePresence, motion } from "motion/react";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";

type ChatData = ChatModel & {
  character: Character & { photo: CharacterImage };
  messages: Message[];
  user: User & { profileImage: UserProfileImage; userSettings: UserSettings | null };
};

const Chat = ({ chatId }: { chatId: string }) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-v3.2");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [showBrainPanel, setShowBrainPanel] = useState(false);
  const [undoStack, setUndoStack] = useState<Message[][]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

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
    () => data?.user?.id ? `/api/api/authentication_routes/users/picture/${data.user.id}` : null,
    [data?.user?.id]
  );

  const characterImage = useMemo(
    () => data?.character?.id ? `/api/image/${data.character.id}` : null,
    [data?.character?.id]
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

  // Scroll to bottom on initial load
  useEffect(() => {
    if (data?.messages && !isLoading) {
      scrollToBottom();
    }
  }, [data?.messages.length, isLoading, scrollToBottom]);

  // Synchronize local settings with chat data
  useEffect(() => {
    if (data) {
      // 1. Model priority: Chat-specific > Global User Settings > Default
      const chatSettings = (data as any).chatSettings;
      if (chatSettings && chatSettings.model) {
        setSelectedModel(chatSettings.model);
      } else if (data.user.userSettings?.chatSettings) {
        const globalModel = (data.user.userSettings.chatSettings as any).model;
        if (globalModel) setSelectedModel(globalModel);
      }

      // 2. Persona priority: Chat-specific > User's Active Persona
      if (data.personaId) {
        setSelectedPersonaId(data.personaId);
      } else {
        setSelectedPersonaId(data.user.personaUsed || null);
      }
    }
  }, [data]);

  const pushToUndoStack = useCallback(() => {
    if (data?.messages) {
      setUndoStack((prev) => [...prev.slice(-9), data.messages]);
    }
  }, [data?.messages]);

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const previousMessages = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, messages: previousMessages };
    });
  }, [undoStack, chatId, queryClient]);

  const startStreaming = async (content: string, isRegenerate = false) => {
    try {
      setStreamingMessage("");
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content, model: selectedModel, regenerate: isRegenerate }),
      });

      if (!aiRes.ok || !aiRes.body) throw new Error("AI streaming failed");

      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") break;

            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0]?.delta?.content || "";
              fullContent += delta;
              setStreamingMessage(fullContent);
              scrollToBottom();
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }

      // Save final AI message
      await fetch("/api/messages/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content: fullContent }),
      });

      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setStreamingMessage(null);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || !user?.id || isSubmitting) return;

    setIsSubmitting(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      fromUser: true,
      pinned: false,
      chatId,
    };

    queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, messages: [...oldData.messages, optimisticMessage] };
    });

    scrollToBottom();

    try {
      // 1. Save user message
      const saveRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content: content.trim(),
          userId: user.id,
          fromUser: true,
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to send message");

      // 2. Start streaming AI response
      await startStreaming(content.trim());
    } catch (err) {
      console.error(err);
      queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: oldData.messages.filter(
            (m) => m.id !== optimisticMessage.id
          ),
        };
      });
      setIsSubmitting(false);
      throw err; // Propagate to ChatInput to restore message
    }
  }, [user?.id, chatId, isSubmitting, queryClient, scrollToBottom, startStreaming]);

  const handleEdit = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  }, []);

  const handleEditContentChange = useCallback((content: string) => {
    setEditContent(content);
  }, []);

  const handleSaveEdit = useCallback(async (messageId: string) => {
    if (!editContent.trim()) return;
    await fetch(`/api/messages/${messageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    setEditingMessageId(null);
    setEditContent("");
  }, [editContent, chatId, queryClient]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditContent("");
  }, []);

  const handleDelete = useCallback(async (messageId: string, isUserMessage: boolean) => {
    if (!(await confirm({
      title: "Delete Message",
      message: "Are you sure you want to delete this message? This will permanently remove it from the simulation.",
      confirmLabel: "Delete",
      variant: "danger"
    }))) return;
    pushToUndoStack();
    const cascade = isUserMessage ? "?cascade=true" : "";
    await fetch(`/api/messages/${messageId}${cascade}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
  }, [chatId, queryClient, pushToUndoStack]);

  const handleUserRegenerate = useCallback(async (messageId: string) => {
    if (isSubmitting || !data) return;
    const msgIndex = data.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;
    const userMsg = data.messages[msgIndex];
    if (!userMsg.fromUser) return;

    pushToUndoStack();
    const cascade = "?cascade=true";
    await fetch(`/api/messages/${messageId}${cascade}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
  }, [isSubmitting, data, chatId, queryClient, pushToUndoStack]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (isSubmitting || !data) return;

    const msgIndex = data.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const lastUserMsg = data.messages[msgIndex - 1];
    if (!lastUserMsg || !lastUserMsg.fromUser) return;

    setIsSubmitting(true);

    try {
      await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: oldData.messages.filter((m) => m.id !== messageId),
        };
      });

      await startStreaming(lastUserMsg.content, true);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [isSubmitting, data, chatId, queryClient, startStreaming]);

  const handleClearHistory = useCallback(async () => {
    if (!(await confirm({
      title: "Clear Chat History",
      message: "Are you sure you want to clear the entire chat history? This cannot be undone and will reset the conversation state.",
      confirmLabel: "Clear History",
      variant: "danger"
    }))) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("History cleared");
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      } else {
        toast.error("Failed to clear history");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [chatId, queryClient]);


  const handleTogglePin = useCallback(async (messageId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: oldData.messages.map(m => m.id === messageId ? { ...m, pinned: !currentStatus } : m)
        };
      });

      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentStatus }),
      });

      if (!res.ok) throw new Error();
    } catch (err) {
      toast.error("Failed to update pin status");
      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    }
  }, [chatId, queryClient]);

  const handleClearMemory = useCallback(async () => {
    if (!(await confirm({
      title: "Reset Brain & Memory",
      message: "Are you sure you want to clear all learned facts and long-term memories? This will make the character 'forget' specific details they learned about you.",
      confirmLabel: "Reset Memory",
      variant: "danger"
    }))) return;

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: null }),
      });
      if (res.ok) {
        toast.success("AI brain reset successfully");
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      }
    } catch (err) {
      toast.error("Failed to reset memory");
    }
  }, [chatId, queryClient]);

  const handleUpdateChatSettings = useCallback(async (model: string, personaId: string | null) => {
    setSelectedModel(model);
    setSelectedPersonaId(personaId);

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatSettings: { model },
          personaId: personaId
        }),
      });
      if (res.ok) {
        toast.success("Chat settings updated");
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Failed to update chat settings");
    }
  }, [chatId, queryClient]);

  const handleUpdateMemory = useCallback(async (newMemory: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: newMemory }),
      });
      if (res.ok) {
        toast.success("AI brain updated");
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      }
    } catch (err) {
      toast.error("Failed to update brain");
    }
  }, [chatId, queryClient]);

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
    <div className="fixed inset-0 flex items-center justify-center h-full w-full bg-[#020617]">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-50 border border-white/10 backdrop-blur-3xl bg-slate-950/80 rounded-[2.5rem] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.8)]"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              width: "400px",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                  {data.character.name}
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="relative aspect-square w-full">
              <Image
                src={characterImage || "/default-character.png"}
                alt={data.character.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent" />
            </div>
            <div className="p-6">
              <p className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-relaxed line-clamp-4">
                {data.character.bio}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-120px)] h-full bg-white/[0.02] border-x border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      >
        {/* Header */}
        <ChatNavbar
          characterName={data.character.name}
          characterImage={characterImage}
          onProfileClick={handleProfileClick}
          onUndo={handleUndo}
          onClearHistory={handleClearHistory}
          onShowSettings={() => setShowSettingsModal(true)}
          onShowBrain={() => setShowBrainPanel(true)}
          hasUndo={undoStack.length > 0}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 pt-8 space-y-8 scrollbar-hide">
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
                  onDelete={(id) => handleDelete(id, msg.fromUser)}
                  onRegenerate={handleRegenerate}
                  onUserRegenerate={handleUserRegenerate}
                  isEditing={editingMessageId === msg.id}
                  editContent={editContent}
                  onEditContentChange={handleEditContentChange}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onTogglePin={handleTogglePin}
                />
              </motion.div>
            ))}

            {/* Streaming Message */}
            {streamingMessage !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble
                  message={{ content: streamingMessage, id: "streaming" } as any}
                  userImage={userImage}
                  characterImage={characterImage}
                  isUserMessage={false}
                  isOptimistic={true}
                  onProfileClick={handleProfileClick}
                  onEdit={() => { }}
                  onDelete={() => { }}
                  onRegenerate={() => { }}
                  onUserRegenerate={() => { }}
                  onTogglePin={() => { }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isSubmitting && (
            <motion.div
              className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl w-fit"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Processing response</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        <p className="hidden sm:block text-center text-[9px] font-black text-white/10 uppercase tracking-[0.4em] mt-4 italic">Secure AI Chat Interface • Version 2.0</p>
      </motion.div>

      {/* Settings Modal */}
      <ChatSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentModel={selectedModel}
        currentPersonaId={selectedPersonaId}
        onSave={handleUpdateChatSettings}
      />

      {/* Brain Panel */}
      <BrainPanel
        isOpen={showBrainPanel}
        onClose={() => setShowBrainPanel(false)}
        memory={data.memory}
        onClearMemory={handleClearMemory}
        onUpdateMemory={handleUpdateMemory}
        pinnedMessages={(data.messages || []).filter(m => m.pinned).map(m => ({ id: m.id, content: m.content, fromUser: m.fromUser }))}
        onUnpin={(id) => handleTogglePin(id, true)}
      />
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
    onUserRegenerate,
    isEditing,
    editContent,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    onTogglePin,
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
    onUserRegenerate: (messageId: string) => void;
    isEditing?: boolean;
    editContent?: string;
    onEditContentChange?: (content: string) => void;
    onSaveEdit?: (messageId: string) => void;
    onCancelEdit?: () => void;
    onTogglePin: (messageId: string, currentStatus: boolean) => void;
  }) => {
    const [showActions, setShowActions] = useState(false);
    const imageSrc = isUserMessage
      ? userImage || "/default-user.png"
      : characterImage || "/default-character.png";

    const altText = isUserMessage ? "User" : "Character";

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowActions(true);
    };

    const handleTap = () => {
      setShowActions((prev) => !prev);
    };

    return (
      <div
        className={`group flex items-start gap-3 ${isUserMessage ? "flex-row-reverse" : "flex-row"
          } ${isOptimistic ? "opacity-70" : ""}`}
        onContextMenu={handleContextMenu}
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
              className="w-10 h-10 rounded-full border border-white/10 object-cover"
            />
          </button>
        ) : (
          <Image
            src={imageSrc}
            width={40}
            height={40}
            alt={altText}
            className="w-10 h-10 rounded-full border border-white/10 object-cover flex-shrink-0"
          />
        )}

        <div
          className={`flex-1 max-w-[80%] ${isUserMessage ? "text-right" : "text-left"}`}
        >
          {/* Message Content */}
          <div
            onClick={handleTap}
            className={`relative rounded-[2rem] px-6 py-4 transition-all duration-300 cursor-pointer ${isUserMessage
              ? "bg-primary text-slate-950 font-medium rounded-tr-md shadow-[0_10px_30px_rgba(34,211,238,0.15)]"
              : "bg-white/5 border border-white/10 text-white/90 rounded-tl-md backdrop-blur-sm"
              }`}
          >
            <div className={`absolute top-0 ${isUserMessage ? '-right-1' : '-left-1'} w-3 h-3 bg-inherit transform rotate-45`} />
            {isEditing && isUserMessage ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange?.(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancelEdit?.(); }}
                    className="px-3 py-1 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSaveEdit?.(message.id); }}
                    className="px-3 py-1 bg-primary text-slate-900 rounded-lg hover:opacity-80 transition-colors text-sm font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MarkDown>{message.content}</MarkDown>
                {isOptimistic && message.id === "streaming" && (
                  <div className="absolute bottom-1 right-3 flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
                    <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Message Actions - Show on hover (desktop) or tap (mobile) */}
          {!isOptimistic && !isEditing && (
            <div
              className={`flex gap-1.5 mt-3 transition-all duration-200 ${showActions ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
                } ${isUserMessage ? "justify-end" : "justify-start"}`}
            >
              {isUserMessage && (
                <button
                  onClick={() => onEdit(message.id, message.content)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition-all text-white/60 hover:text-white"
                  title="Edit"
                >
                  <FaEdit size={12} />
                </button>
              )}

              <button
                onClick={() => onDelete(message.id)}
                className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-all text-white/60 hover:text-red-400"
                title="Delete"
              >
                <FaTrash size={12} />
              </button>

              {!isUserMessage && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/30 transition-all text-white/60 hover:text-primary"
                  title="Regenerate"
                >
                  <FaRedo size={12} />
                </button>
              )}

              {isUserMessage && (
                <button
                  onClick={() => onUserRegenerate(message.id)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl hover:bg-purple-500/20 hover:border-purple-500/30 transition-all text-white/60 hover:text-purple-400"
                  title="Edit and resend"
                >
                  <FaRedo size={12} />
                </button>
              )}

              <button
                onClick={() => onTogglePin(message.id, !!message.pinned)}
                className={`w-8 h-8 flex items-center justify-center border rounded-xl transition-all ${message.pinned
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/10 border-white/10 text-white/60 hover:bg-primary/10 hover:text-primary"
                  }`}
                title={message.pinned ? "Unpin message" : "Pin message"}
              >
                <FaThumbtack size={12} className={message.pinned ? "" : "-rotate-45"} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

const ChatInput = React.memo(({
  onSubmit,
  isSubmitting
}: {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
}) => {
  const [message, setMessage] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = '56px';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleInternalSubmit = async () => {
    if (!message.trim() || isSubmitting) return;
    const content = message;
    setMessage("");
    try {
      await onSubmit(content);
      const textarea = document.querySelector('textarea[placeholder="Talk to character..."]') as HTMLTextAreaElement;
      if (textarea) textarea.style.height = '56px';
    } catch (err) {
      setMessage(content);
    }
  };

  return (
    <div className="p-4 sm:p-8 border-t border-white/5 bg-slate-950/40 backdrop-blur-3xl pb-0 sm:pb-0">
      <div className="relative flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
        <div className="relative flex-1 group">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            placeholder="Talk to character..."
            disabled={isSubmitting}
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-8 py-4 sm:py-5 pr-14 sm:pr-16 resize-none focus:border-primary/50 focus:bg-white/10 outline-none transition-[border-color,background-color] duration-300 text-sm leading-relaxed"
            style={{ height: '56px', minHeight: '56px', maxHeight: '200px', overflowY: 'auto' }}
          />
          <div className="absolute top-[18px] left-3 w-1 h-5 bg-primary/40 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInternalSubmit}
          disabled={!message.trim() || isSubmitting}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] bg-primary text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-white/10 disabled:text-white/20"
        >
          <FaPaperPlane size={18} />
        </motion.button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default Chat;
