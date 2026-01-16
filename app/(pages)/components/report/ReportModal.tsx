"use client";

import { motion, AnimatePresence } from "motion/react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

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

    const { mutate: submitReport, isPending: isSubmitting } = useMutation({
        mutationFn: async () => {
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
            return res.json();
        },
        onMutate: () => {
            // Optimistic Update: Show success immediately
            setSuccess(true);
            // Close automatically after a short delay for UX
            setTimeout(() => {
                onClose();
            }, 1500);
        },
        onError: () => {
            setSuccess(false);
            setError("Failed to submit report. Please try again.");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        submitReport();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                        className="relative w-full max-w-[380px] z-10"
                    >
                        <div className="relative bg-zinc-950 border border-white/5 shadow-2xl rounded-2xl overflow-hidden p-5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/10">
                                        <FiAlertTriangle size={14} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Report</h2>
                                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Submit Issue</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>

                            {success ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-zinc-900/50 rounded-xl border border-white/5 border-dashed">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Received</h3>
                                        <p className="text-[10px] text-zinc-500 mt-1">We will review this shortly.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500 font-medium text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Reason</label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {REPORT_REASONS.map((r) => (
                                                <label
                                                    key={r}
                                                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${reason === r
                                                        ? "bg-zinc-900 border-white/20 text-white"
                                                        : "bg-transparent border-transparent hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                                                        }`}
                                                >
                                                    <span className="text-xs font-medium">{r}</span>
                                                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors ${reason === r ? "border-red-500" : "border-zinc-700 group-hover:border-zinc-500"}`}>
                                                        {reason === r && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="reason"
                                                        value={r}
                                                        checked={reason === r}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        className="hidden"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Details</label>
                                        <textarea
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            placeholder="Specific details..."
                                            className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 resize-none transition-colors"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? "Sending..." : "Submit Report"}
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
