"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { FaPlus, FaSave, FaTrash, FaTimes, FaToggleOn, FaToggleOff, FaChevronLeft, FaTag, FaEdit } from "react-icons/fa";
import { FiBookOpen, FiActivity } from "react-icons/fi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

interface LorebookDetailProps {
    lorebookId: string;
}

const LorebookDetail: React.FC<LorebookDetailProps> = ({ lorebookId }) => {
    const { user } = useContext(AuthContext);
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

    // Form states for new/edit entry
    const [keywords, setKeywords] = useState("");
    const [content, setContent] = useState("");
    const [enabled, setEnabled] = useState(true);

    const { isPending, data: lorebook, error, refetch } = useQuery<any>({
        queryKey: ["lorebook", lorebookId],
        queryFn: async () => {
            const res = await fetch(`/api/lorebooks/${lorebookId}`);
            const json = await res.json();
            return json.data;
        },
        enabled: !!user?.id,
    });

    const handleAddEntry = async () => {
        if (!keywords.trim() || !content.trim()) {
            toast.error("Keywords and content are required");
            return;
        }

        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords, content, enabled }),
            });

            if (!res.ok) throw new Error();

            toast.success("Entry added");
            resetForm();
            refetch();
        } catch {
            toast.error("Failed to add entry");
        }
    };

    const handleUpdateEntry = async (entryId: string) => {
        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries/${entryId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords, content, enabled }),
            });

            if (!res.ok) throw new Error();

            toast.success("Entry updated");
            setEditingEntryId(null);
            resetForm();
            refetch();
        } catch {
            toast.error("Failed to update entry");
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Delete this entry?")) return;
        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries/${entryId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();
            toast.success("Entry deleted");
            refetch();
        } catch {
            toast.error("Failed to delete entry");
        }
    };

    const toggleEntry = async (entry: any) => {
        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries/${entry.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !entry.enabled }),
            });

            if (!res.ok) throw new Error();
            refetch();
        } catch {
            toast.error("Failed to toggle entry");
        }
    };

    const resetForm = () => {
        setKeywords("");
        setContent("");
        setEnabled(true);
        setIsAddingEntry(false);
    };

    const startEdit = (entry: any) => {
        setEditingEntryId(entry.id);
        setKeywords(entry.keywords.join(", "));
        setContent(entry.content);
        setEnabled(entry.enabled);
    };

    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
    };

    if (isPending) return <div className="min-h-screen pt-32 bg-[#020617] animate-pulse" />;

    return (
        <div className="min-h-screen bg-[#020617] pt-24 pb-20 px-4 sm:px-8 relative overflow-hidden">
            {/* Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-cyan-500/5 blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] bg-indigo-500/5 blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Navigation */}
                <Link
                    href="/lorebooks"
                    className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-10 group"
                >
                    <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Access Archive
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                    <div className="space-y-4">
                        <h1 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                            {lorebook?.name}
                        </h1>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
                            {lorebook?.description || "Structural information module for character memory and world consistency."}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddingEntry(true)}
                        className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                        <FaPlus /> New Entry
                    </button>
                </div>

                {/* Entry Manager */}
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence>
                        {isAddingEntry && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Inject World Info</h3>
                                    <button onClick={resetForm} className="text-white/20 hover:text-white"><FaTimes size={18} /></button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Keywords (comma separated)</label>
                                        <input
                                            value={keywords}
                                            onChange={(e) => setKeywords(e.target.value)}
                                            placeholder="e.g. Aethelgard, Capital, King"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Lore Content</label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={6}
                                            placeholder="The detailed information about these keywords..."
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/10 outline-none focus:border-cyan-500/50 resize-none h-48"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 rounded-2xl px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <FiActivity className="text-cyan-400" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Status</span>
                                        </div>
                                        <button onClick={() => setEnabled(!enabled)}>
                                            {enabled ? <FaToggleOn size={28} className="text-cyan-400" /> : <FaToggleOff size={28} className="text-white/20" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddEntry}
                                        className="w-full py-5 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:opacity-90 transition-all"
                                    >
                                        Confirm Injection
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Entries List */}
                    <motion.div
                        className="space-y-4"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                    >
                        {lorebook?.entries?.length === 0 && !isAddingEntry && (
                            <div className="py-20 text-center space-y-4 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[3rem]">
                                <FiBookOpen size={48} className="mx-auto text-white/10" />
                                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Empty Semantic Archive</p>
                                <button
                                    onClick={() => setIsAddingEntry(true)}
                                    className="text-cyan-400 text-[11px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Click to initialize first entry
                                </button>
                            </div>
                        )}

                        {lorebook?.entries?.map((entry: any) => (
                            <motion.div
                                key={entry.id}
                                variants={item}
                                className="group relative bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-3xl hover:bg-white/[0.05] transition-all"
                            >
                                {editingEntryId === entry.id ? (
                                    <div className="space-y-6">
                                        <input
                                            value={keywords}
                                            onChange={(e) => setKeywords(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50"
                                        />
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-cyan-500/50 resize-none"
                                            rows={4}
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button onClick={resetForm} className="px-6 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                            <button onClick={() => handleUpdateEntry(entry.id)} className="px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">Store Data</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {entry.keywords.map((kw: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                                                        <FaTag size={8} /> {kw}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => toggleEntry(entry)} className="p-2 text-white/20 hover:text-cyan-400 transition-colors">
                                                    {entry.enabled ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                                                </button>
                                                <button onClick={() => startEdit(entry)} className="p-2 text-white/20 hover:text-white transition-colors">
                                                    <FaEdit size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteEntry(entry.id)} className="p-2 text-white/20 hover:text-error transition-colors">
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-white/60 text-sm leading-relaxed ${!entry.enabled && 'opacity-30'}`}>
                                            {entry.content}
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LorebookDetail;
