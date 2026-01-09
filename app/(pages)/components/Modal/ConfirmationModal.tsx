"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiAlertTriangle, FiTrash2, FiHelpCircle, FiX } from "react-icons/fi";

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "primary";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-slate-950/60" // Removed blur for performance
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{ transform: "translateZ(0)" }} // Force GPU acceleration
                        className="relative w-full max-w-md bg-[#0f172a]/90 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl overflow-hidden"
                    >
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            {variant === "danger" ? <FiTrash2 size={120} /> : <FiHelpCircle size={120} />}
                        </div>

                        <div className="relative space-y-8">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-2xl ${variant === "danger" ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"}`}>
                                    {variant === "danger" ? <FiAlertTriangle size={24} /> : <FiHelpCircle size={24} />}
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                    {title}
                                </h3>
                                <p className="text-white/40 text-[13px] leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-6 py-4 rounded-2xl text-slate-950 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/20 ${variant === "danger"
                                        ? "bg-red-500 hover:bg-red-400"
                                        : "bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                        }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
