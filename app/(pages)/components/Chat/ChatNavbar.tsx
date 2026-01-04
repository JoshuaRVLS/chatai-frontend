"use client";

import React from "react";
import Image from "next/image";
import { FaUndo, FaCog, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

interface ChatNavbarProps {
    characterName: string;
    characterImage: string | null;
    onProfileClick: (e: React.MouseEvent) => void;
    onUndo: () => void;
    onClearHistory: () => void;
    onShowSettings: () => void;
    onShowBrain: () => void;
    hasUndo: boolean;
}

const ChatNavbar = ({
    characterName,
    characterImage,
    onProfileClick,
    onUndo,
    onClearHistory,
    onShowSettings,
    onShowBrain,
    hasUndo,
}: ChatNavbarProps) => {
    const router = useRouter();

    return (
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4 sm:gap-5">
                <button
                    onClick={onProfileClick}
                    className="relative group group-active:scale-95 transition-all"
                >
                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-md" />
                    <Image
                        src={characterImage || "/default-character.png"}
                        width={56}
                        height={56}
                        alt={characterName}
                        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 object-cover"
                    />
                </button>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {characterName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Connected</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onShowBrain}
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    title="Neural brain & memories"
                >
                    <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5V6a2 2 0 0 1-2 2h-2.5a1.5 1.5 0 0 0-1.5 1.5V11a2 2 0 0 1-2 2" />
                            <path d="M14.5 2A1.5 1.5 0 0 1 16 3.5V6a2 2 0 0 0 2 2h2.5a1.5 1.5 0 0 1 1.5 1.5V11a2 2 0 0 0 2 2" />
                            <path d="M2 13a2 2 0 0 0-2 2v1.5A1.5 1.5 0 0 0 1.5 18H4a2 2 0 0 1 2 2v2.5A1.5 1.5 0 0 0 7.5 24" />
                            <path d="M22 13a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 1-1.5 1.5H20a2 2 0 0 0-2 2v2.5a1.5 1.5 0 0 1-1.5 1.5" />
                        </svg>
                    </motion.div>
                </button>
                {hasUndo && (
                    <button
                        onClick={onUndo}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
                        title="Undo last action"
                    >
                        <FaUndo size={14} />
                    </button>
                )}
                <button
                    onClick={onClearHistory}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
                    title="Clear history"
                >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </motion.div>
                </button>
                <button
                    onClick={onShowSettings}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
                    title="Chat settings"
                >
                    <FaCog size={14} />
                </button>
                <button
                    onClick={() => router.push("/")}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                    <FaTimes size={16} />
                </button>
            </div>
        </div>
    );
};

export default React.memo(ChatNavbar);
