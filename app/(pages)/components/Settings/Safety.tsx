"use client";

import React, { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiShield, FiAlertTriangle, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import { toast } from '@/app/lib/toast';

interface SafetySettingsProps {
    data: any;
}

const Safety: React.FC<SafetySettingsProps> = ({ data }) => {
    const [showNsfw, setShowNsfw] = useState(data?.userSettings?.showNsfw ?? false);
    const [blurNsfw, setBlurNsfw] = useState(data?.userSettings?.blurNsfw ?? true);
    const [loading, setLoading] = useState(false);

    // Update local state when data changes
    useEffect(() => {
        if (data?.userSettings) {
            setShowNsfw(data.userSettings.showNsfw);
            setBlurNsfw(data.userSettings.blurNsfw);
        }
    }, [data]);

    const handleUpdateSetting = async (key: string, value: boolean) => {
        setLoading(true);
        const toastId = toast.loading("Updating safety preferences...");

        try {
            const response = await fetch(`/api/users/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (response.ok) {
                toast.success("Settings updated successfully", { id: toastId });
                if (key === "showNsfw") setShowNsfw(value);
                if (key === "blurNsfw") setBlurNsfw(value);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to update settings", { id: toastId });
            }
        } catch (err) {
            console.error("Error updating settings:", err);
            toast.error("An error occurred. Please try again.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 sm:p-10 space-y-10">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                    <FiShield className="text-primary" /> Content Safety
                </h2>
                <p className="text-white/40 text-sm">
                    Configure how sensitive content is displayed across the platform.
                </p>
            </div>

            <div className="space-y-6">
                {/* Blur Toggle */}
                <div className={`bg-white/2 border border-white/5 rounded-4xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:bg-white/4 ${!showNsfw ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white uppercase tracking-widest">Image Filtering</span>
                            {blurNsfw ? (
                                <FiEyeOff className="text-primary text-sm" />
                            ) : (
                                <FiEye className="text-orange-500 text-sm" />
                            )}
                        </div>
                        <p className="text-white/20 text-[11px] leading-relaxed max-w-md font-medium">
                            Apply a blur effect to mature images until they are clicked.
                        </p>
                    </div>

                    <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 relative">
                        <button
                            onClick={() => handleUpdateSetting("blurNsfw", true)}
                            className={`relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${blurNsfw ? "text-slate-950" : "text-white/30 hover:text-white"
                                }`}
                        >
                            Blur Images
                        </button>
                        <button
                            onClick={() => handleUpdateSetting("blurNsfw", false)}
                            className={`relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!blurNsfw ? "text-slate-950" : "text-white/30 hover:text-white"
                                }`}
                        >
                            Unblur
                        </button>
                        <motion.div
                            layoutId="blur-tab"
                            className="absolute inset-y-1.5 bg-primary rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                            initial={false}
                            animate={{
                                x: !blurNsfw ? "100%" : "0%",
                                left: !blurNsfw ? "-0.375rem" : "0.375rem",
                                width: "calc(50% - 0rem)"
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>

                {/* Warning card if NSFW is enabled */}
                <AnimatePresence>
                    {showNsfw && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex gap-4 items-start"
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                <FiAlertTriangle className="text-orange-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Caution Advised</p>
                                <p className="text-[9px] text-white/40 leading-relaxed font-bold">
                                    By enabling mature content, you acknowledge that you are over the legal age in your jurisdiction and wish to view unfiltered content.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-white/20 select-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">Safety Protocol Version 1.4.2</p>
                </div>
            </div>
        </div>
    );
};

export default Safety;
