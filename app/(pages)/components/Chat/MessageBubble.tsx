"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { FiEye } from "react-icons/fi";
import { FaEdit, FaTrash, FaRedo, FaThumbtack, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import MarkDown from "../MarkDown/MarkDown";
import type { Message } from "@/app/generated/prisma";

export const MessageBubble = React.memo(
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
            ? userImage || "/avatar.png"
            : characterImage || "/default.jpg";

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
                            }
                        }}
                        className={`relative transition-all shrink-0 group/avatar w-8 h-8 sm:w-9 sm:h-9 ${isNsfw && isBlurEnabled && !tempUnblur ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
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
                                {!message.content && isOptimistic && message.id === "streaming" ? (
                                    <div className="flex gap-1.5 py-2 px-1 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-duration:0.8s]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-duration:0.8s] [animation-delay:0.15s]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-duration:0.8s] [animation-delay:0.3s]" />
                                        <span className="ml-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 leading-none">Thinking</span>
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
