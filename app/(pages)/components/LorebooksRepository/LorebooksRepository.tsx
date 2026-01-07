"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiBook, FiFilter, FiX, FiBookOpen } from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

interface Lorebook {
    id: string;
    name: string;
    description: string | null;
    _count: {
        entries: number;
    };
    user: {
        username: string;
    };
    createdAt: string;
}

const LorebooksRepository = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [minEntries, setMinEntries] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const { data: lorebooks, isPending, error } = useQuery<Lorebook[]>({
        queryKey: ["all-lorebooks"],
        queryFn: async () => {
            const res = await fetch("/api/lorebooks/all");
            if (!res.ok) throw new Error("Failed to fetch lorebooks");
            const json = await res.json();
            return json.data;
        },
    });

    // Filter lorebooks
    const filteredLorebooks = useMemo(() => {
        if (!lorebooks) return [];

        return lorebooks.filter((lb) => {
            const matchesSearch =
                searchQuery === "" ||
                lb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lb.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lb.user.username.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesMinEntries = lb._count.entries >= minEntries;

            return matchesSearch && matchesMinEntries;
        });
    }, [lorebooks, searchQuery, minEntries]);

    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#09090b] pt-32 flex items-center justify-center">
                <p className="text-red-400 text-sm">Error loading lorebooks</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] pt-24 pb-20 px-4 sm:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/2 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-white/1 blur-[80px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-1 h-12 bg-white/10 rounded-full" />
                        <div>
                            <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tight uppercase leading-none">
                                Lorebook Repository
                            </h1>
                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-2">
                                Discover Community Knowledge Bases • {filteredLorebooks.length} Available
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12 space-y-4"
                >
                    {/* Search Bar */}
                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, description, or author..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <FiX className="text-white/40 hover:text-white" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all border ${showFilters || minEntries > 0
                                ? "bg-white text-zinc-950 border-white"
                                : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                                }`}
                        >
                            <FiFilter size={14} />
                            Filters
                        </button>
                    </div>

                    {/* Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">
                                            Minimum Entries: {minEntries}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={minEntries}
                                            onChange={(e) => setMinEntries(parseInt(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">
                                            <span>0</span>
                                            <span>50+</span>
                                        </div>
                                    </div>

                                    {minEntries > 0 && (
                                        <button
                                            onClick={() => setMinEntries(0)}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                        >
                                            Reset Filters
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Loading State */}
                {isPending && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-56 bg-white/5 rounded-2xl animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {/* Lorebooks Grid */}
                {!isPending && (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredLorebooks.length > 0 ? (
                            filteredLorebooks.map((lorebook) => (
                                <motion.div key={lorebook.id} variants={item}>
                                    <Link href={`/lorebooks/${lorebook.id}`}>
                                        <div className="group relative bg-white/3 border border-white/10 rounded-3xl overflow-hidden transition-all hover:bg-white/5 hover:border-white/20 hover:-translate-y-2 hover:shadow-2xl">
                                            {/* Avatar Background with Gradient */}
                                            <div className="relative h-40 overflow-hidden">
                                                <img
                                                    src={`/api/lorebook-image/${lorebook.id}`}
                                                    alt={lorebook.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

                                                {/* Fallback Icon */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                    <FiBook className="text-white text-5xl" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 space-y-4">
                                                {/* Title */}
                                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-[3rem]">
                                                    {lorebook.name}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider line-clamp-2 min-h-[2.5rem]">
                                                    {lorebook.description || "No description available"}
                                                </p>

                                                {/* Stats */}
                                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                                            Entries
                                                        </span>
                                                        <span className="text-lg font-black text-white italic">
                                                            {lorebook._count.entries}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                                            Author
                                                        </span>
                                                        <span className="text-xs font-black text-cyan-400">
                                                            @{lorebook.user.username}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hover Glow */}
                                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                variants={item}
                                className="col-span-full py-20 text-center"
                            >
                                <div className="max-w-md mx-auto space-y-6">
                                    <div className="w-20 h-20 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                                        <FiBookOpen className="text-zinc-800 text-4xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">
                                            No Lorebooks Found
                                        </h3>
                                        <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                            {searchQuery
                                                ? "Try adjusting your search or filters"
                                                : "Be the first to create a lorebook!"}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default LorebooksRepository;
