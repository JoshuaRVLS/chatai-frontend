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

    const { isPending, data, error, refetch } = useQuery<any[]>({
        queryKey: ["lorebooks"],
        queryFn: async () => {
            const res = await fetch(`/api/lorebooks`);
            const json = await res.json();
            return json.data;
        },
        enabled: !!user?.id,
    });

    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    if (isPending)
        return (
            <div className="min-h-screen pt-24 px-6 bg-[#09090b]">
                <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
                    <div className="h-8 bg-white/5 rounded-xl w-32" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-40 bg-white/5 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen pt-24 bg-[#09090b] flex items-center justify-center text-center">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Archival Failure: {error.message}</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#09090b] pt-24 pb-16 px-4 sm:px-8 relative overflow-hidden">
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
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
                    variants={item}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 bg-white/10 rounded-full" />
                            <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tight uppercase leading-none">
                                My Lorebooks
                            </h1>
                        </div>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-3 leading-none">
                            Knowledge Base • {data?.length || 0} Modules Indexed
                        </p>
                    </div>

                    <Link href="/create_lorebook">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl"
                        >
                            <FaPlus size={10} /> Create Module
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={container}
                >
                    {data && data.length > 0 ? (
                        data.map((lb: any) => (
                            <motion.div key={lb.id} variants={item}>
                                <LorebookCard lorebook={lb} onUpdate={refetch} />
                            </motion.div>
                        ))
                    ) : (
                        <motion.div variants={item} className="col-span-full text-center py-20">
                            <div className="space-y-4">
                                <div className="w-20 h-20 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                                    <FaPlus className="text-zinc-800 text-3xl" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">No Modules Found</h3>
                                    <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest mt-2">
                                        Create a lorebook to define languages, locations, and history for your entities.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Info Section */}
                {data && data.length === 0 && (
                    <motion.div variants={item} className="mt-16 max-w-3xl mx-auto">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">About Lorebooks</h4>
                                <p className="text-white/40 text-xs leading-relaxed font-medium">
                                    Lorebooks enable persistent world-state across different characters. By defining entries with triggers (keywords), you ensure the AI only accesses information when it becomes relevant to the current conversation focus.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default Lorebooks;
