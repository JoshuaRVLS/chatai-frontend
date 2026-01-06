"use client";

import React from "react";
import { motion } from "motion/react";
import { FaTrash, FaEdit, FaChevronRight } from "react-icons/fa";
import { FiBook } from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

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
                className="group relative bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/20"
            >
                {/* Abstract Background bits */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-cyan-500/10 transition-colors" />

                <div className="relative z-10 space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5 transition-all duration-500">
                            <FiBook className="text-white/20 text-2xl group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <button
                            onClick={handleDelete}
                            className="p-3 rounded-xl bg-white/5 text-white/10 hover:bg-error/10 hover:text-error transition-all border border-white/5"
                        >
                            <FaTrash size={12} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white italic truncate tracking-tight uppercase group-hover:text-cyan-400 transition-colors">
                            {lorebook.name}
                        </h3>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] line-clamp-2 min-h-[3em]">
                            {lorebook.description || "Experimental context module with custom world logic."}
                        </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Logic Density</span>
                            <span className="text-xs font-black text-white italic">{lorebook._count?.entries || 0} Entries</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            Configure <FaChevronRight size={10} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default LorebookCard;
