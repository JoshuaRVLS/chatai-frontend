"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaBrain, FaMagic, FaPaperPlane } from "react-icons/fa";

const COMMANDS = [
    { cmd: "/help", desc: "Show tutorial" },
    { cmd: "/clear", desc: "Reset conversation" },
    { cmd: "/reset", desc: "Wipe AI memory" },
];

export const ChatInput = React.memo(({
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
    const [commandSuggestions, setCommandSuggestions] = useState<typeof COMMANDS>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (commandSuggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % commandSuggestions.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + commandSuggestions.length) % commandSuggestions.length);
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelectCommand(commandSuggestions[selectedIndex].cmd);
                return;
            }
            if (e.key === "Escape") {
                setCommandSuggestions([]);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey && typeof window !== 'undefined' && window.innerWidth > 768) {
            e.preventDefault();
            handleInternalSubmit();
        }
    };

    const handleSelectCommand = (cmd: string) => {
        setMessage(cmd + " ");
        setCommandSuggestions([]);
        setSelectedIndex(0);
    };

    const handleInputChange = (val: string) => {
        setMessage(val);
        if (val.startsWith("/")) {
            const parts = val.split(" ");
            if (parts.length === 1) {
                const query = parts[0].toLowerCase();
                const matches = COMMANDS.filter(c => c.cmd.startsWith(query));
                setCommandSuggestions(matches);
                setSelectedIndex(0);
            } else {
                setCommandSuggestions([]);
            }
        } else {
            setCommandSuggestions([]);
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
        setCommandSuggestions([]);
        try {
            await onSubmit(content);
            const textarea = document.querySelector('textarea[placeholder="Talk to character..."]') as HTMLTextAreaElement;
            if (textarea) textarea.style.height = '56px';
        } catch (err) {
            setMessage(content);
        }
    };

    return (
        <div className="px-3 pt-3 pb-10 sm:p-6 border-t border-white/5 bg-slate-950/40 backdrop-blur-3xl sm:pb-0">
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
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30"
                    >
                        <FaBrain size={12} className={isGeneratingSuggestions ? 'animate-pulse' : ''} />
                        Ideas
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onContinue}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-30"
                    >
                        <FaMagic size={12} />
                        Continue
                    </motion.button>
                </div>

                <div className="relative flex items-end gap-2 sm:gap-3">
                    {/* Command Autocomplete Dropdown */}
                    <AnimatePresence>
                        {commandSuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-4 w-64 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="px-3 py-1.5 mb-2 border-b border-white/5">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Available Commands</p>
                                </div>
                                {commandSuggestions.map((c, i) => (
                                    <button
                                        key={c.cmd}
                                        onClick={() => handleSelectCommand(c.cmd)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${i === selectedIndex ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
                                    >
                                        <code className="text-[11px] font-black">{c.cmd}</code>
                                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-40">{c.desc}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative flex-1 group">
                        <textarea
                            value={message}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onInput={handleInput}
                            rows={1}
                            placeholder="Talk to character..."
                            disabled={isSubmitting}
                            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 rounded-2xl sm:rounded-4xl px-5 sm:px-7 py-3 sm:py-4.5 pr-5 sm:pr-6 resize-none focus:border-white/20 focus:bg-white/10 outline-none transition-all duration-300 text-sm sm:text-[15px] leading-relaxed"
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
                            className="w-13 h-13 rounded-4xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-30 group relative overflow-hidden"
                            title="Get Roleplay Ideas"
                        >
                            <FaBrain size={18} className={isGeneratingSuggestions ? 'animate-pulse' : ''} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onContinue}
                            disabled={isSubmitting}
                            className="w-13 h-13 rounded-4xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-30 group relative overflow-hidden"
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
                        className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-4xl bg-white text-zinc-950 flex items-center justify-center shadow-none hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white/20 shrink-0"
                    >
                        <FaPaperPlane size={14} className="sm:scale-125" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
});

ChatInput.displayName = "ChatInput";
