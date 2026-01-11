"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import {
    FaPlus,
    FaTrash,
    FaTimes,
    FaToggleOn,
    FaToggleOff,
    FaChevronLeft,
    FaTag,
    FaEdit,
    FaImage
} from "react-icons/fa";
import { FiBookOpen, FiActivity, FiSettings, FiInfo } from "react-icons/fi";
import { toast } from '@/app/lib/toast';
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Select from "react-select";
import Image from "next/image";
import { useAuthAction } from "@/app/hooks/useAuthAction";

interface LorebookDetailProps {
    lorebookId: string;
}

const LorebookDetail: React.FC<LorebookDetailProps> = ({ lorebookId }) => {
    const { user } = useContext(AuthContext);
    const { withAuth, isAuthenticated } = useAuthAction();
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);

    // Metadata Edit States
    const [metaName, setMetaName] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [metaScanDepth, setMetaScanDepth] = useState(4);
    const [metaTokenBudget, setMetaTokenBudget] = useState(512);
    const [metaRecursiveScanning, setMetaRecursiveScanning] = useState(false);
    const [metaSelectedTags, setMetaSelectedTags] = useState<{ label: string; value: string }[]>([]);
    const [metaImage, setMetaImage] = useState<File | null>(null);
    const [metaImagePreview, setMetaImagePreview] = useState<string | null>(null);

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
    });

    const isOwner = user?.id === lorebook?.userId;

    const { data: allTags } = useQuery<any[]>({
        queryKey: ["lorebook-tags"],
        queryFn: async () => {
            const res = await fetch("/api/lorebooks/tags");
            const json = await res.json();
            return json.data || [];
        },
    });

    useEffect(() => {
        if (lorebook) {
            setMetaName(lorebook.name);
            setMetaDescription(lorebook.description || "");
            setMetaScanDepth(lorebook.scanDepth);
            setMetaTokenBudget(lorebook.tokenBudget);
            setMetaRecursiveScanning(lorebook.recursiveScanning);
            setMetaSelectedTags(lorebook.tags?.map((t: any) => ({ label: t.name, value: t.id })) || []);
        }
    }, [lorebook]);

    const handleUpdateMetadata = withAuth(async () => {
        const formData = new FormData();
        formData.append("name", metaName);
        formData.append("description", metaDescription);
        formData.append("scanDepth", metaScanDepth.toString());
        formData.append("tokenBudget", metaTokenBudget.toString());
        formData.append("recursiveScanning", metaRecursiveScanning.toString());
        formData.append("tags", JSON.stringify(metaSelectedTags));
        if (metaImage) {
            formData.append("image", metaImage);
        }

        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}`, {
                method: "PATCH",
                body: formData,
            });

            if (!res.ok) throw new Error();

            toast.success("Metadata updated");
            setIsEditingMetadata(false);
            refetch();
        } catch {
            toast.error("Failed to update metadata");
        }
    });

    const handleAddEntry = withAuth(async () => {
        if (!keywords.trim() || !content.trim()) {
            toast.error("Keywords and content are required");
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const newEntry = {
            id: tempId,
            keywords: keywords.split(",").map(k => k.trim()),
            content,
            enabled,
        };

        // Optimistic Update
        queryClient.setQueryData(["lorebook", lorebookId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                entries: [...(old.entries || []), newEntry],
            };
        });

        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords, content, enabled }),
            });

            if (!res.ok) throw new Error();

            toast.success("Entry added");
            resetForm();
            await queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        } catch {
            toast.error("Failed to add entry");
            queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        }
    });

    const handleUpdateEntry = withAuth(async (entryId: string) => {
        const updatedEntry = {
            id: entryId,
            keywords: keywords.split(",").map(k => k.trim()),
            content,
            enabled,
        };

        // Optimistic Update
        queryClient.setQueryData(["lorebook", lorebookId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                entries: old.entries.map((e: any) => e.id === entryId ? updatedEntry : e),
            };
        });

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
            await queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        } catch {
            toast.error("Failed to update entry");
            queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        }
    });

    const handleDeleteEntry = withAuth(async (entryId: string) => {
        if (!(await confirm({
            title: "Terminate Entry",
            message: "Are you sure you want to delete this knowledge entry? This memory will be permanently removed from the system.",
            confirmLabel: "Delete Entry",
            variant: "danger"
        }))) return;

        // Optimistic Update
        queryClient.setQueryData(["lorebook", lorebookId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                entries: old.entries.filter((e: any) => e.id !== entryId),
            };
        });

        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries/${entryId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();
            toast.success("Entry deleted");
            await queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        } catch {
            toast.error("Failed to delete entry");
            queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        }
    });

    const toggleEntry = withAuth(async (entry: any) => {
        // Optimistic Update
        queryClient.setQueryData(["lorebook", lorebookId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                entries: old.entries.map((e: any) => e.id === entry.id ? { ...e, enabled: !entry.enabled } : e),
            };
        });

        try {
            const res = await fetch(`/api/lorebooks/${lorebookId}/entries/${entry.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !entry.enabled }),
            });

            if (!res.ok) throw new Error();
            await queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        } catch {
            toast.error("Failed to toggle entry");
            queryClient.invalidateQueries({ queryKey: ["lorebook", lorebookId] });
        }
    });

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

    if (isPending)
        return (
            <div className="min-h-screen bg-zinc-950 pt-32 px-6 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Loading Semantic Module...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 pb-20 px-4 sm:px-8 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/2 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/1 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Navigation */}
                <Link
                    href="/lorebooks"
                    className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-10 group"
                >
                    <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Access Local Archive
                </Link>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        {/* Header & Stats Card */}
                        <section className="bg-white/3 border border-white/10 rounded-4xl p-8 sm:p-10 backdrop-blur-3xl">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="w-full md:w-1/4">
                                    <div className="aspect-square relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                                        <Image
                                            src={metaImagePreview || `/api/lorebook-image/${lorebookId}`}
                                            fill
                                            className="object-cover"
                                            alt={lorebook?.name || "Lorebook Image"}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 bg-white/20 rounded-full" />
                                            <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                                                {lorebook?.name}
                                            </h1>
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-sm font-medium leading-relaxed">
                                        {lorebook?.description || "Structural information module for character memory and world consistency."}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {lorebook?.tags?.map((tag: any) => (
                                            <span key={tag.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/60 uppercase tracking-widest">
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-10 border-t border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Scan Depth</p>
                                    <p className="text-xl font-black text-white italic">{lorebook?.scanDepth}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Token Budget</p>
                                    <p className="text-xl font-black text-white italic">{lorebook?.tokenBudget}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Recursive</p>
                                    <p className="text-xl font-black text-white italic">{lorebook?.recursiveScanning ? "ON" : "OFF"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Total Entries</p>
                                    <p className="text-xl font-black text-white italic">{lorebook?.entries?.length || 0}</p>
                                </div>
                            </div>
                        </section>

                        {/* Entry Manager */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <FiBookOpen className="text-white/40" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Knowledge Entries</h3>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => setIsAddingEntry(true)}
                                        className="px-4 py-2 bg-white text-zinc-950 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
                                    >
                                        <FaPlus size={10} /> Add Entry
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {isAddingEntry && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="bg-white/5 border border-white/10 rounded-4xl p-8 backdrop-blur-3xl shadow-2xl"
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
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-white/20 transition-all font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Lore Content</label>
                                                <textarea
                                                    value={content}
                                                    onChange={(e) => setContent(e.target.value)}
                                                    rows={6}
                                                    placeholder="The detailed information about these keywords..."
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-3xl px-6 py-6 text-white placeholder:text-white/10 outline-none focus:border-white/20 resize-none h-48 font-medium leading-relaxed"
                                                />
                                            </div>
                                            <div className="flex justify-between items-center bg-white/5 rounded-2xl px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <FiActivity className="text-white/40" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Status</span>
                                                </div>
                                                <button onClick={() => setEnabled(!enabled)}>
                                                    {enabled ? <FaToggleOn size={28} className="text-white" /> : <FaToggleOff size={28} className="text-white/10" />}
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleAddEntry}
                                                className="w-full py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:bg-zinc-200 transition-all"
                                            >
                                                Archive Entry
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                className="space-y-4"
                                variants={container}
                                initial="hidden"
                                animate="visible"
                            >
                                {lorebook?.entries?.length === 0 && !isAddingEntry && (
                                    <div className="py-20 text-center space-y-4 bg-white/2 border border-dashed border-white/5 rounded-4xl">
                                        <FiBookOpen size={48} className="mx-auto text-white/5" />
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Empty Semantic Archive</p>
                                    </div>
                                )}

                                {lorebook?.entries?.map((entry: any) => (
                                    <motion.div
                                        key={entry.id}
                                        variants={item}
                                        className="group relative bg-white/3 border border-white/10 rounded-4xl p-6 backdrop-blur-3xl hover:bg-white/5 transition-all shadow-lg"
                                    >
                                        {editingEntryId === entry.id ? (
                                            <div className="space-y-6">
                                                <input
                                                    value={keywords}
                                                    onChange={(e) => setKeywords(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/20 font-bold"
                                                />
                                                <textarea
                                                    value={content}
                                                    onChange={(e) => setContent(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-white/20 resize-none font-medium text-sm leading-relaxed"
                                                    rows={4}
                                                />
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={resetForm} className="px-6 py-2.5 bg-white/5 text-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                                                    <button onClick={() => handleUpdateEntry(entry.id)} className="px-6 py-2.5 bg-white text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg">Store Archive</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {entry.keywords.map((kw: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 group-hover:text-white transition-colors">
                                                                <FaTag size={8} /> {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {isOwner && (
                                                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => toggleEntry(entry)} className="p-2 text-white/20 hover:text-white transition-colors">
                                                                {entry.enabled ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                                                            </button>
                                                            <button onClick={() => startEdit(entry)} className="p-2 text-white/20 hover:text-white transition-colors">
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteEntry(entry.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-white/60 text-sm leading-relaxed font-medium ${!entry.enabled && 'opacity-20 italic'}`}>
                                                    {entry.content}
                                                </p>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-white/3 border border-white/10 rounded-4xl p-8 backdrop-blur-3xl space-y-8 lg:sticky lg:top-32">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FiSettings className="text-white/40" />
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Module Config</h3>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                                        className={`p-2 rounded-xl transition-all ${isEditingMetadata ? 'bg-white text-zinc-950 shadow-xl' : 'bg-white/5 text-white/20 hover:text-white'}`}
                                    >
                                        <FaEdit size={14} />
                                    </button>
                                )}
                            </div>

                            {!isEditingMetadata ? (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                                            <span className="text-zinc-600">Scan Intensity</span>
                                            <span className="text-white">{lorebook?.scanDepth}/10</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white transition-all shadow-xl" style={{ width: `${(lorebook?.scanDepth / 10) * 100}%` }} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                                            <span className="text-zinc-600">Memory Budget</span>
                                            <span className="text-white">{lorebook?.tokenBudget} TKN</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white transition-all shadow-xl" style={{ width: `${(lorebook?.tokenBudget / 2048) * 100}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-4 border-t border-white/5">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Recursive</p>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${lorebook?.recursiveScanning ? 'text-white' : 'text-zinc-800'}`}>
                                            {lorebook?.recursiveScanning ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>

                                    <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FiInfo className="text-white/20" size={12} />
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Archive Usage</p>
                                        </div>
                                        <p className="text-[10px] text-zinc-600 font-bold leading-relaxed uppercase tracking-tighter">
                                            This module is globally available for integration into character intelligence matrices.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="relative aspect-square rounded-4xl overflow-hidden border border-white/10 bg-white/5 group mb-6 mx-auto w-3/4">
                                        <Image src={metaImagePreview || `/api/lorebook-image/${lorebookId}`} fill className="object-cover" alt="Preview" />
                                        <input
                                            type="file"
                                            id="meta-image-upload"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setMetaImage(file);
                                                    setMetaImagePreview(URL.createObjectURL(file));
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <label htmlFor="meta-image-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
                                            <FaImage className="text-white text-2xl mb-2" />
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Update Visual</span>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Name</label>
                                            <input
                                                value={metaName}
                                                onChange={(e) => setMetaName(e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-white/20 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Description</label>
                                            <textarea
                                                value={metaDescription}
                                                onChange={(e) => setMetaDescription(e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-white/20 font-medium h-24 resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tags</label>
                                            <Select
                                                placeholder="Tags"
                                                isMulti
                                                options={allTags?.map((tag) => ({ label: tag.name, value: tag.id })) || []}
                                                value={metaSelectedTags}
                                                onChange={(options) => setMetaSelectedTags([...options])}
                                                classNamePrefix="select"
                                                styles={{
                                                    control: (styles) => ({
                                                        ...styles,
                                                        backgroundColor: "rgba(0,0,0,0.2)",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        borderRadius: "12px",
                                                        fontSize: "12px",
                                                    }),
                                                    menu: (styles) => ({ ...styles, backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", zIndex: 9999 }),
                                                    option: (styles, { isFocused }) => ({ ...styles, backgroundColor: isFocused ? "rgba(255,255,255,0.05)" : "transparent", fontSize: "12px" }),
                                                    multiValue: (styles) => ({ ...styles, backgroundColor: "rgba(255,255,255,0.05)" }),
                                                    multiValueLabel: (styles) => ({ ...styles, color: "white", fontSize: "10px", fontWeight: "bold" }),
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between">
                                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Scan Depth</label>
                                                <span className="text-xs font-black text-white italic">{metaScanDepth}</span>
                                            </div>
                                            <input type="range" min="1" max="10" value={metaScanDepth} onChange={(e) => setMetaScanDepth(parseInt(e.target.value))} className="w-full accent-white h-1 bg-white/5 rounded-full appearance-none cursor-pointer" />
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between">
                                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Memory Budget</label>
                                                <span className="text-xs font-black text-white italic">{metaTokenBudget}</span>
                                            </div>
                                            <input type="range" min="128" max="2048" step="128" value={metaTokenBudget} onChange={(e) => setMetaTokenBudget(parseInt(e.target.value))} className="w-full accent-white h-1 bg-white/5 rounded-full appearance-none cursor-pointer" />
                                        </div>

                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Recursive</p>
                                            <button onClick={() => setMetaRecursiveScanning(!metaRecursiveScanning)} className={`relative w-10 h-5 rounded-full transition-all ${metaRecursiveScanning ? 'bg-white' : 'bg-white/10'}`}>
                                                <motion.div animate={{ x: metaRecursiveScanning ? 22 : 2 }} className={`absolute top-1 w-3 h-3 rounded-full ${metaRecursiveScanning ? 'bg-zinc-950' : 'bg-white/20'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button onClick={() => setIsEditingMetadata(false)} className="flex-1 py-3 bg-white/5 text-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">Discard</button>
                                        <button onClick={handleUpdateMetadata} className="flex-1 py-3 bg-white text-zinc-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 shadow-xl transition-all">Save Config</button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LorebookDetail;
