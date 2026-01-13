"use client";

import React from "react";
import Image from "next/image";
import { FaUndo, FaCog, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "@/app/hooks/useSettings";
import { FiEye, FiShare2 } from "react-icons/fi";
import ShareModal from "../Common/ShareModal";

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
    const [isShareOpen, setIsShareOpen] = React.useState(false);
    const shouldBlur = isNsfw && settings?.blurNsfw && !tempUnblur;

    const handleNavigateToProfile = () => {
        router.push(`/character/${characterId}`);
    };

    return (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl z-20">
            <div className="flex items-center gap-3 sm:gap-4">
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
                    <Image
                        src={characterImage || "/default-character.png"}
                        width={40}
                        height={40}
                        alt={characterName}
                        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 object-cover transition-all ${shouldBlur ? 'blur-md grayscale-[0.5]' : ''}`}
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
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-none truncate max-w-[120px] sm:max-w-none">
                        {characterName}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[7px] sm:text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active Link</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                    onClick={onShowBrain}
                    className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-white/5"
                    title="Intelligence Engine"
                >
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5V6a2 2 0 0 1-2 2h-2.5a1.5 1.5 0 0 0-1.5 1.5V11a2 2 0 0 1-2 2" />
                            <path d="M14.5 2A1.5 1.5 0 0 1 16 3.5V6a2 2 0 0 0 2 2h2.5a1.5 1.5 0 0 1 1.5 1.5V11a2 2 0 0 0 2 2" />
                            <path d="M2 13a2 2 0 0 0-2 2v1.5A1.5 1.5 0 0 0 1.5 18H4a2 2 0 0 1 2 2v2.5A1.5 1.5 0 0 0 7.5 24" />
                            <path d="M22 13a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 1-1.5 1.5H20a2 2 0 0 0-2 2v2.5a1.5 1.5 0 0 1-1.5 1.5" />
                        </svg>
                    </motion.div>
                </button>
                <button
                    onClick={() => setIsShareOpen(true)}
                    className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-sky-400 hover:bg-sky-400/10 transition-all border border-white/5"
                    title="Share Character"
                >
                    <FiShare2 size={12} />
                </button>
                {hasUndo && (
                    <button
                        onClick={onUndo}
                        className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-white/5"
                        title="Undo"
                    >
                        <FaUndo size={10} />
                    </button>
                )}
                <button
                    onClick={onClearHistory}
                    className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
                    title="Purge Logs"
                >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </motion.div>
                </button>
                <button
                    onClick={onShowSettings}
                    className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-white/5"
                    title="Parameters"
                >
                    <FaCog size={10} />
                </button>
                <button
                    onClick={() => router.push("/")}
                    className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-white/5"
                >
                    <FaTimes size={12} />
                </button>
            </div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                title={characterName}
                text={`Chat with ${characterName} on JChatAI`}
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/character/${characterId}`}
            />
        </div>
    );
};

export default React.memo(ChatNavbar);
