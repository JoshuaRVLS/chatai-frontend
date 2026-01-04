"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaTimes, FaBrain, FaTrash, FaLightbulb, FaHistory } from "react-icons/fa";
import { FiZap } from "react-icons/fi";

interface BrainPanelProps {
    isOpen: boolean;
    onClose: () => void;
    memory: string | null;
    onClearMemory: () => void;
    pinnedMessages: { id: string; content: string; fromUser: boolean }[];
    onUnpin: (id: string) => void;
}

const BrainPanel = ({
    isOpen,
    onClose,
    memory,
    onClearMemory,
    pinnedMessages,
    onUnpin
}: BrainPanelProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#020617]/90 border-l border-white/10 shadow-[-20px_0_80px_rgba(0,0,0,0.8)] z-[70] flex flex-col backdrop-blur-2xl"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute -inset-2 bg-primary/20 blur-lg rounded-full animate-pulse" />
                                    <div className="relative w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                        <FaBrain size={24} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Neural Brain</h3>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">Persistent Context Engaged</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                            {/* Learned Memories */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FaLightbulb className="text-primary" />
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Learned Facts</h4>
                                    </div>
                                    {memory && (
                                        <button
                                            onClick={onClearMemory}
                                            className="text-[9px] font-black text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1.5 group"
                                        >
                                            <FaTrash size={8} className="group-hover:scale-110 transition-transform" /> Reset Brain
                                        </button>
                                    )}
                                </div>

                                {memory ? (
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                                        <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed font-medium">
                                            {memory.split('\n').map((line, i) => (
                                                <p key={i}>{line.replace(/^-\s*/, '')}</p>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-10 text-center">
                                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">No deep memories established yet</p>
                                    </div>
                                )}
                            </section>

                            {/* Pinned Messages */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <FaHistory className="text-purple-400" />
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Pinned Context</h4>
                                </div>

                                <div className="space-y-4">
                                    {pinnedMessages.length > 0 ? (
                                        pinnedMessages.map((msg) => (
                                            <div key={msg.id} className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/[0.08]">
                                                <p className={`text-xs font-medium leading-relaxed mb-1 ${msg.fromUser ? 'text-primary/80' : 'text-purple-400/80'}`}>
                                                    {msg.fromUser ? 'User Statement' : 'Character Insight'}
                                                </p>
                                                <p className="text-sm text-white/80 line-clamp-3">
                                                    {msg.content}
                                                </p>
                                                <button
                                                    onClick={() => onUnpin(msg.id)}
                                                    className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors"
                                                    title="Unpin"
                                                >
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-10 text-center">
                                            <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">Pin messages to keep them as permanent context</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Stats/Info */}
                            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <FiZap size={14} />
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Permanent Awareness</h5>
                                        <p className="text-[9px] text-white/40 font-bold mt-0.5">These inputs are sent with every neural query.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BrainPanel;
