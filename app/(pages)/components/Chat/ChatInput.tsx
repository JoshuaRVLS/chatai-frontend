"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaBrain, FaMagic, FaPaperPlane } from "react-icons/fa";

const COMMANDS = [
    { cmd: "/help", desc: "Show tutorial" },
    { cmd: "/clear", desc: "Reset conversation" },
    { cmd: "/reset", desc: "Wipe AI memory" },
];

const ChatInput = React.memo(({
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
        target.style.height = '44px';
        target.style.height = `${target.scrollHeight}px`;
    };

    const handleInternalSubmit = async () => {
        if (!message.trim() || isSubmitting) return;
        const content = message;
        setMessage("");
        setCommandSuggestions([]);
        try {
            await onSubmit(content);
            const textarea = document.querySelector('textarea[placeholder="Message..."]') as HTMLTextAreaElement;
            if (textarea) textarea.style.height = '44px';
        } catch (err) {
            setMessage(content);
        }
    };

    return (
        <div className="px-3 pt-2 pb-6 sm:p-4 bg-zinc-950/80 backdrop-blur-3xl border-t border-white/5">
            <div className="max-w-4xl mx-auto">
                <AnimatePresence>
                    {suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-nowrap gap-2 mb-3 overflow-x-auto hide-scrollbar scroll-smooth"
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
                                    className="px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all whitespace-nowrap shrink-0"
                                >
                                    {s}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative flex items-end gap-2">
                    <AnimatePresence>
                        {commandSuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-3 w-64 bg-zinc-900 border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="px-3 py-2 mb-1 border-b border-white/5">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Neural Directives</p>
                                </div>
                                {commandSuggestions.map((c, i) => (
                                    <button
                                        key={c.cmd}
                                        onClick={() => handleSelectCommand(c.cmd)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${i === selectedIndex ? "bg-white/5 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"}`}
                                    >
                                        <code className="text-[10px] font-black">{c.cmd}</code>
                                        <span className="text-[8px] font-bold uppercase tracking-tighter opacity-40">{c.desc}</span>
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
                            placeholder="Message..."
                            disabled={isSubmitting}
                            className="w-full bg-zinc-900 border border-white/5 text-white placeholder:text-zinc-600 rounded-2xl px-5 py-3 pr-5 resize-none focus:border-white/10 outline-none transition-all duration-300 text-sm leading-relaxed"
                            style={{ height: '44px', minHeight: '44px', maxHeight: '160px', overflowY: 'auto' }}
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onGetIdeas}
                            disabled={isSubmitting || isGeneratingSuggestions}
                            className="hidden sm:flex w-11 h-11 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 items-center justify-center hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-30"
                            title="Generate Intent"
                        >
                            <FaBrain size={14} className={isGeneratingSuggestions ? 'animate-pulse' : ''} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onContinue}
                            disabled={isSubmitting}
                            className="hidden sm:flex w-11 h-11 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 items-center justify-center hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-30"
                            title="Expand Narrative"
                        >
                            <FaMagic size={14} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleInternalSubmit}
                            disabled={!message.trim() || isSubmitting}
                            className="w-11 h-11 rounded-2xl bg-white text-zinc-950 flex items-center justify-center shadow-none hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-700 shrink-0"
                        >
                            <FaPaperPlane size={12} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
});

ChatInput.displayName = "ChatInput";

export { ChatInput };
