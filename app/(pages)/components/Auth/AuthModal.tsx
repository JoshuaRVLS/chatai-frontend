"use client";

import { motion, AnimatePresence } from "motion/react";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";
import { FiX } from "react-icons/fi";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
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
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                    />

                    {/* Modal content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-[400px] z-10"
                    >
                        <div className="bg-zinc-900 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-4xl overflow-hidden">
                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors z-20 group"
                            >
                                <FiX className="text-xl transition-transform group-hover:rotate-90" />
                            </button>

                            <div className="p-6 md:p-8 relative">
                                {/* Subtle reflection effect */}
                                <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={view}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {view === 'login' ? <LoginForm /> : <RegisterForm />}
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
