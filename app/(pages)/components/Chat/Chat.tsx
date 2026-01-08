"use client";

import React, {
  useContext,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/app/lib/toast";
import Image from "next/image";
import { FaPaperPlane, FaTimes, FaEdit, FaTrash, FaRedo, FaUndo, FaBrain, FaThumbtack, FaMagic, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import ChatNavbar from "./ChatNavbar";
import { useSettings } from "@/app/hooks/useSettings";
import { FiEye } from "react-icons/fi";
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
  const { settings } = useSettings();
  const [tempUnblurMessages, setTempUnblurMessages] = useState<{ [key: string]: boolean }>({});
  const [tempUnblurModal, setTempUnblurModal] = useState(false);

  const { data: chat, isLoading: isChatLoading, error: chatError } = useQuery<ChatData>({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      return res.json().then((data) => data.data);
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: infiniteMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useInfiniteQuery({
    queryKey: ["messages", chatId],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/messages?chatId=${chatId}&cursor=${pageParam || ""}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
  });

  const allMessages = useMemo(() => {
    // Collect all messages from all pages
    const messages = infiniteMessages?.pages.flatMap((page) => page.data) || [];
    // The API returns desc (newest first). We want to show them chronologically (oldest first).
    return [...messages].reverse();
  }, [infiniteMessages]);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Intersection Observer for loading more
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Store current scroll height before loading more
          if (scrollContainerRef.current) {
            scrollPositionRef.current = scrollContainerRef.current.scrollHeight;
          }
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Maintain scroll position after prepending messages
  useEffect(() => {
    if (isFetchingNextPage) return;
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const heightDiff = newScrollHeight - scrollPositionRef.current;
      if (heightDiff > 0) {
        scrollContainerRef.current.scrollTop += heightDiff;
        scrollPositionRef.current = 0; // Reset
      }
    }
  }, [allMessages, isFetchingNextPage]);

  const userImage = useMemo(
    () => chat?.user?.profileImage ? `/api/users/picture/${chat.user.id}` : null,
    [chat?.user?.id, chat?.user?.profileImage]
  );

  const characterImage = useMemo(
    () => chat?.character?.id ? `/api/image/${chat.character.id}` : null,
    [chat?.character?.id]
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
    if (allMessages.length > 0 && !isChatLoading && !isMessagesLoading) {
      scrollToBottom();
    }
  }, [allMessages.length, isChatLoading, isMessagesLoading, scrollToBottom]);

  // Synchronize local settings with chat data
  useEffect(() => {
    if (chat) {
      // 1. Model priority: Chat-specific > Global User Settings > Default
      const chatSettings = (chat as any).chatSettings;
      if (chatSettings && chatSettings.model) {
        setSelectedModel(chatSettings.model);
      } else if (chat.user.userSettings?.chatSettings) {
        const globalModel = (chat.user.userSettings.chatSettings as any).model;
        if (globalModel) setSelectedModel(globalModel);
      }

      // 2. Persona priority: Chat-specific > User's Active Persona
      if (chat.personaId) {
        setSelectedPersonaId(chat.personaId);
      } else {
        setSelectedPersonaId(chat.user.personaUsed || null);
      }
    }
  }, [chat]);

  const pushToUndoStack = useCallback(() => {
    if (allMessages.length > 0) {
      setUndoStack((prev) => [...prev.slice(-9), allMessages]);
    }
  }, [allMessages]);

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const previousMessages = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      // This is a bit tricky with pages, we'll just put all previous into first page for now
      // or invalidate. Invalidation is safer for undo in infinite lists.
      return {
        ...old,
        pages: [{
          ...old.pages[0],
          data: [...previousMessages].reverse() // back to desc
        }, ...old.pages.slice(1)]
      };
    });
  }, [undoStack, chatId, queryClient]);

  const startStreaming = async (content: string, isRegenerate = false, isContinue = false) => {
    try {
      setStreamingMessage("");
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content, model: selectedModel, regenerate: isRegenerate, continue: isContinue }),
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
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices[0]?.delta?.content || "";
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

      await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setStreamingMessage(null);
      setIsSubmitting(false);
    }
  };

  const handleContinue = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await startStreaming("", false, true);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [isSubmitting, startStreaming]);

  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || !user?.id || isSubmitting) return;

    setIsSubmitting(true);

    const now = new Date();
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      fromUser: true,
      pinned: false,
      feedback: 'NONE',
      originalContent: null,
      chatId,
      createdAt: now,
      updatedAt: now,
    };

    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      const newPages = [...old.pages];
      newPages[0] = {
        ...newPages[0],
        data: [optimisticMessage, ...newPages[0].data]
      };
      return { ...old, pages: newPages };
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
      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return old;
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          data: newPages[0].data.filter((m: any) => m.id !== optimisticMessage.id)
        };
        return { ...old, pages: newPages };
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
    await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
  }, [chatId, queryClient, pushToUndoStack, confirm]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (isSubmitting || !chat) return;

    const msgIndex = allMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const lastUserMsg = allMessages[msgIndex - 1];
    if (!lastUserMsg || !lastUserMsg.fromUser) return;

    setIsSubmitting(true);

    try {
      await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((m: any) => m.id !== messageId)
          }))
        };
      });

      await startStreaming(lastUserMsg.content, true);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [isSubmitting, allMessages, chat, chatId, queryClient, startStreaming]);

  const handleUserRegenerate = useCallback(async (messageId: string) => {
    if (isSubmitting || !chat) return;
    const msgIndex = allMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;
    const userMsg = allMessages[msgIndex];
    if (!userMsg.fromUser) return;

    pushToUndoStack();
    const cascade = "?cascade=true";
    await fetch(`/api/messages/${messageId}${cascade}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    await startStreaming(userMsg.content, true);
  }, [isSubmitting, allMessages, chat, chatId, queryClient, pushToUndoStack, startStreaming]);

  const handleFeedback = useCallback(async (messageId: string, feedback: "LIKE" | "DISLIKE" | "NONE") => {
    try {
      // Optimistic update
      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((m: any) => m.id === messageId ? { ...m, feedback } : m)
          }))
        };
      });

      const res = await fetch(`/api/messages/${messageId}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (!res.ok) throw new Error();
      toast.success(feedback === "LIKE" ? "Response Liked" : feedback === "DISLIKE" ? "Response Disliked" : "Feedback cleared");
    } catch (err) {
      toast.error("Failed to submit feedback");
      await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    }
  }, [chatId, queryClient]);

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
        await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
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
  }, [chatId, queryClient, confirm]);

  const handleTogglePin = useCallback(async (messageId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((m: any) => m.id === messageId ? { ...m, pinned: !currentStatus } : m)
          }))
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
      await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
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
  }, [chatId, queryClient, confirm]);

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
      toast.error("Failed to update memory");
    }
  }, [chatId, queryClient]);

  // ───────────────────────────────
  // UI
  // ───────────────────────────────

  if (isChatLoading || isMessagesLoading)
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-cyan-900"
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

  if (chatError)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-red-400">
        Error: {(chatError as any).message}
      </div>
    );

  if (!chat)
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
                  {chat.character.name}
                  {chat.character.isNsfw && (
                    <span className="ml-3 px-2 py-0.5 text-[8px] font-black bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-md vertical-middle">NSFW</span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div
              className={`relative aspect-square w-full ${chat.character.isNsfw && settings?.blurNsfw && !tempUnblurModal ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (chat.character.isNsfw && settings?.blurNsfw && !tempUnblurModal) {
                  setTempUnblurModal(true);
                }
              }}
            >
              <Image
                src={characterImage || "/default-character.png"}
                alt={chat.character.name}
                fill
                className={`object-cover transition-all ${chat.character.isNsfw && settings?.blurNsfw && !tempUnblurModal ? 'blur-3xl scale-110 grayscale-[0.5]' : ''}`}
              />
              <AnimatePresence>
                {chat.character.isNsfw && settings?.blurNsfw && !tempUnblurModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                  >
                    <FiEye className="text-white/60 text-3xl mb-4" />
                    <p className="text-xs font-black text-white uppercase tracking-widest">Sensitive Visual</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Click to Unblur</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-slate-950 to-transparent" />
            </div>
            <div className="p-6">
              <p className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-relaxed line-clamp-4">
                {chat.character.bio}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl flex flex-col h-full bg-white/2 border-x border-t sm:border border-white/10 rounded-t-4xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      >
        {/* Header */}
        <ChatNavbar
          characterName={chat.character.name}
          characterImage={characterImage}
          isNsfw={chat.character.isNsfw}
          onProfileClick={handleProfileClick}
          onUndo={handleUndo}
          onClearHistory={handleClearHistory}
          onShowSettings={() => setShowSettingsModal(true)}
          onShowBrain={() => setShowBrainPanel(true)}
          hasUndo={undoStack.length > 0}
        />

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-8 pt-8 space-y-8 scrollbar-hide"
        >
          {/* Load More Sentinel */}
          <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] animate-pulse">
                Retrieving previous logs...
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {allMessages.map((msg) => (
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
                  isNsfw={chat.character.isNsfw}
                  isUserMessage={msg.fromUser}
                  isBlurEnabled={settings?.blurNsfw ?? true}
                  tempUnblur={tempUnblurMessages[msg.id] || false}
                  onUnblur={() => setTempUnblurMessages(prev => ({ ...prev, [msg.id]: true }))}
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
                  onFeedback={handleFeedback}
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
                  isNsfw={chat.character.isNsfw}
                  isBlurEnabled={settings?.blurNsfw ?? true}
                  tempUnblur={tempUnblurMessages["streaming"] || false}
                  onUnblur={() => setTempUnblurMessages(prev => ({ ...prev, ["streaming"]: true }))}
                  isUserMessage={false}
                  isOptimistic={true}
                  onProfileClick={handleProfileClick}
                  onEdit={() => { }}
                  onDelete={() => { }}
                  onRegenerate={() => { }}
                  onUserRegenerate={() => { }}
                  onTogglePin={() => { }}
                  onFeedback={() => { }}
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
        <ChatInput onSubmit={handleSubmit} isSubmitting={isSubmitting} onContinue={handleContinue} />
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
        memory={chat.memory}
        onClearMemory={handleClearMemory}
        onUpdateMemory={handleUpdateMemory}
        pinnedMessages={(allMessages || []).filter(m => m.pinned).map(m => ({ id: m.id, content: m.content, fromUser: m.fromUser }))}
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
    isNsfw,
    isBlurEnabled,
    tempUnblur,
    onUnblur,
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
    onFeedback,
  }: {
    message: Message;
    userImage: string | null;
    characterImage: string | null;
    isNsfw?: boolean;
    isBlurEnabled?: boolean;
    tempUnblur?: boolean;
    onUnblur?: () => void;
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
    onFeedback: (messageId: string, feedback: "LIKE" | "DISLIKE" | "NONE") => void;
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
            onClick={(e) => {
              const shouldBlur = isNsfw && isBlurEnabled && !tempUnblur;
              if (shouldBlur) {
                onUnblur?.();
              } else {
                onProfileClick(e);
              }
            }}
            className="relative hover:scale-105 transition-transform shrink-0 group/avatar"
          >
            <Image
              src={imageSrc}
              width={40}
              height={40}
              alt={altText}
              className={`w-10 h-10 rounded-full border border-white/10 object-cover transition-all ${isNsfw && isBlurEnabled && !tempUnblur ? 'blur-[6px] grayscale-[0.5]' : ''}`}
            />
            <AnimatePresence>
              {isNsfw && isBlurEnabled && !tempUnblur && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 rounded-full"
                >
                  <FiEye className="text-white/60 text-[10px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        ) : (
          <Image
            src={imageSrc}
            width={40}
            height={40}
            alt={altText}
            className="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0"
          />
        )}

        <div
          className={`flex-1 max-w-[80%] ${isUserMessage ? "text-right" : "text-left"}`}
        >
          {/* Message Content */}
          <div
            onClick={handleTap}
            className={`relative rounded-4xl px-6 py-4 transition-all duration-300 cursor-pointer ${isUserMessage
              ? "bg-linear-to-br from-cyan-300 via-primary to-cyan-400 text-slate-950 font-bold shadow-[0_10px_40px_rgba(34,211,238,0.25)] ring-1 ring-white/20"
              : "bg-white/5 border border-white/10 text-white/95 rounded-tl-md backdrop-blur-md shadow-xl"
              }`}
          >
            <div className={`absolute top-0 ${isUserMessage ? '-right-1' : '-left-1'} w-3 h-3 bg-inherit transform rotate-45`} />
            {isEditing ? (
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
              <button
                onClick={() => onEdit(message.id, message.content)}
                className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition-all text-white/60 hover:text-white"
                title="Edit"
              >
                <FaEdit size={12} />
              </button>

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

              {!isUserMessage && (
                <>
                  <button
                    onClick={() => onFeedback(message.id, message.feedback === "LIKE" ? "NONE" : "LIKE")}
                    className={`w-8 h-8 flex items-center justify-center border rounded-xl transition-all ${message.feedback === "LIKE"
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-white/10 border-white/10 text-white/60 hover:bg-green-500/10 hover:text-green-400"
                      }`}
                    title="Like response"
                  >
                    <FaThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => onFeedback(message.id, message.feedback === "DISLIKE" ? "NONE" : "DISLIKE")}
                    className={`w-8 h-8 flex items-center justify-center border rounded-xl transition-all ${message.feedback === "DISLIKE"
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-white/10 border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-400"
                      }`}
                    title="Dislike response"
                  >
                    <FaThumbsDown size={12} />
                  </button>
                </>
              )}
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
  onContinue,
  isSubmitting
}: {
  onSubmit: (content: string) => Promise<void>;
  onContinue: () => Promise<void>;
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
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-3xl sm:rounded-4xl px-6 sm:px-8 py-4 sm:py-5 pr-14 sm:pr-16 resize-none focus:border-primary/50 focus:bg-white/10 outline-none transition-[border-color,background-color] duration-300 text-sm leading-relaxed"
            style={{ height: '56px', minHeight: '56px', maxHeight: '200px', overflowY: 'auto' }}
          />
          <div className="absolute top-[18px] left-3 w-1 h-5 bg-primary/40 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
          disabled={isSubmitting}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl sm:rounded-4xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center hover:bg-indigo-600/30 transition-all disabled:opacity-30 group relative overflow-hidden"
          title="Continue Story (AI Narration)"
        >
          <FaMagic size={18} className="relative z-10" />
          <motion.div
            className="absolute inset-0 bg-indigo-500/10"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInternalSubmit}
          disabled={!message.trim() || isSubmitting}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl sm:rounded-4xl bg-primary text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-white/10 disabled:text-white/20"
        >
          <FaPaperPlane size={18} />
        </motion.button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default Chat;
