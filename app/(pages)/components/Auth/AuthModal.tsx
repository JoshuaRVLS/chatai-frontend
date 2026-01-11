"use client";

import { motion, AnimatePresence } from "motion/react";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";
import { FiX } from "react-icons/fi";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { VerifyForm } from "./VerifyForm";
import { useEffect } from "react";

export const AuthModal = () => {
    const { isOpen, view, closeModal } = useAuthModalStore();

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [closeModal]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Enhanced Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-black/60 transition-all duration-500"
                    />

                    {/* Modal content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
                        className="relative w-full max-w-[420px] z-10"
                    >
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-linear-to-r from-zinc-700/20 via-zinc-600/20 to-zinc-700/20 rounded-[40px] blur-2xl opacity-50 pointer-events-none" />

                        <div className="relative bg-[#09090b]/90 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[32px] overflow-hidden ring-1 ring-white/5">
                            {/* Decorative lighting */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/3 blur-[60px] rounded-full pointer-events-none" />
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-zinc-800/20 blur-[80px] rounded-full pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all z-20 group active:scale-90"
                            >
                                <FiX className="text-lg transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110" />
                            </button>

                            <div className="p-8 sm:p-10 relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={view}
                                        initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        {view === 'login' && <LoginForm />}
                                        {view === 'register' && <RegisterForm />}
                                        {view === 'verify' && <VerifyForm />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
