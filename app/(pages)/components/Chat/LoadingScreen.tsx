"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaBrain } from "react-icons/fa";

export const LoadingScreen = () => {
    const statusMessages = [
        "Initializing neural links...",
        "Retrieving conversation history...",
        "Synchronizing persona data...",
        "Establishing secure connection...",
        "Processing AI context..."
    ];
    const [statusIndex, setStatusIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statusMessages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [statusMessages.length]);

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-[#020617] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full"
                />
            </div>

            <div className="relative flex flex-col items-center">
                {/* AI Core Pulse Animation */}
                <div className="relative w-24 h-24 mb-12">
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-primary/20 border border-primary/30"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-4 rounded-full bg-linear-to-br from-primary via-cyan-400 to-purple-500 shadow-[0_0_40px_rgba(34,211,238,0.5)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FaBrain size={32} className="text-slate-900" />
                    </div>

                    {/* Orbiting Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-10px] border-2 border-dashed border-white/10 rounded-full"
                    />
                </div>

                {/* Status Text with Scanning Effect */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative overflow-hidden px-4 py-1">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={statusIndex}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="block text-white text-sm font-black uppercase tracking-[0.3em] font-mono italic"
                            >
                                {statusMessages[statusIndex]}
                            </motion.span>
                        </AnimatePresence>
                        {/* Scan Line */}
                        <motion.div
                            animate={{ left: ["-100%", "200%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent skew-x-12"
                        />
                    </div>

                    {/* Animated Progress Dots */}
                    <div className="flex gap-2.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    backgroundColor: ["rgba(255,255,255,0.1)", "#22d3ee", "rgba(255,255,255,0.1)"]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                className="w-1.5 h-1.5 rounded-full"
                            />
                        ))}
                    </div>
                </div>

                {/* Branded Versioning */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    className="absolute -bottom-32 text-[9px] font-black text-white uppercase tracking-[0.5em] italic"
                >
                    Artificial Intelligence Interface • v2.0
                </motion.p>
            </div>
        </motion.div>
    );
};
