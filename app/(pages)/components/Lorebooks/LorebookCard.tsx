"use client";

import React from "react";
import { motion } from "motion/react";
import { FaTrash, FaPlus, FaCheck } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import Link from "next/link";
import { toast } from '@/app/lib/toast';
import { useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { FiTrash2 } from "react-icons/fi";
import Image from "next/image";

import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";

interface LorebookCardProps {
    lorebook: any;
    onUpdate: () => void;
    currentUserId?: string;
}

const LorebookCard: React.FC<LorebookCardProps> = ({ lorebook, onUpdate, currentUserId }) => {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const openModal = useAuthModalStore((state) => state.openModal);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const [imageLoading, setImageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isOwner = currentUserId && lorebook.userId === currentUserId;
    const isSaved = lorebook.isSaved;

    const handleCardClick = (e: React.MouseEvent) => {
        if (!currentUserId && !lorebook.recursiveScanning) {
            // Logic check: The user request is "open login modal when click on lorebooik when not logged in".
            // currentUserId is passed from parent (Lorebooks.tsx) which gets it from AuthContext.
        }

        if (!currentUserId) {
            e.preventDefault();
            openModal('login');
        }
    };

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId) {
            openModal('login');
            return;
        }


        if (saving) return;
        setSaving(true);
        try {
            const res = await fetch("/api/lorebooks/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lorebookId: lorebook.id })
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            toast.success(data.saved ? "Added to Library" : "Removed from Library");
            onUpdate();
        } catch {
            toast.error("Failed to update library");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent | React.Touch | any) => {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        setShowContextMenu(false);
        if (!(await confirm({
            title: "Archive Deletion",
            message: `Are you sure you want to permanently delete "${lorebook.name}"? This will erase all world logic and semantic entries associated with this module.`,
            confirmLabel: "Delete Module",
            variant: "danger"
        }))) return;

        // Optimistic Update
        const updateFn = (old: any[] | undefined) => {
            if (!old) return old;
            return old.filter(lb => lb.id !== lorebook.id);
        };

        queryClient.setQueriesData({ queryKey: ["lorebooks"] }, updateFn);
        queryClient.setQueriesData({ queryKey: ["all-lorebooks"] }, updateFn);

        try {
            const res = await fetch(`/api/lorebooks/${lorebook.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();
            toast.success("Lorebook deleted");
            queryClient.invalidateQueries({ queryKey: ["lorebooks"] });
            queryClient.invalidateQueries({ queryKey: ["all-lorebooks"] });
        } catch {
            toast.error("Failed to delete lorebook");
            queryClient.invalidateQueries({ queryKey: ["lorebooks"] });
            queryClient.invalidateQueries({ queryKey: ["all-lorebooks"] });
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        longPressTimer.current = setTimeout(() => {
            setContextMenuPos({ x, y });
            setShowContextMenu(true);
            if ("vibrate" in navigator) navigator.vibrate(40);
            longPressTimer.current = null;
        }, 450);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    useEffect(() => {
        const handleClose = () => setShowContextMenu(false);
        if (showContextMenu) {
            window.addEventListener("scroll", handleClose, { passive: true });
            window.addEventListener("click", handleClose);
            window.addEventListener("contextmenu", handleClose);
        }
        return () => {
            window.removeEventListener("scroll", handleClose);
            window.removeEventListener("click", handleClose);
            window.removeEventListener("contextmenu", handleClose);
        };
    }, [showContextMenu]);

    return (
        <Link href={`/lorebooks/${lorebook.id}`} className="h-full block" onClick={handleCardClick}>
            <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                className="group relative bg-white/3 border border-white/10 rounded-3xl overflow-hidden transition-all hover:bg-white/5 hover:border-white/20 hover:shadow-2xl h-full flex flex-col"
            >
                {/* Avatar Image Background with Gradient Overlay */}
                <div className="relative h-48 lg:h-56 overflow-hidden shrink-0">
                    {imageLoading && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                        </div>
                    )}
                    <Image
                        src={`/api/lorebook-image/${lorebook.id}`}
                        alt={lorebook.name}
                        fill
                        className={`object-cover group-hover:scale-110 transition-all duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

                    {/* Fallback Book Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <FiBook className="text-white text-6xl" />
                    </div>

                    {/* Action Button - Top Right */}
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                        {isOwner ? (
                            <button
                                onClick={handleDelete}
                                className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white/60 hover:bg-error/20 hover:text-error transition-all border border-white/10"
                            >
                                <FaTrash size={12} />
                            </button>
                        ) : (
                            <button
                                onClick={handleToggleSave}
                                disabled={saving}
                                className={`p-2.5 rounded-xl backdrop-blur-md transition-all border border-white/10 ${isSaved
                                    ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                    : "bg-black/60 text-white/60 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {saving ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : isSaved ? (
                                    <FaCheck size={12} />
                                ) : (
                                    <FaPlus size={12} />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1 relative gap-4">
                    {/* Title */}
                    <h3 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tight leading-tight group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-14">
                        {lorebook.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/30 text-[10px] lg:text-xs font-bold uppercase tracking-wider line-clamp-2 flex-1">
                        {lorebook.description || "Experimental context module with custom world logic."}
                    </p>

                    <div className="mt-auto space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 pt-3 lg:pt-5 border-t border-white/5">
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] lg:text-[11px] font-black text-white/20 uppercase tracking-widest mb-1">Entries</span>
                                <span className="text-lg lg:text-xl font-black text-white italic">{lorebook._count?.entries || 0}</span>
                            </div>
                            <div className="flex flex-col items-center border-x border-white/5">
                                <span className="text-[9px] lg:text-[11px] font-black text-white/20 uppercase tracking-widest mb-1">Depth</span>
                                <span className="text-lg lg:text-xl font-black text-cyan-400 italic">{lorebook.scanDepth || 4}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] lg:text-[11px] font-black text-white/20 uppercase tracking-widest mb-1">Budget</span>
                                <span className="text-lg lg:text-xl font-black text-white italic">{lorebook.tokenBudget || 512}</span>
                            </div>
                        </div>

                        {/* Recursive Scanning Badge */}
                        {lorebook.recursiveScanning && (
                            <div className="flex items-center justify-center pt-2">
                                <div className="px-3 py-1 lg:px-4 lg:py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                                    <span className="text-[9px] lg:text-[11px] font-black text-cyan-400 uppercase tracking-widest">
                                        ⚡ Recursive
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {lorebook.tags && lorebook.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {lorebook.tags.slice(0, 3).map((tag: any) => (
                                    <span
                                        key={tag.id}
                                        className="px-2 py-1 lg:px-3 lg:py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] lg:text-[11px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 hover:text-cyan-400 transition-colors"
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                                {lorebook.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/30 uppercase">
                                        +{lorebook.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl" />
                </div>
            </motion.div>
            <AnimatePresence>
                {showContextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                        className="fixed z-100 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
                    >
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 flex items-center gap-3 transition-colors"
                        >
                            <FiTrash2 size={14} />
                            Terminate
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </Link>
    );
};

export default LorebookCard;
