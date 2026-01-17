"use client";

import React from "react";
import { motion } from "motion/react";

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-page">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-12 h-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-text-primary border-r-2 border-r-transparent border-b-2 border-b-transparent border-l-2 border-l-transparent"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-b-2 border-text-muted border-t-2 border-t-transparent border-l-2 border-l-transparent border-r-2 border-r-transparent"
                    />
                </div>
                <p className="text-sm font-medium text-text-muted uppercase tracking-widest animate-pulse">
                    Loading
                </p>
            </div>
        </div>
    );
};
