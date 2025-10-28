"use client";

import React, {
  useContext,
  useMemo,
  useCallback,
  useState,
  useRef,
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
    setModalPosition({
      x: rect.left - 100,
      y: rect.top - 50
    });
    setShowProfileModal(true);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current) return;
    
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setModalPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || !user?.id || isSubmitting) return;

    const userMessageContent = message.trim();
    setMessage("");
    setIsSubmitting(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: userMessageContent,
      fromUser: true,
      chatId: chatId,
    };

    queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        messages: [...oldData.messages, optimisticMessage],
      };
    });

    scrollToBottom();

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content: userMessageContent,
          userId: user.id,
          fromUser: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      
    } catch (error) {
      console.error("Message submission error:", error);
      queryClient.setQueryData<ChatData>(["chat", chatId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: oldData.messages.filter(msg => msg.id !== optimisticMessage.id),
        };
      });
      setMessage(userMessageContent);
    } finally {
      setIsSubmitting(false);
    }
  }, [message, user?.id, chatId, isSubmitting, queryClient, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleEdit = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  }, []);

  const handleSaveEdit = useCallback(async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to update message");
      
      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Edit message error:", error);
    }
  }, [editContent, chatId, queryClient]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditContent("");
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete message");
      
      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    } catch (error) {
      console.error("Delete message error:", error);
    }
  }, [chatId, queryClient]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    try {
      const response = await fetch("/api/messages/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          chatId,
        }),
      });

      if (!response.ok) throw new Error("Failed to regenerate message");
      
      await queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    } catch (error) {
      console.error("Regenerate message error:", error);
    }
  }, [chatId, queryClient]);

  if (isLoading)
    return (
      <div className="fixed inset-0 pt-24 p-4 flex justify-center bg-var-color-primary-background">
        <div className="animate-pulse text-var-color-secondary-text">Loading conversation...</div>
      </div>
    );
  if (error)
    return (
      <div className="fixed inset-0 pt-24 p-4 flex justify-center bg-var-color-primary-background">
        <div className="text-var-color-error">Error: {error.message}</div>
      </div>
    );
  if (!data)
    return (
      <div className="fixed inset-0 pt-24 p-4 flex justify-center bg-var-color-primary-background">
        <div className="text-var-color-secondary-text">No chat data found</div>
      </div>
    );

  return (
    <div className="fixed inset-0 pt-24 flex justify-center h-full w-full bg-var-color-primary-background">
      {/* Profile Modal */}
      {showProfileModal && characterImage && (
        <div
          ref={modalRef}
          className={`fixed z-50 bg-var-color-for-dark-surface border-2 border-var-color-primary-button rounded-2xl shadow-2xl overflow-hidden ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            width: 'clamp(300px, 40vw, 500px)',
            height: 'clamp(400px, 50vh, 600px)',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-var-color-borders bg-var-color-primary-background">
            <div>
              <h3 className="text-lg font-semibold text-var-color-primary-text">
                {data.character.name}
              </h3>
              <p className="text-sm text-var-color-secondary-text">AI Character</p>
            </div>
            <button
              onClick={() => setShowProfileModal(false)}
              className="p-2 hover:bg-var-color-borders rounded-lg transition-colors"
            >
              <FaTimes className="text-var-color-secondary-text" />
            </button>
          </div>

          {/* Image */}
          <div className="relative w-full h-3/4">
            <Image
              src={characterImage}
              fill
              className="object-cover"
              alt={data.character.name}
              priority
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-var-color-borders">
            <p className="text-var-color-secondary-text text-sm text-center">
              Drag to move • Click X to close
            </p>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col h-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-var-color-borders bg-var-color-for-dark-surface">
          <button
            onClick={handleProfileClick}
            className="relative group hover:scale-105 transition-transform"
          >
            <Image
              src={characterImage || "/default-character.png"}
              width={48}
              height={48}
              alt={data.character.name}
              className="w-12 h-12 rounded-full border-2 border-var-color-borders object-cover"
            />
            <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-var-color-primary-button transition-colors" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-var-color-primary-text">
              {data.character.name}
            </h2>
            <p className="text-sm text-var-color-secondary-text">
              Click profile to view larger image
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Intro Message */}
          <div className="text-center p-6 bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl mb-4">
            <p className="text-var-color-primary-text text-lg italic">
              {data.character.introMessage}
            </p>
          </div>

          {/* Messages */}
          {data.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              userImage={userImage}
              characterImage={characterImage}
              isUserMessage={message.fromUser}
              isOptimistic={message.id.startsWith('temp-')}
              onProfileClick={handleProfileClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
              isEditing={editingMessageId === message.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
          ))}

          {/* Typing Indicator */}
          {isSubmitting && (
            <div className="flex items-start gap-3 p-4">
              <Image
                src={characterImage || "/default-character.png"}
                width={40}
                height={40}
                alt={data.character.name}
                className="w-10 h-10 rounded-full border border-var-color-borders object-cover flex-shrink-0"
              />
              <div className="flex items-center gap-1 bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-var-color-primary-button rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-var-color-primary-button rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-var-color-primary-button rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-var-color-secondary-text text-sm ml-2">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-var-color-borders bg-var-color-for-dark-surface">
          <div className="relative">
            <textarea
              className="w-full bg-var-color-primary-background border border-var-color-borders rounded-2xl p-4 pr-12 text-var-color-primary-text placeholder-var-color-disabled resize-none focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent transition-all"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Type your message... (Press Enter to send)"
              rows={3}
            />
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
              className="absolute right-4 bottom-4 p-2 bg-var-color-primary-button text-white rounded-full hover:bg-var-color-primary-hover-state disabled:bg-var-color-disabled disabled:cursor-not-allowed transition-colors shadow-lg"
              aria-label="Send message"
            >
              <FaPaperPlane size={16} />
            </button>
          </div>
        </div>
      </div>
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
        } ${isOptimistic ? 'opacity-70' : ''}`}
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
        
        <div className={`flex-1 max-w-[80%] ${
          isUserMessage ? "text-right" : "text-left"
        }`}>
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
                  <div className="text-xs opacity-70 mt-2">
                    Sending...
                  </div>
                )}
              </>
            )}
          </div>

          {/* Message Actions */}
          {!isOptimistic && !isEditing && (
            <div className={`flex gap-2 mt-2 ${
              isUserMessage ? 'justify-end' : 'justify-start'
            }`}>
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