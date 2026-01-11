"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FaTimes } from "react-icons/fa";
import ChatNavbar from "./ChatNavbar";
import { useSettings } from "@/app/hooks/useSettings";
import { FiEye } from "react-icons/fi";
import dynamic from "next/dynamic";
const ChatSettingsModal = dynamic(() => import("./ChatSettingsModal"), { ssr: false });
const BrainPanel = dynamic(() => import("./BrainPanel"), { ssr: false });
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(pages)/providers/AuthProvider";
import { AnimatePresence, motion } from "motion/react";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import Image from "next/image";

// New Hooks and Components
import { useChatData } from "@/app/hooks/chat/useChatData";
import { useChatStreaming } from "@/app/hooks/chat/useChatStreaming";
import { useChatActions } from "@/app/hooks/chat/useChatActions";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { LoadingScreen } from "./LoadingScreen";
import TutorialModal from "../Modal/TutorialModal";

const Chat = ({ chatId }: { chatId: string }) => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { settings } = useSettings();

  // Shared UI/Settings State
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-v3.2");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBrainPanel, setShowBrainPanel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tempUnblurMessages, setTempUnblurMessages] = useState<{ [key: string]: boolean }>({});
  const [tempUnblurModal, setTempUnblurModal] = useState(false);
  const [profileModalImageLoading, setProfileModalImageLoading] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);

  // 1. Data & Scroll management
  const {
    chat, isChatLoading, chatError, allMessages, isMessagesLoading,
    fetchNextPage, hasNextPage, isFetchingNextPage, suggestions,
    isGeneratingSuggestions, fetchSuggestions, scrollContainerRef,
    messagesEndRef, loadMoreRef, shouldAutoScroll, handleScroll, scrollToBottom
  } = useChatData(chatId);

  // 2. Chat Streaming logic
  const {
    handleSubmit,
    handleContinueStory,
    startStreaming,
    isSubmitting,
    streamingMessage,
    setIsSubmitting,
    setStreamingMessage,
  } = useChatStreaming({
    chatId,
    user,
    selectedModel,
    queryClient,
    scrollToBottom,
    onShowTutorial: () => setShowTutorial(true),
    onClearHistory: () => handleClearHistory(),
    onClearMemory: () => handleClearMemory(),
  });

  // 3. Mutation Actions
  const {
    editingMessageId,
    editContent,
    undoStack,
    handleUndo,
    handleEdit,
    handleEditContentChange,
    handleSaveEdit,
    handleCancelEdit,
    handleDelete,
    handleRegenerate,
    handleUserRegenerate,
    handleFeedback,
    handleClearHistory,
    handleTogglePin,
    handleClearMemory,
    handleUpdateChatSettings,
    handleUpdateMemory,
  } = useChatActions({
    chatId,
    queryClient,
    confirm,
    allMessages,
    startStreaming,
    setIsSubmitting,
    setStreamingMessage,
    setShouldAutoScroll: () => { }, // Managed internally by useChatData handling scroll events
    setSelectedModel,
    setSelectedPersonaId,
  });

  // Sync settings when chat metadata loads
  useEffect(() => {
    const chatSettings = chat?.chatSettings as any;
    if (chatSettings?.model) setSelectedModel(chatSettings.model);
    if (chat?.personaId) setSelectedPersonaId(chat.personaId);
  }, [chat]);

  // Profile Modal Logic
  const handleProfileClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 320);
    const y = Math.min(rect.top - 100, window.innerHeight - 400);
    setModalPosition({ x, y: Math.max(20, y) });
    setProfileModalImageLoading(true);
    setShowProfileModal(true);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (modalRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
    }
  };

  useEffect(() => {
    const handleDrag = (e: MouseEvent) => {
      if (isDragging) {
        setModalPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleDragEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset, modalPosition]);

  if (isChatLoading || isMessagesLoading) return <LoadingScreen />;
  if (chatError) return <div className="fixed inset-0 flex items-center justify-center bg-black text-red-400">Error: {(chatError as any).message}</div>;
  if (!chat) return <div className="fixed inset-0 flex items-center justify-center bg-black text-gray-400">No chat data found.</div>;

  const characterImage = chat.character?.photo ? `/api/image/${chat.character.id}` : null;
  const activePersona = chat.user?.personas?.find(p => p.id === (selectedPersonaId || chat.personaId));
  /*
   * User Image Logic:
   * 1. Active Persona Image (highest priority)
   * 2. Chat User Profile Image (from chat data)
   * 3. Session User Image (fallback if chat data is incomplete but user is same)
   */
  const userImage = activePersona?.image
    ? `/api/persona/image/${activePersona.id}`
    : (chat.user?.profileImage ? `/api/users/picture/${chat.user.id}` : (user?.id === chat.userId ? (user?.image || null) : null));

  const userName = activePersona?.name || chat.user?.username || (user?.id === chat.userId ? (user?.name || (user as any)?.username) : null);

  const pinnedMessages = allMessages.filter(m => m.pinned);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#020617] text-white selection:bg-primary/30 scroll-smooth">
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

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 pt-6 sm:pt-10 space-y-6 sm:space-y-8 pb-32 sm:pb-48">
          <div ref={loadMoreRef} className="h-4 w-full flex items-center justify-center">
            {isFetchingNextPage && <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" />}
          </div>

          {allMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              userImage={userImage}
              userName={userName}
              characterImage={characterImage}
              isNsfw={chat.character.isNsfw}
              isBlurEnabled={settings.blurNsfw}
              tempUnblur={tempUnblurMessages[msg.id]}
              onUnblur={() => setTempUnblurMessages(prev => ({ ...prev, [msg.id]: true }))}
              isUserMessage={msg.fromUser}
              onProfileClick={handleProfileClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
          ))}

          {(streamingMessage || isSubmitting) && (
            <MessageBubble
              message={{
                id: "streaming",
                content: streamingMessage || "",
                fromUser: false,
                pinned: false,
                feedback: 'NONE',
                originalContent: null,
                chatId,
                createdAt: new Date(),
                updatedAt: new Date()
              } as any}
              userImage={null}
              characterImage={characterImage}
              isNsfw={chat.character.isNsfw}
              isBlurEnabled={settings.blurNsfw}
              tempUnblur={tempUnblurMessages["streaming"]}
              onUnblur={() => setTempUnblurMessages(prev => ({ ...prev, streaming: true }))}
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
          )}
          <div ref={messagesEndRef} className="h-1 w-full shrink-0" />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30">
          <ChatInput
            onSubmit={handleSubmit}
            onContinue={handleContinueStory}
            isSubmitting={isSubmitting}
            suggestions={suggestions}
            isGeneratingSuggestions={isGeneratingSuggestions}
            onGetIdeas={fetchSuggestions}
            onSelectSuggestion={(s) => {
              fetchSuggestions();
              handleSubmit(s);
            }}
          />
        </div>

        <AnimatePresence>
          {showProfileModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowProfileModal(false)}
            >
              <motion.div
                ref={modalRef}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  x: modalPosition.x,
                  top: modalPosition.y,
                }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="absolute w-full max-w-sm bg-slate-900/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="relative h-64 w-full bg-slate-800 cursor-move group"
                  onMouseDown={handleDragStart}
                >
                  {profileModalImageLoading && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                    </div>
                  )}
                  <Image
                    src={characterImage || "/default.jpg"}
                    fill
                    alt={chat.character.name}
                    className={`object-cover transition-all duration-500 ${chat.character.isNsfw && settings.blurNsfw && !tempUnblurModal ? 'blur-2xl grayscale scale-110' : ''} ${profileModalImageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setProfileModalImageLoading(false)}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all z-20"
                  >
                    <FaTimes />
                  </button>

                  {chat.character.isNsfw && settings.blurNsfw && !tempUnblurModal && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                      <FiEye className="text-white/40 text-4xl mb-4" />
                      <button
                        onClick={() => setTempUnblurModal(true)}
                        className="px-6 py-2.5 bg-white text-slate-900 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-colors"
                      >
                        Reveal Identity
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-1">{chat.character.name}</h2>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">AI Persona • Neural Network</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Core Narrative</span>
                    </div>
                    <p className="text-sm font-medium text-white/50 leading-relaxed italic line-clamp-4">
                      "{chat.character.bio}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettingsModal && (
            <ChatSettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              onSave={handleUpdateChatSettings}
              currentModel={selectedModel}
              currentPersonaId={selectedPersonaId}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBrainPanel && (
            <BrainPanel
              isOpen={showBrainPanel}
              onClose={() => setShowBrainPanel(false)}
              memory={chat.memory || ""}
              onUpdateMemory={handleUpdateMemory}
              onClearMemory={() => { handleClearMemory(); }}
              pinnedMessages={pinnedMessages}
              onUnpin={(id) => handleTogglePin(id, true)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showTutorial && (
            <TutorialModal
              isOpen={showTutorial}
              onClose={() => setShowTutorial(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Chat;
