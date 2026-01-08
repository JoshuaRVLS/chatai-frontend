"use client";

import React from "react";
import { motion } from "motion/react";
import { FaTrash } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import Link from "next/link";
import { toast } from '@/app/lib/toast';
import Image from "next/image";

interface LorebookCardProps {
    lorebook: any;
    onUpdate: () => void;
}

const LorebookCard: React.FC<LorebookCardProps> = ({ lorebook, onUpdate }) => {
    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm("Are you sure you want to delete this lorebook and all its entries?")) return;

        try {
            const res = await fetch(`/api/lorebooks/${lorebook.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();
            toast.success("Lorebook deleted");
            onUpdate();
        } catch {
            toast.error("Failed to delete lorebook");
        }
    };

    return (
        <Link href={`/lorebooks/${lorebook.id}`}>
            <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative bg-white/3 border border-white/10 rounded-3xl overflow-hidden transition-all hover:bg-white/5 hover:border-white/20 hover:shadow-2xl"
            >
                {/* Avatar Image Background with Gradient Overlay */}
                <div className="relative h-48 lg:h-56 overflow-hidden">
                    <Image
                        src={`/api/lorebook-image/${lorebook.id}`}
                        alt={lorebook.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e: any) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

                    {/* Fallback Book Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <FiBook className="text-white text-6xl" />
                    </div>

                    {/* Delete Button - Top Right */}
                    <button
                        onClick={handleDelete}
                        className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/40 backdrop-blur-md text-white/60 hover:bg-error/20 hover:text-error transition-all border border-white/10 z-10"
                    >
                        <FaTrash size={12} />
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4 relative">
                    {/* Title */}
                    <h3 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tight leading-tight group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-14 lg:min-h-16">
                        {lorebook.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/30 text-[10px] lg:text-xs font-bold uppercase tracking-wider line-clamp-2 min-h-10 lg:min-h-12">
                        {lorebook.description || "Experimental context module with custom world logic."}
                    </p>

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

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl" />
                </div>
            </motion.div>
        </Link>
    );
};

export default LorebookCard;
