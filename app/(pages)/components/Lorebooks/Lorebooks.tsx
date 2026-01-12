"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { motion } from "motion/react";
import { FaPlus } from "react-icons/fa";
import LorebookCard from "./LorebookCard";
import Link from "next/link";

const Lorebooks: React.FC = () => {
    const { user } = useContext(AuthContext);
    // If no user, default to discover
    const [filter, setFilter] = React.useState<"library" | "discover">(user ? "library" : "discover");
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");

    // Sync filter if user changes (e.g. login)
    React.useEffect(() => {
        if (!user && filter === 'library') setFilter('discover');
    }, [user, filter]);

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { isPending, data, error, refetch } = useQuery<any[]>({
        queryKey: ["lorebooks", filter, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("filter", filter);
            if (debouncedSearch) params.set("q", debouncedSearch);

            const res = await fetch(`/api/lorebooks?${params.toString()}`);
            const json = await res.json();
            return json.data;
        },
        // Enable always
    });

    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <div className="min-h-screen bg-[#09090b] pt-36 pb-16 px-4 sm:px-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/2 blur-[100px]" />
            </div>

            <motion.div
                className="max-w-6xl mx-auto relative z-10"
                initial="hidden"
                animate="visible"
                variants={container}
            >
                {/* Header Section */}
                <motion.div
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
                    variants={item}
                >
                    <div className="space-y-4 w-full md:w-auto">
                        <div className="space-y-1">
                            <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tight uppercase leading-none">
                                {filter === 'library' ? 'My Library' : 'Discovery'}
                            </h1>
                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-1 leading-none">
                                {filter === 'library' ? 'Managed Modules' : 'Public Database'} • {data?.length || 0} Found
                            </p>
                        </div>

                        {/* Tabs - Hide navigation for guests, they are locked to Discovery */}
                        {user && (
                            <div className="flex bg-white/5 p-1 rounded-xl w-fit border border-white/5">
                                <button
                                    onClick={() => setFilter("library")}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'library' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    Library
                                </button>
                                <button
                                    onClick={() => setFilter("discover")}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'discover' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    Discovery
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="SEARCH MODULES..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-zinc-900/50 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-lg w-full md:w-64 focus:outline-none focus:border-white/30 transition-colors uppercase placeholder:text-zinc-700"
                        />
                        {user && (
                            <Link href="/create_lorebook">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl whitespace-nowrap h-full"
                                >
                                    <FaPlus size={10} /> Create
                                </motion.button>
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={container}
                >
                    {isPending ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
                        ))
                    ) : data && data.length > 0 ? (
                        data.map((lb: any) => (
                            <motion.div key={lb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
                                <LorebookCard lorebook={lb} onUpdate={refetch} currentUserId={user?.id} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="w-20 h-20 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                                    <FaPlus className="text-white/20 text-3xl" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">No Modules Found</h3>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">
                                        {filter === 'library' ? "You haven't saved or created any lorebooks yet." : "No public lorebooks found."}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Lorebooks;
