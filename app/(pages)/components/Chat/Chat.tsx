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
import TutorialModal from "../Modal/TutorialModal";

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
  user: User & { profileImage: UserProfileImage; userSettings: UserSettings | null; personas: (UserPersona & { image: any })[] };
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
  const [profileModalImageLoading, setProfileModalImageLoading] = useState(true);
  const [messageAvatarsLoading, setMessageAvatarsLoading] = useState<{ [key: string]: boolean }>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);


  const fetchSuggestions = async () => {
    if (isGeneratingSuggestions) return;
    setIsGeneratingSuggestions(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        toast.error("Failed to get ideas");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

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
    staleTime: 5000, // 5s buffer to prevent accidental refetch wipes during generation
  });

  const allMessages = useMemo(() => {
    if (!infiniteMessages) return [];
    // Collect and reverse only once
    const messages: Message[] = [];
    for (let i = infiniteMessages.pages.length - 1; i >= 0; i--) {
      const page = infiniteMessages.pages[i];
      for (let j = page.data.length - 1; j >= 0; j--) {
        messages.push(page.data[j]);
      }
    }
    return messages;
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

  // Safety watchdog for isSubmitting state
  useEffect(() => {
    if (!isSubmitting) return;
    const timer = setTimeout(() => {
      console.warn("Safety trigger: Clearing stuck processing state");
      setIsSubmitting(false);
      setStreamingMessage(null);
    }, 15000); // 15s global fail-safe
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  // Auto-scroll tracking
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If user is within 150px of bottom, enable auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [allMessages.length, streamingMessage, shouldAutoScroll, scrollToBottom]);

  const userImage = useMemo(() => {
    if (!chat) return null;

    // 1. If chat.personaId is set, find that persona in user.personas
    if (chat.personaId) {
      const activePersona = chat.user.personas?.find(p => p.id === chat.personaId);
      if (activePersona?.image) {
        return `/api/persona/image/${activePersona.id}`;
      }
    }

    // 2. Fallback to user profile image
    return chat.user.profileImage ? `/api/users/picture/${chat.user.id}` : null;
  }, [chat]);

  const characterImage = useMemo(
    () => chat?.character?.id ? `/api/image/${chat.character.id}` : null,
    [chat?.character?.id]
  );

  const fetchWithTimeout = async (url: string, options: RequestInit & { timeout?: number } = {}) => {
    const { timeout = 10000, ...rest } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...rest, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const modalWidth = 400;
    let x = rect.left - 100;

    // Safety: prevent right overflow
    if (typeof window !== "undefined") {
      if (x + modalWidth > window.innerWidth - 20) {
        x = window.innerWidth - modalWidth - 20;
      }
      if (x < 20) x = 20;
    }

    setModalPosition({ x, y: rect.top - 50 });
    setShowProfileModal(true);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!modalRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setModalPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const hasScrolledToBottom = useRef(false);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (allMessages.length > 0 && !isChatLoading && !isMessagesLoading && !hasScrolledToBottom.current) {
      scrollToBottom();
      hasScrolledToBottom.current = true;
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
      const controller = new AbortController();
      const totalTimeout = setTimeout(() => controller.abort(), 30000); // 30s hard cap for connection

      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content, model: selectedModel, regenerate: isRegenerate, continue: isContinue }),
        signal: controller.signal
      });

      clearTimeout(totalTimeout);

      if (!aiRes.ok || !aiRes.body) throw new Error("AI streaming failed");

      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let isDone = false;
      let buffer = "";
      let lastActivity = Date.now();

      // BRUTAL WATCHDOG: Force abort if no data received for 10 seconds
      const watchdog = setInterval(() => {
        if (Date.now() - lastActivity > 10000) {
          console.warn("Watchdog: Stream inactivity detected. Aborting.");
          controller.abort();
          clearInterval(watchdog);
        }
      }, 2000);

      try {
        while (!isDone) {
          const { done, value } = await reader.read();
          if (done) {
            isDone = true;
            break;
          }

          lastActivity = Date.now();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

            const dataStr = trimmedLine.slice(6).trim();
            if (dataStr === "[DONE]") {
              isDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices[0]?.delta?.content || "";
              if (delta) {
                fullContent += delta;
                setStreamingMessage(fullContent);
                scrollToBottom();
              }
            } catch (e) { }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') throw err;
      } finally {
        clearInterval(watchdog);
      }

      // Buffer cleanup
      if (buffer.startsWith("data: ")) {
        const dataStr = buffer.slice(6).trim();
        if (dataStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices[0]?.delta?.content || "";
            if (delta) fullContent += delta;
          } catch (e) { }
        }
      }

      // CACHE OPTIMISTIC UPDATE: Bridge the gap before clearing stream
      const aiOptimisticId = `ai-temp-${Date.now()}`;
      const aiOptimisticMessage: Message = {
        id: aiOptimisticId,
        content: fullContent,
        fromUser: false,
        pinned: false,
        feedback: 'NONE',
        originalContent: null,
        chatId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return old;
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          data: [aiOptimisticMessage, ...newPages[0].data]
        };
        return { ...old, pages: newPages };
      });

      // RESET UI IMMEDIATELY after cache is primed
      setStreamingMessage(null);
      setIsSubmitting(false);
      setTimeout(() => scrollToBottom(), 100);

      // Background Save (Non-blocking but Surgical)
      (async () => {
        try {
          const res = await fetch("/api/messages/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, content: fullContent }),
          });

          if (res.ok) {
            const { data: savedMsg } = await res.json();

            // SURGICAL SWAP: Replace temp message with real one in cache
            queryClient.setQueryData(["messages", chatId], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: any, i: number) => {
                  if (i !== 0) return page;
                  return {
                    ...page,
                    data: page.data.map((m: any) =>
                      m.id === aiOptimisticId ? { ...savedMsg, id: savedMsg.id } : m
                    )
                  };
                })
              };
            });

            // Background summarization
            fetch("/api/background", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId })
            }).catch(() => { });
          }
        } catch (e) {
          console.error("Failed to save AI message surgically:", e);
          // Rollback optimistic message if save failed
          queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.filter((m: any) => m.id !== aiOptimisticId)
              }))
            };
          });
          toast.error("Failed to save response to history");
        }
      })();
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
    setShouldAutoScroll(true);
    try {
      await startStreaming("", false, true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setStreamingMessage(null);
    }
  }, [isSubmitting, startStreaming]);

  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || !user?.id || isSubmitting) return;

    // Slash Command Interception
    const trimmed = content.trim();
    if (trimmed.startsWith("/")) {
      const parts = trimmed.split(" ");
      const command = parts[0].toLowerCase();

      if (command === "/help") {
        setShowTutorial(true);
        return;
      }

      if (command === "/clear") {
        handleClearHistory();
        return;
      }

      if (command === "/reset") {
        handleClearMemory();
        return;
      }
    }

    setIsSubmitting(true);

    hasScrolledToBottom.current = false; // Reset scroll lock to allow auto-scroll for new interaction

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
      // 1. Save user message with timeout
      const saveRes = await fetchWithTimeout("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content: content.trim(),
          userId: user.id,
          fromUser: true,
        }),
        timeout: 10000
      });

      if (!saveRes.ok) throw new Error("Failed to send message");
      const { data: savedUserMsg } = await saveRes.json();

      // SURGICAL SWAP: Replace temp user message with real one in cache
      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) => {
            if (i !== 0) return page;
            return {
              ...page,
              data: page.data.map((m: any) => m.id === optimisticMessage.id ? savedUserMsg : m)
            };
          })
        };
      });

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
      throw err;
    } finally {
      setIsSubmitting(false);
      setStreamingMessage(null);
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

    // Optimistic Update
    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.map((m: any) => m.id === messageId ? { ...m, content: editContent } : m)
        }))
      };
    });

    try {
      await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      setEditingMessageId(null);
      setEditContent("");
      // Settle delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }, 1000);
    } catch (err) {
      toast.error("Failed to save edit");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    }
  }, [editContent, chatId, queryClient]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditContent("");
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    const targetMsg = allMessages.find(m => m.id === messageId);
    if (!targetMsg) return;

    if (!(await confirm({
      title: "Delete Messages",
      message: "Are you sure you want to delete this message and all subsequent messages? This will permanently rewind the simulation.",
      confirmLabel: "Delete All",
      variant: "danger"
    }))) return;

    pushToUndoStack();

    // Cascading Optimistic Delete
    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((m: any) => new Date(m.createdAt) < new Date(targetMsg.createdAt))
        }))
      };
    });

    try {
      await fetchWithTimeout(`/api/messages/${messageId}`, { method: "DELETE" });

      // Settle delay for invalidation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }, 1000);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete message");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    }
  }, [chatId, queryClient, pushToUndoStack, confirm, allMessages]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (isSubmitting || !chat) return;

    const msgIndex = allMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = allMessages[msgIndex];
    const lastUserMsg = allMessages[msgIndex - 1];
    const hasUserMessage = lastUserMsg && lastUserMsg.fromUser;

    setIsSubmitting(true);
    setShouldAutoScroll(true);

    // Cascading Optimistic Delete
    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((m: any) => new Date(m.createdAt) < new Date(targetMsg.createdAt))
        }))
      };
    });

    try {
      await fetchWithTimeout(`/api/messages/${messageId}`, { method: "DELETE" });

      if (hasUserMessage) {
        await startStreaming(lastUserMsg.content, true);
      } else {
        await startStreaming("", false, true);
      }
    } catch (err) {
      console.error("Regenerate failed:", err);
      toast.error("Failed to regenerate");
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }, 1000);
    } finally {
      setIsSubmitting(false);
      setStreamingMessage(null);
    }
  }, [isSubmitting, allMessages, chat, chatId, queryClient, startStreaming]);

  const handleUserRegenerate = useCallback(async (messageId: string) => {
    if (isSubmitting || !chat) return;
    const msgIndex = allMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = allMessages[msgIndex];
    if (!targetMsg.fromUser) return;

    pushToUndoStack();
    setIsSubmitting(true);
    setShouldAutoScroll(true);

    // Cascading Optimistic Delete
    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((m: any) => new Date(m.createdAt) < new Date(targetMsg.createdAt))
        }))
      };
    });

    try {
      await fetchWithTimeout(`/api/messages/${messageId}`, { method: "DELETE" });

      // Settle delay for invalidation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }, 1000);

      await startStreaming(targetMsg.content, true);
    } catch (err) {
      console.error("User regenerate failed:", err);
      toast.error("Failed to redo message");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    } finally {
      setIsSubmitting(false);
      setStreamingMessage(null);
    }
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
      title: "Reset Chat Conversation",
      message: "Are you sure you want to reset this conversation? All existing messages will be cleared and the character will return to its initial greeting.",
      confirmLabel: "Reset Conversation",
      variant: "danger"
    }))) return;

    setIsSubmitting(true);

    // Optimistic Clear
    queryClient.setQueryData(["messages", chatId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any, i: number) => ({
          ...page,
          data: i === 0 ? [] : [] // Clear everything. Intro will be re-seeded by API and invalidation.
        }))
      };
    });

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("History cleared");
        await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      } else {
        toast.error("Failed to clear history");
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
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

    // Optimistic Reset
    queryClient.setQueryData(["chat", chatId], (old: any) => {
      if (!old) return old;
      return { ...old, data: { ...old.data, memory: null } };
    });

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: null }),
      });
      if (res.ok) {
        toast.success("AI brain reset successfully");
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Failed to reset memory");
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    }
  }, [chatId, queryClient, confirm]);

  const handleUpdateChatSettings = useCallback(async (model: string, personaId: string | null) => {
    setSelectedModel(model);
    setSelectedPersonaId(personaId);

    // Optimistic Update
    queryClient.setQueryData(["chat", chatId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          chatSettings: { ...old.data.chatSettings, model },
          personaId: personaId
        }
      };
    });

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
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    }
  }, [chatId, queryClient]);

  const handleUpdateMemory = useCallback(async (newMemory: string) => {
    // Optimistic Update
    queryClient.setQueryData(["chat", chatId], (old: any) => {
      if (!old) return old;
      return { ...old, data: { ...old.data, memory: newMemory } };
    });

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: newMemory }),
      });
      if (res.ok) {
        toast.success("AI brain updated");
        await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Failed to update memory");
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    }
  }, [chatId, queryClient]);

  // ───────────────────────────────
  // UI
  // ───────────────────────────────

  if (isChatLoading || isMessagesLoading)
    return <LoadingScreen />;

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
            onTouchStart={handleTouchStart}
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
              {profileModalImageLoading && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-white/40 rounded-full animate-spin" />
                </div>
              )}
              <Image
                src={characterImage || "/default-character.png"}
                alt={chat.character.name}
                fill
                className={`object-cover transition-all duration-500 ${chat.character.isNsfw && settings?.blurNsfw && !tempUnblurModal ? 'blur-3xl scale-110 grayscale-[0.5]' : ''} ${profileModalImageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setProfileModalImageLoading(false)}
                onError={() => setProfileModalImageLoading(false)}
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
        className="relative w-full max-w-6xl flex flex-col h-full bg-white/2 border-x border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm"
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
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 sm:px-12 pt-6 sm:pt-10 space-y-4 sm:space-y-6 scrollbar-hide"
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
                  isOptimistic={msg.id.startsWith("temp-") || msg.id.startsWith("ai-temp-")}
                  onProfileClick={handleProfileClick}
                  onEdit={handleEdit}
                  onDelete={(id) => handleDelete(id)}
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
              className="group flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl w-fit"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Processing response</span>

              {/* Emergency Stop Button */}
              <button
                onClick={() => {
                  setIsSubmitting(false);
                  setStreamingMessage(null);
                  toast.success("Generation stopped");
                }}
                className="ml-1 p-1 hover:bg-white/10 rounded-lg text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Stop generation"
              >
                <FaTimes size={10} />
              </button>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onContinue={handleContinue}
          suggestions={suggestions}
          isGeneratingSuggestions={isGeneratingSuggestions}
          onGetIdeas={fetchSuggestions}
          onSelectSuggestion={(s) => {
            setSuggestions([]); // Clear suggestions once one is selected
          }}
        />
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
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
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
    const [avatarLoading, setAvatarLoading] = useState(true);
    const imageSrc = isUserMessage
      ? userImage || "/default-user.png"
      : characterImage || "/default-character.png";

    const altText = isUserMessage ? "User" : "Character";

    const handleContextMenu = (e: React.MouseEvent) => {
      if (isOptimistic) return;
      e.preventDefault();
      setShowActions(true);
    };

    const handleTap = () => {
      setShowActions((prev) => !prev);
    };

    return (
      <div
        className={`group flex items-start gap-2.5 ${isUserMessage ? "flex-row-reverse" : "flex-row"
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
            className="relative hover:scale-105 transition-transform shrink-0 group/avatar w-8 h-8 sm:w-9 sm:h-9"
          >
            {avatarLoading && (
              <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center rounded-full z-10">
                <div className="w-3 h-3 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={imageSrc}
              width={32}
              height={32}
              alt={altText}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 object-cover transition-all duration-300 ${isNsfw && isBlurEnabled && !tempUnblur ? 'blur-[6px] grayscale-[0.5]' : ''} ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setAvatarLoading(false)}
              onError={() => setAvatarLoading(false)}
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
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            {avatarLoading && (
              <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center rounded-full z-10">
                <div className="w-3 h-3 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={imageSrc}
              width={32}
              height={32}
              alt={altText}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 object-cover transition-opacity duration-300 ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setAvatarLoading(false)}
              onError={() => setAvatarLoading(false)}
            />
          </div>
        )}

        <div
          className={`flex-1 max-w-[80%] ${isUserMessage ? "text-right" : "text-left"}`}
        >
          {/* Message Content */}
          <div
            onClick={handleTap}
            className={`relative rounded-3xl sm:rounded-4xl px-5 py-3.5 sm:px-6 sm:py-4 transition-all duration-300 cursor-pointer ${isUserMessage
              ? "bg-white/10 border border-white/20 text-white font-bold shadow-xl rounded-tr-sm"
              : "bg-white/5 border border-white/10 text-white/95 rounded-tl-sm backdrop-blur-md shadow-xl"
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
              className={`flex gap-1 mt-2 sm:mt-2.5 transition-all duration-200 ${showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
                } ${isUserMessage ? "justify-end" : "justify-start"}`}
            >
              <button
                onClick={() => onEdit(message.id, message.content)}
                className="w-7 h-7 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-all text-white/30 hover:text-white"
                title="Edit"
              >
                <FaEdit size={10} />
              </button>

              <button
                onClick={() => onDelete(message.id)}
                className="w-7 h-7 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all text-white/30 hover:text-red-400"
                title="Delete"
              >
                <FaTrash size={10} />
              </button>

              {!isUserMessage && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="w-7 h-7 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg hover:bg-primary/20 hover:border-primary/30 transition-all text-white/30 hover:text-primary"
                  title="Regenerate"
                >
                  <FaRedo size={10} />
                </button>
              )}

              {isUserMessage && (
                <button
                  onClick={() => onUserRegenerate(message.id)}
                  className="w-7 h-7 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg hover:bg-purple-500/20 hover:border-purple-500/30 transition-all text-white/30 hover:text-purple-400"
                  title="Edit and resend"
                >
                  <FaRedo size={10} />
                </button>
              )}

              <button
                onClick={() => onTogglePin(message.id, !!message.pinned)}
                className={`w-7 h-7 flex items-center justify-center border rounded-lg transition-all ${message.pinned
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/5 border-white/5 text-white/30 hover:bg-primary/10 hover:text-primary"
                  }`}
                title={message.pinned ? "Unpin message" : "Pin message"}
              >
                <FaThumbtack size={10} className={message.pinned ? "" : "-rotate-45"} />
              </button>

              {!isUserMessage && (
                <>
                  <button
                    onClick={() => onFeedback(message.id, message.feedback === "LIKE" ? "NONE" : "LIKE")}
                    className={`w-7 h-7 flex items-center justify-center border rounded-lg transition-all ${message.feedback === "LIKE"
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-white/5 border-white/5 text-white/30 hover:bg-green-500/10 hover:text-green-400"
                      }`}
                    title="Like response"
                  >
                    <FaThumbsUp size={10} />
                  </button>
                  <button
                    onClick={() => onFeedback(message.id, message.feedback === "DISLIKE" ? "NONE" : "DISLIKE")}
                    className={`w-7 h-7 flex items-center justify-center border rounded-lg transition-all ${message.feedback === "DISLIKE"
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-white/5 border-white/5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                      }`}
                    title="Dislike response"
                  >
                    <FaThumbsDown size={10} />
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
  isSubmitting,
  suggestions,
  isGeneratingSuggestions,
  onGetIdeas,
  onSelectSuggestion
}: {
  onSubmit: (content: string) => Promise<void>;
  onContinue: () => Promise<void>;
  isSubmitting: boolean;
  suggestions: string[];
  isGeneratingSuggestions: boolean;
  onGetIdeas: () => void;
  onSelectSuggestion: (s: string) => void;
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
    <div className="p-3 sm:p-6 border-t border-white/5 bg-slate-950/40 backdrop-blur-3xl pb-3 sm:pb-0">
      <div className="max-w-4xl mx-auto">
        {/* Suggestion Chips */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-nowrap gap-2 mb-4 overflow-x-auto hide-scrollbar scroll-smooth"
            >
              {suggestions.map((s, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMessage(s);
                    onSelectSuggestion(s);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-[10px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap shrink-0"
                >
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Tool Row (Hidden on Desktop) */}
        <div className="flex sm:hidden items-center gap-2 mb-2.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onGetIdeas}
            disabled={isSubmitting || isGeneratingSuggestions}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30"
          >
            <FaBrain size={12} className={isGeneratingSuggestions ? 'animate-pulse' : ''} />
            Ideas
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30"
          >
            <FaMagic size={12} />
            Continue
          </motion.button>
        </div>

        <div className="relative flex items-end gap-2 sm:gap-3">
          <div className="relative flex-1 group">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              rows={1}
              placeholder="Talk to character..."
              disabled={isSubmitting}
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl sm:rounded-4xl px-5 sm:px-7 py-3 sm:py-4.5 pr-5 sm:pr-6 resize-none focus:border-primary/50 focus:bg-white/10 outline-none transition-all duration-300 text-sm sm:text-[15px] leading-relaxed"
              style={{ height: '48px', minHeight: '48px', maxHeight: '200px', overflowY: 'auto' }}
            />
          </div>

          {/* Desktop Tool Buttons (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetIdeas}
              disabled={isSubmitting || isGeneratingSuggestions}
              className="w-13 h-13 rounded-4xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center hover:bg-purple-600/30 transition-all disabled:opacity-30 group relative overflow-hidden"
              title="Get Roleplay Ideas"
            >
              <FaBrain size={18} className={isGeneratingSuggestions ? 'animate-pulse' : ''} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              disabled={isSubmitting}
              className="w-13 h-13 rounded-4xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center hover:bg-indigo-600/30 transition-all disabled:opacity-30 group relative overflow-hidden"
              title="Continue Story (AI Narration)"
            >
              <FaMagic size={18} />
            </motion.button>
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInternalSubmit}
            disabled={!message.trim() || isSubmitting}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-4xl bg-primary text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-white/10 disabled:text-white/20 shrink-0"
          >
            <FaPaperPlane size={14} className="sm:scale-125" />
          </motion.button>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

const LoadingScreen = () => {
  const statusMessages = [
    "Initializing neural links...",
    "Retrieving conversation history...",
    "Synchronizing persona data...",
    "Establishing secure connection...",
    "Processing AI context..."
  ];
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [statusMessages.length]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-[#020617] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full"
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* AI Core Pulse Animation */}
        <div className="relative w-24 h-24 mb-12">
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-primary/20 border border-primary/30"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-4 rounded-full bg-linear-to-br from-primary via-cyan-400 to-purple-500 shadow-[0_0_40px_rgba(34,211,238,0.5)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FaBrain size={32} className="text-slate-900" />
          </div>

          {/* Orbiting Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10px] border-2 border-dashed border-white/10 rounded-full"
          />
        </div>

        {/* Status Text with Scanning Effect */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative overflow-hidden px-4 py-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="block text-white text-sm font-black uppercase tracking-[0.3em] font-mono italic"
              >
                {statusMessages[statusIndex]}
              </motion.span>
            </AnimatePresence>
            {/* Scan Line */}
            <motion.div
              animate={{ left: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent skew-x-12"
            />
          </div>

          {/* Animated Progress Dots */}
          <div className="flex gap-2.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  backgroundColor: ["rgba(255,255,255,0.1)", "#22d3ee", "rgba(255,255,255,0.1)"]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-1.5 h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Branded Versioning */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="absolute -bottom-32 text-[9px] font-black text-white uppercase tracking-[0.5em] italic"
        >
          Artificial Intelligence Interface • v2.0
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Chat;

