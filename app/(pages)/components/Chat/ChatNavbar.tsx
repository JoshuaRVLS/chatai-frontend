"use client";

import React from "react";
import Image from "next/image";
import { FaUndo, FaCog, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "@/app/hooks/useSettings";
import { FiEye } from "react-icons/fi";

interface ChatNavbarProps {
    characterId: string;
    characterName: string;
    characterImage: string | null;
    isNsfw?: boolean;
    onProfileClick: (e: React.MouseEvent) => void;
    onUndo: () => void;
    onClearHistory: () => void;
    onShowSettings: () => void;
    onShowBrain: () => void;
    hasUndo: boolean;
}

const ChatNavbar = ({
    characterId,
    characterName,
    characterImage,
    isNsfw,
    onProfileClick,
    onUndo,
    onClearHistory,
    onShowSettings,
    onShowBrain,
    hasUndo,
}: ChatNavbarProps) => {
    const router = useRouter();
    const { settings } = useSettings();
    const [tempUnblur, setTempUnblur] = React.useState(false);
    const shouldBlur = isNsfw && settings?.blurNsfw && !tempUnblur;

    const handleNavigateToProfile = () => {
        router.push(`/character/${characterId}`);
    };

    return (
        <div className="flex items-center justify-between px-6 sm:px-8 py-3 sm:py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4 sm:gap-5">
                <button
                    onClick={(e) => {
                        if (shouldBlur) {
                            setTempUnblur(true);
                        } else {
                            handleNavigateToProfile();
                        }
                    }}
                    className={`relative group transition-all cursor-pointer ${shouldBlur ? 'group-active:scale-95' : 'hover:scale-105'}`}
                >
                    <div className="absolute -inset-1.5 bg-linear-to-tr from-primary to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-md" />
                    <Image
                        src={characterImage || "/default-character.png"}
                        width={48}
                        height={48}
                        alt={characterName}
                        className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 object-cover transition-all ${shouldBlur ? 'blur-md grayscale-[0.5]' : ''}`}
                    />
                    <AnimatePresence>
                        {shouldBlur && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-full"
                            >
                                <FiEye className="text-white/60 text-xs" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
                <div
                    onClick={handleNavigateToProfile}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <h2 className="text-lg sm:text-xl font-black text-white italic tracking-tighter uppercase leading-none truncate max-w-[150px] sm:max-w-none">
                        {characterName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Connected</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                    onClick={onShowBrain}
                    className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    title="Brain & memories"
                >
                    <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
                        title="Undo last action"
                    >
                        <FaUndo size={12} />
                    </button>
                )}
                <button
                    onClick={onClearHistory}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
                    title="Clear history"
                >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </motion.div>
                </button>
                <button
                    onClick={onShowSettings}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
                    title="Chat settings"
                >
                    <FaCog size={12} />
                </button>
                <button
                    onClick={() => router.push("/")}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                    <FaTimes size={14} />
                </button>
            </div>
        </div>
    );
};

export default React.memo(ChatNavbar);
