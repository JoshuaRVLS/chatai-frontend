"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { motion, AnimatePresence } from "motion/react";
import { FaPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import LorebookCard from "./LorebookCard";
import Select from "react-select";
import { FiUpload, FiImage } from "react-icons/fi";
import Image from "next/image";

const Lorebooks: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [scanDepth, setScanDepth] = useState(4);
    const [tokenBudget, setTokenBudget] = useState(512);
    const [recursiveScanning, setRecursiveScanning] = useState(false);
    const [selectedTags, setSelectedTags] = useState<{ label: string; value: string }[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { isPending, data, error, refetch } = useQuery<any[]>({
        queryKey: ["lorebooks"],
        queryFn: async () => {
            const res = await fetch(`/api/lorebooks`);
            const json = await res.json();
            return json.data;
        },
        enabled: !!user?.id,
    });

    const { data: allTags } = useQuery<any[]>({
        queryKey: ["lorebook-tags"],
        queryFn: async () => {
            const res = await fetch("/api/lorebooks/tags");
            const json = await res.json();
            return json.data || [];
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please provide a name for the lorebook");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("scanDepth", scanDepth.toString());
            formData.append("tokenBudget", tokenBudget.toString());
            formData.append("recursiveScanning", recursiveScanning.toString());
            formData.append("tags", JSON.stringify(selectedTags));
            if (image) {
                formData.append("image", image);
            }

            const res = await fetch(`/api/lorebooks`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) return toast.error("Failed to create lorebook");

            toast.success("Lorebook created successfully!");
            setName("");
            setDescription("");
            setScanDepth(4);
            setTokenBudget(512);
            setRecursiveScanning(false);
            setSelectedTags([]);
            setImage(null);
            setImagePreview(null);
            setIsCreating(false);
            await refetch();
        } catch {
            toast.error("Error creating lorebook");
        }
    };

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
                                Lorebooks
                            </h1>
                        </div>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-3 leading-none">
                            Knowledge Base • {data?.length || 0} Modules Indexed
                        </p>
                    </div>

                    {!isCreating && (
                        <motion.button
                            onClick={() => setIsCreating(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl"
                        >
                            <FaPlus size={10} /> Create Module
                        </motion.button>
                    )}
                </motion.div>

                {/* Form Section */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.98 }}
                            className="max-w-4xl mx-auto mb-16"
                        >
                            <div className="bg-white/1 rounded-2xl p-8 border border-white/5 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">
                                            Constructing...
                                        </h3>
                                        <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Protocol L-01 Engaged</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all border border-white/5"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Image Upload Column */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Avatar</label>
                                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5 group cursor-pointer">
                                            {imagePreview ? (
                                                <Image src={imagePreview} fill className="object-cover" alt="Preview" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FiImage className="text-white/10 text-4xl" />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                id="lorebook-image"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="lorebook-image"
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                                            >
                                                <FiUpload className="text-white text-2xl mb-2" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Form Fields Column */}
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Name</label>
                                            <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Fantasy World Lore"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Description</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="What is this lorebook about?"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all text-sm h-24 resize-none font-medium"
                                            />
                                        </div>

                                        {/* Tags */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Tags</label>
                                            <Select
                                                placeholder="Select tags..."
                                                isMulti
                                                options={allTags?.map((tag) => ({ label: tag.name, value: tag.id })) || []}
                                                value={selectedTags}
                                                onChange={(options) => setSelectedTags([...options])}
                                                classNamePrefix="select"
                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                menuPosition="fixed"
                                                styles={{
                                                    control: (styles, { isFocused }) => ({
                                                        ...styles,
                                                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                        border: isFocused ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                                                        borderRadius: "12px",
                                                        padding: "4px",
                                                        boxShadow: "none",
                                                    }),
                                                    input: (styles) => ({ ...styles, color: "white" }),
                                                    placeholder: (styles) => ({ ...styles, color: "rgba(255, 255, 255, 0.2)", fontSize: "13px" }),
                                                    multiValue: (styles) => ({
                                                        ...styles,
                                                        backgroundColor: "rgba(56, 189, 248, 0.1)",
                                                        borderRadius: "8px",
                                                        border: "1px solid rgba(56, 189, 248, 0.3)",
                                                    }),
                                                    multiValueLabel: (styles) => ({
                                                        ...styles,
                                                        color: "#38bdf8",
                                                        fontSize: "11px",
                                                        fontWeight: "800",
                                                        textTransform: "uppercase",
                                                    }),
                                                    multiValueRemove: (styles) => ({
                                                        ...styles,
                                                        color: "#38bdf8",
                                                        ":hover": { backgroundColor: "rgba(56, 189, 248, 0.2)", color: "white" },
                                                    }),
                                                    menu: (styles) => ({
                                                        ...styles,
                                                        backgroundColor: "#0f172a",
                                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                                        borderRadius: "16px",
                                                        zIndex: 9999,
                                                    }),
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    option: (styles, { isFocused, isSelected }) => ({
                                                        ...styles,
                                                        backgroundColor: isSelected ? "#38bdf8" : isFocused ? "rgba(255, 255, 255, 0.08)" : "transparent",
                                                        color: isSelected ? "#0f172a" : "white",
                                                        fontSize: "13px",
                                                        cursor: "pointer",
                                                    }),
                                                }}
                                            />
                                        </div>

                                        {/* Scan Depth */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                                Scan Depth: {scanDepth}
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={scanDepth}
                                                onChange={(e) => setScanDepth(parseInt(e.target.value))}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between text-[9px] text-white/20 font-bold uppercase">
                                                <span>1 (Shallow)</span>
                                                <span>10 (Deep)</span>
                                            </div>
                                        </div>

                                        {/* Token Budget */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                                Token Budget: {tokenBudget}
                                            </label>
                                            <input
                                                type="range"
                                                min="128"
                                                max="2048"
                                                step="128"
                                                value={tokenBudget}
                                                onChange={(e) => setTokenBudget(parseInt(e.target.value))}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between text-[9px] text-white/20 font-bold uppercase">
                                                <span>128</span>
                                                <span>2048</span>
                                            </div>
                                        </div>

                                        {/* Recursive Scanning */}
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Recursive Scanning</p>
                                                <p className="text-[9px] text-white/30 font-bold uppercase mt-1">Enable deep context scanning</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setRecursiveScanning(!recursiveScanning)}
                                                className={`relative w-12 h-6 rounded-full transition-all ${recursiveScanning ? "bg-primary" : "bg-white/10"
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: recursiveScanning ? 26 : 2 }}
                                                    className={`absolute top-1 w-4 h-4 rounded-full ${recursiveScanning ? "bg-white" : "bg-white/20"
                                                        }`}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 justify-end mt-8 pt-6 border-t border-white/5">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="px-6 py-2.5 bg-white/5 text-zinc-500 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-lg"
                                    >
                                        Save Module
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
