"use client";

import React from "react";
import { motion } from "motion/react";
import { FaTrash, FaPlus, FaCheck } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import Link from "next/link";
import { toast } from '@/app/lib/toast';
import { useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { useState } from "react";
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
    const [imageLoading, setImageLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isOwner = currentUserId && lorebook.userId === currentUserId;
    const isSaved = lorebook.isSaved;

    const handleCardClick = (e: React.MouseEvent) => {
        if (!currentUserId && !lorebook.recursiveScanning) {
            // Logic check
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
        if (e.stopPropagation) e.stopPropagation();
        if (!(await confirm({
            title: "Archive Deletion",
            message: `Are you sure you want to permanently delete "${lorebook.name}"?`,
            confirmLabel: "Delete",
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



    return (
        <Link href={`/lorebooks/${lorebook.id}`} className="h-full block" onClick={handleCardClick}>
            <motion.div
                whileHover={{ y: -2 }}
                className="group relative bg-surface border border-border-default rounded-2xl overflow-hidden transition-all hover:border-border-hover h-full flex flex-col"
            >
                {/* Image Section - Reduced Height */}
                <div className="relative h-32 shrink-0 bg-surface-hover">
                    {imageLoading && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                            <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                        </div>
                    )}
                    <Image
                        src={`/api/lorebook-image/${lorebook.id}`}
                        alt={lorebook.name}
                        fill
                        className={`object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transition: 'opacity 0.3s' }}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                    {/* Action Button - Top Right (Compact) */}
                    <div className="absolute top-2 right-2 z-10">
                        {isOwner ? (
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded-lg bg-surface-hover text-text-muted hover:bg-red-500/20 hover:text-red-500 transition-colors border border-border-default"
                            >
                                <FaTrash size={10} />
                            </button>
                        ) : (
                            <button
                                onClick={handleToggleSave}
                                disabled={saving}
                                className={`p-2 rounded-lg border transition-colors ${isSaved
                                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                    : "bg-surface-hover text-text-muted border-border-default hover:text-text-primary"
                                    }`}
                            >
                                {saving ? (
                                    <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : isSaved ? (
                                    <FaCheck size={10} />
                                ) : (
                                    <FaPlus size={10} />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Section - Compact */}
                <div className="p-4 flex flex-col flex-1 relative gap-2">
                    {/* Title */}
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {lorebook.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/40 text-[10px] line-clamp-2 leading-relaxed flex-1">
                        {lorebook.description || "Experimental context module."}
                    </p>

                    {/* Compact Footer Stats */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-medium text-white/30 uppercase tracking-wide">
                        <div className="flex items-center gap-3">
                            <span>{lorebook._count?.entries || 0} Entries</span>
                            <span>{lorebook.tokenBudget || 0} Tokens</span>
                        </div>
                        {lorebook.recursiveScanning && (
                            <span className="text-cyan-500/60">Recursive</span>
                        )}
                    </div>
                </div>
            </motion.div>


        </Link>
    );
};

export default LorebookCard;
