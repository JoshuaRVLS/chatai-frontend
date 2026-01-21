"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { FiEye, FiMessageSquare, FiClock, FiTrash2, FiPlay } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { useSettings } from "@/app/hooks/useSettings";

interface HistoryCardProps {
    chat: any;
    onDelete: (e: React.MouseEvent, chatId: string) => void;
}

const HistoryCard = React.memo(({ chat, onDelete }: HistoryCardProps) => {
    const { settings } = useSettings();
    const [tempUnblur, setTempUnblur] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const shouldBlur = chat.character.isNsfw && settings?.blurNsfw && !tempUnblur;

    return (
        <Link
            href={`/chat/${chat.id}`}
            onClick={(e) => {
                if (shouldBlur) {
                    e.preventDefault();
                    setTempUnblur(true);
                }
            }}
            className="group shrink-0 w-[380px] snap-start"
        >
            <motion.div
                className="relative overflow-hidden flex flex-col p-4 rounded-3xl border border-border-default bg-surface hover:border-border-hover transition-all duration-300 hover:bg-surface-hover"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
            >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

                <div className="flex gap-5 items-start relative z-10">
                    <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-white/5 shrink-0 border border-white/10 shadow-2xl">
                        {imageLoading && (
                            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                                <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                            </div>
                        )}
                        <Image
                            src={`/api/image/${chat.character.id}`}
                            fill
                            className={`object-cover transition-all duration-700 group-hover:scale-110 ${shouldBlur ? 'blur-xl grayscale-[0.5]' : ''} ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                            alt={chat.character.name}
                            sizes="96px"
                            onLoad={() => setImageLoading(false)}
                            onError={() => setImageLoading(false)}
                        />
                        <AnimatePresence>
                            {shouldBlur && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-overlay/80 backdrop-blur-md transition-colors group-hover:bg-overlay"
                                >
                                    <FiEye className="text-white text-xl mb-1 hover:scale-110 transition-transform" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black text-white truncate leading-none mb-2 tracking-tight uppercase italic group-hover:text-primary transition-colors">
                                {chat.character.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/10 text-[9px] font-black text-primary uppercase tracking-wider">
                                    <FiMessageSquare className="w-2.5 h-2.5" />
                                    {(chat._count?.messages || chat.messages.length)}
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-wider">
                                    <FiClock className="w-2.5 h-2.5" />
                                    {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : "Unknown"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-surface-hover border border-border-default relative group/msg">
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-medium transition-colors group-hover/msg:text-text-primary">
                        {chat.messages[0]?.content || "No transmission received."}
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-text-muted/50 uppercase tracking-[0.3em]">Access Code: #{chat.id.slice(-4).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => onDelete(e, chat.id)}
                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all opacity-0 group-hover:opacity-100"
                            title="Terminate Archival Signal"
                        >
                            <FiTrash2 size={14} />
                        </button>
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-110 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all">
                            <FiPlay size={14} className="fill-current ml-0.5" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
});

export default HistoryCard;
