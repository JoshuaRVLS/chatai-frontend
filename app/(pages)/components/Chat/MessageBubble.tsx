"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { FiEye } from "react-icons/fi";
import { FaEdit, FaTrash, FaRedo, FaThumbtack, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import MarkDown from "../MarkDown/MarkDown";
import type { Message } from "@/app/generated/prisma";
import UserAvatar from "../Common/UserAvatar";

export const MessageBubble = React.memo(
    ({
        message,
        userImage,
        userName,
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
        userName?: string | null;
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
                        className="relative transition-all shrink-0 group/avatar w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:scale-105"
                    >
                        {avatarLoading && (
                            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center rounded-full z-10">
                                <div className="w-2 h-2 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                            </div>
                        )}
                        <Image
                            src={imageSrc}
                            width={32}
                            height={32}
                            alt={altText}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 object-cover transition-all duration-300 ${isNsfw && isBlurEnabled && !tempUnblur ? 'blur-[6px] grayscale-[0.5]' : ''} ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
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
                                    <FiEye className="text-white/60 text-[9px]" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                ) : (
                    <UserAvatar
                        name={userName}
                        image={userImage}
                        size="sm"
                        className="w-7 h-7 sm:w-8 sm:h-8 shrink-0"
                    />
                )}

                <div
                    className={`flex-1 max-w-[85%] ${isUserMessage ? "text-right" : "text-left"}`}
                >
                    {/* Message Content */}
                    <div
                        onClick={handleTap}
                        className={`inline-block text-left rounded-2xl sm:rounded-3xl px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-300 cursor-pointer text-sm sm:text-[15px] leading-relaxed ${isUserMessage
                            ? "bg-text-primary text-page font-bold shadow-lg"
                            : "bg-surface border border-border-default text-text-primary shadow-md"
                            }`}
                    >
                        {isEditing ? (
                            <div className="space-y-3 min-w-[200px]">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => onEditContentChange?.(e.target.value)}
                                    className="w-full bg-input border border-border-input rounded-xl p-3 text-text-primary text-sm resize-none focus:ring-1 focus:ring-border-hover outline-none"
                                    rows={4}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onCancelEdit?.(); }}
                                        className="px-3 py-1 border border-border-default rounded-lg hover:bg-surface-hover transition-colors text-[10px] uppercase font-black tracking-widest text-text-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSaveEdit?.(message.id); }}
                                        className="px-3 py-1 bg-text-primary text-page rounded-lg hover:opacity-90 transition-colors text-[10px] uppercase font-black tracking-widest"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {!message.content && isOptimistic && message.id === "streaming" ? (
                                    <div className="flex gap-1.5 py-1 px-1 items-center">
                                        <div className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-duration:0.8s]" />
                                        <div className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-duration:0.8s] [animation-delay:0.15s]" />
                                        <div className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-duration:0.8s] [animation-delay:0.3s]" />
                                    </div>
                                ) : (
                                    <>
                                        <MarkDown isLight={isUserMessage}>{message.content}</MarkDown>
                                        {isOptimistic && message.id === "streaming" && (
                                            <div className="inline-flex gap-0.5 ml-1 align-baseline opacity-30">
                                                <div className="w-0.5 h-0.5 rounded-full bg-current animate-pulse" />
                                                <div className="w-0.5 h-0.5 rounded-full bg-current animate-pulse [animation-delay:0.2s]" />
                                                <div className="w-0.5 h-0.5 rounded-full bg-current animate-pulse [animation-delay:0.4s]" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Message Actions */}
                    {!isOptimistic && !isEditing && (
                        <div
                            className={`flex gap-1 mt-1.5 transition-all duration-200 ${showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0"
                                } ${isUserMessage ? "justify-end" : "justify-start"}`}
                        >
                            <button
                                onClick={() => onEdit(message.id, message.content)}
                                className="w-6 h-6 flex items-center justify-center bg-surface border border-border-default rounded-md hover:bg-surface-hover transition-all text-text-muted hover:text-text-primary"
                                title="Edit"
                            >
                                <FaEdit size={8} />
                            </button>

                            <button
                                onClick={() => onDelete(message.id)}
                                className="w-6 h-6 flex items-center justify-center bg-surface border border-border-default rounded-md hover:bg-surface-hover transition-all text-text-muted hover:text-text-primary"
                                title="Delete"
                            >
                                <FaTrash size={8} />
                            </button>

                            {!isUserMessage && (
                                <button
                                    onClick={() => onRegenerate(message.id)}
                                    className="w-6 h-6 flex items-center justify-center bg-surface border border-border-default rounded-md hover:bg-surface-hover transition-all text-text-muted hover:text-text-primary"
                                    title="Regenerate"
                                >
                                    <FaRedo size={8} />
                                </button>
                            )}

                            {isUserMessage && (
                                <button
                                    onClick={() => onUserRegenerate(message.id)}
                                    className="w-6 h-6 flex items-center justify-center bg-surface border border-border-default rounded-md hover:bg-surface-hover transition-all text-text-muted hover:text-text-primary"
                                    title="Edit and resend"
                                >
                                    <FaRedo size={8} />
                                </button>
                            )}

                            <button
                                onClick={() => onTogglePin(message.id, !!message.pinned)}
                                className={`w-6 h-6 flex items-center justify-center border rounded-md transition-all ${message.pinned
                                    ? "bg-text-primary text-page border-text-primary"
                                    : "bg-surface border-border-default text-text-muted hover:bg-surface-hover hover:text-text-primary"
                                    }`}
                                title={message.pinned ? "Unpin" : "Pin"}
                            >
                                <FaThumbtack size={8} className={message.pinned ? "" : "-rotate-45"} />
                            </button>

                            {!isUserMessage && (
                                <>
                                    <button
                                        onClick={() => onFeedback(message.id, message.feedback === "LIKE" ? "NONE" : "LIKE")}
                                        className={`w-6 h-6 flex items-center justify-center border rounded-md transition-all ${message.feedback === "LIKE"
                                            ? "bg-surface-hover text-text-primary border-border-hover"
                                            : "bg-surface border-border-default text-text-muted hover:bg-surface-hover hover:text-text-primary"
                                            }`}
                                        title="Like"
                                    >
                                        <FaThumbsUp size={8} />
                                    </button>
                                    <button
                                        onClick={() => onFeedback(message.id, message.feedback === "DISLIKE" ? "NONE" : "DISLIKE")}
                                        className={`w-6 h-6 flex items-center justify-center border rounded-md transition-all ${message.feedback === "DISLIKE"
                                            ? "bg-surface-hover text-text-primary border-border-hover"
                                            : "bg-surface border-border-default text-text-muted hover:bg-surface-hover hover:text-text-primary"
                                            }`}
                                        title="Dislike"
                                    >
                                        <FaThumbsDown size={8} />
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
