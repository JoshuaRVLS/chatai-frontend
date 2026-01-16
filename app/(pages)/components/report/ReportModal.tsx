"use client";

import { motion, AnimatePresence } from "motion/react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { useState, useEffect } from "react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId?: string;
    targetCharacterId?: string;
}

const REPORT_REASONS = [
    "Inappropriate Content",
    "Spam or Misleading",
    "Harassment or Hate Speech",
    "Other",
];

export const ReportModal = ({ isOpen, onClose, targetUserId, targetCharacterId }: ReportModalProps) => {
    const [reason, setReason] = useState(REPORT_REASONS[0]);
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setReason(REPORT_REASONS[0]);
            setDetails("");
            setError(null);
            setSuccess(false);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reason,
                    details,
                    targetUserId,
                    targetCharacterId,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit report");
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000); // Close after 2 seconds
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 transition-all duration-500"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
                        className="relative w-full max-w-[420px] z-10"
                    >
                        <div className="absolute -inset-4 bg-linear-to-r from-red-700/20 via-orange-600/20 to-red-700/20 rounded-[40px] blur-2xl opacity-50 pointer-events-none" />

                        <div className="relative bg-[#09090b]/90 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[32px] overflow-hidden ring-1 ring-white/5 p-8">
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all z-20 group active:scale-90"
                            >
                                <FiX className="text-lg transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110" />
                            </button>

                            {success ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                                        <svg
                                            className="w-8 h-8"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Report Submitted</h3>
                                    <p className="text-zinc-400">
                                        Thank you for keeping our community safe. We will review this shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="flex items-center gap-3 text-red-400 mb-2">
                                        <FiAlertTriangle className="text-xl" />
                                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                                            Report Content
                                        </h2>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-zinc-300 ml-1">
                                            Reason
                                        </label>
                                        <div className="space-y-2">
                                            {REPORT_REASONS.map((r) => (
                                                <label
                                                    key={r}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === r
                                                            ? "bg-white/10 border-white/20 shadow-lg shadow-white/5"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="reason"
                                                        value={r}
                                                        checked={reason === r}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        className="w-4 h-4 accent-red-500"
                                                    />
                                                    <span className="text-zinc-200">{r}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300 ml-1">
                                            Additional Details
                                        </label>
                                        <textarea
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            placeholder="Please provide any other relevant information..."
                                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none transition-all"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 font-medium transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? "Submitting..." : "Submit Report"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
