"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    FiX,
    FiMessageSquare,
    FiUser,
    FiBook,
    FiZap,
    FiTerminal,
    FiChevronRight,
    FiChevronLeft,
    FiShield
} from "react-icons/fi";

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const slides = [
    {
        title: "Welcome to JChatAI",
        subtitle: "The next generation of AI Roleplay",
        icon: <FiZap className="text-primary" />,
        content: "Experience deep, context-aware conversations with your favorite characters. JChatAI combines advanced memory systems with premium UI for the ultimate immersion.",
        features: ["Dynamic Memory", "Custom Personas", "Lore Integration"]
    },
    {
        title: "Dynamic Personas",
        subtitle: "Who are you today?",
        icon: <FiUser className="text-blue-400" />,
        content: "Create multiple personas to change how characters perceive you. Switch identities on the fly within any chat to explore different relationship dynamics.",
        features: ["Global Personas", "Visual Avatars", "Unique Descriptions"]
    },
    {
        title: "Lorebooks",
        subtitle: "Build your world",
        icon: <FiBook className="text-emerald-400" />,
        content: "Attach Lorebooks to your characters to give them persistent world knowledge. Define items, locations, and historical events that the AI will always remember.",
        features: ["Keyword Triggers", "Global Lore", "Infinite Context"]
    },
    {
        title: "Slash Commands",
        subtitle: "Power at your fingertips",
        icon: <FiTerminal className="text-purple-400" />,
        content: "Control your experience directly from the chat box using intuitive slash commands. No need to dig through menus for common actions.",
        commands: [
            { cmd: "/help", desc: "Show this tutorial" },
            { cmd: "/clear", desc: "Reset current conversation" },
            { cmd: "/reset", desc: "Wipe AI long-term memory" }
        ]
    },
    {
        title: "Safety & Privacy",
        subtitle: "A secure playground",
        icon: <FiShield className="text-orange-400" />,
        content: "Your data is handled with care. Use features like NSFW blurring to customize your browsing experience. Long-press characters for quick management on mobile.",
        features: ["Sensitive Content Blur", "Local Persistence", "Private Archives"]
    }
];

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onClose();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-auto"
                    >
                        {/* Progress Bar (Mobile Top) */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 md:hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                            />
                        </div>

                        {/* Visual Side (Desktop) */}
                        <div className="hidden md:flex md:w-2/5 bg-zinc-900/50 items-center justify-center p-12 border-r border-white/5 relative">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-primary blur-[100px] rounded-full" />
                            </div>
                            <motion.div
                                key={currentSlide}
                                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                className="text-[120px] relative z-10"
                            >
                                {slides[currentSlide].icon}
                            </motion.div>
                        </div>

                        {/* Content Side */}
                        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all z-20"
                            >
                                <FiX size={20} />
                            </button>

                            <div className="space-y-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentSlide}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                                {slides[currentSlide].subtitle}
                                            </p>
                                            <h3 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                                {slides[currentSlide].title}
                                            </h3>
                                        </div>

                                        <p className="text-white/50 text-sm leading-relaxed font-medium">
                                            {slides[currentSlide].content}
                                        </p>

                                        {slides[currentSlide].features && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {slides[currentSlide].features.map((f, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest italic">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {slides[currentSlide].commands && (
                                            <div className="space-y-2 pt-2">
                                                {slides[currentSlide].commands.map((cmd, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                                                        <code className="text-primary text-xs font-black">{cmd.cmd}</code>
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{cmd.desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between pt-12 border-t border-white/5">
                                <div className="flex gap-1.5">
                                    {slides.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/10"}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    {currentSlide > 0 && (
                                        <button
                                            onClick={prevSlide}
                                            className="p-3 rounded-2xl bg-white/5 text-white/40 hover:text-white transition-all"
                                        >
                                            <FiChevronLeft size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={nextSlide}
                                        className="px-8 py-3 rounded-2xl bg-primary text-slate-950 text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all flex items-center gap-2 group"
                                    >
                                        <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
                                        <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TutorialModal;
