"use client";

import React, { FormEvent, useContext, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from '@/app/lib/toast';
import { AuthContext } from "../providers/AuthProvider";
import {
    FiUpload,
    FiImage,
    FiType,
    FiInfo,
    FiBook,
    FiPlus,
    FiZap
} from "react-icons/fi";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";

const CreateLorebookPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const router = useRouter();

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [scanDepth, setScanDepth] = useState(4);
    const [tokenBudget, setTokenBudget] = useState(512);
    const [recursiveScanning, setRecursiveScanning] = useState(false);
    const [selectedTags, setSelectedTags] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please provide a name for the lorebook");
            return;
        }

        setLoading(true);
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

        try {
            const res = await fetch(`/api/lorebooks`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to create lorebook");

            toast.success("Lorebook module archived successfully");
            router.push("/lorebooks");
        } catch (err) {
            console.error(err);
            toast.error("Failed to create lorebook");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pt-28 pb-20 px-6 sm:px-12 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/2 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/1 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                            <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                                New Lorebook
                            </h1>
                        </div>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
                            Semantic Archive • World State Protocol L-01
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Identity & Visual */}
                        <section className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
                            <div className="flex items-center gap-3 mb-2">
                                <FiInfo className="text-white/40" />
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Core Specifications</h3>
                            </div>

                            <div className="flex flex-col md:flex-row gap-10">
                                <div className="w-full md:w-1/3 space-y-4">
                                    <div className="relative aspect-square rounded-4xl overflow-hidden border border-white/5 bg-white/5 group">
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
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                                        >
                                            <FiUpload className="text-white text-2xl mb-2" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload Module Icon</span>
                                        </label>
                                    </div>
                                    <p className="text-[9px] text-white/20 uppercase tracking-wider text-center px-4 font-bold leading-relaxed">
                                        Support for JPG, PNG. Visual metadata for easy archival recognition.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Archive Name</label>
                                        <div className="relative group">
                                            <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold"
                                                placeholder="e.g. Aethelgard World History..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Structural Description</label>
                                        <textarea
                                            required
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/5 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm h-32 resize-none scrollbar-hide font-medium leading-relaxed"
                                            placeholder="Overview of the context contained within this module..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Configuration */}
                        <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl space-y-8">
                            <div className="flex items-center gap-3 mb-2">
                                <FiZap className="text-white/40" />
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Operational Configuration</h3>
                            </div>

                            <div className="space-y-10">
                                {/* Tags */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Indexing Tags</label>
                                    <Select
                                        placeholder="Archival classification..."
                                        isMulti
                                        options={allTags?.map((tag) => ({ label: tag.name, value: tag.id })) || []}
                                        value={selectedTags}
                                        onChange={(options) => setSelectedTags([...options])}
                                        classNamePrefix="select"
                                        styles={{
                                            control: (styles, { isFocused }) => ({
                                                ...styles,
                                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                border: isFocused ? "1px solid rgba(34, 211, 238, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                                                borderRadius: "16px",
                                                padding: "4px",
                                                boxShadow: "none",
                                            }),
                                            input: (styles) => ({ ...styles, color: "white" }),
                                            placeholder: (styles) => ({ ...styles, color: "rgba(255, 255, 255, 0.2)", fontSize: "13px" }),
                                            multiValue: (styles) => ({
                                                ...styles,
                                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                            }),
                                            multiValueLabel: (styles) => ({
                                                ...styles,
                                                color: "white",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                textTransform: "uppercase",
                                            }),
                                            multiValueRemove: (styles) => ({
                                                ...styles,
                                                color: "white/40",
                                                ":hover": { backgroundColor: "rgba(255, 255, 255, 0.1)", color: "white" },
                                            }),
                                            menu: (styles) => ({
                                                ...styles,
                                                backgroundColor: "#09090b",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                borderRadius: "16px",
                                                zIndex: 9999,
                                            }),
                                            option: (styles, { isFocused, isSelected }) => ({
                                                ...styles,
                                                backgroundColor: isSelected ? "white" : isFocused ? "rgba(255, 255, 255, 0.05)" : "transparent",
                                                color: isSelected ? "#09090b" : "white",
                                                fontSize: "13px",
                                                cursor: "pointer",
                                                fontWeight: "bold",
                                            }),
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Scan Depth */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Scan Depth</label>
                                            <span className="text-xl font-black text-white italic">{scanDepth}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={scanDepth}
                                            onChange={(e) => setScanDepth(parseInt(e.target.value))}
                                            className="w-full accent-white h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                        />
                                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-right">Archival Search Intensity</p>
                                    </div>

                                    {/* Token Budget */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Token Budget</label>
                                            <span className="text-xl font-black text-white italic">{tokenBudget}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="128"
                                            max="2048"
                                            step="128"
                                            value={tokenBudget}
                                            onChange={(e) => setTokenBudget(parseInt(e.target.value))}
                                            className="w-full accent-white h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                        />
                                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-right">Semantic Memory Allocation</p>
                                    </div>
                                </div>

                                {/* Recursive Scanning */}
                                <div className="flex items-center justify-between p-6 bg-white/2 rounded-3xl border border-white/5 transition-all hover:bg-white/4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <FiZap className={`transition-colors ${recursiveScanning ? "text-primary" : "text-white/20"}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Recursive Scanning</p>
                                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter mt-1">Enable deep state-to-state cross-referencing</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRecursiveScanning(!recursiveScanning)}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${recursiveScanning ? "bg-white" : "bg-white/5 border border-white/5"}`}
                                    >
                                        <motion.div
                                            animate={{ x: recursiveScanning ? 26 : 2 }}
                                            className={`absolute top-1 w-4 h-4 rounded-full shadow-lg ${recursiveScanning ? "bg-zinc-950" : "bg-white/20"}`}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Preview & Submit */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-8">
                        <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl space-y-6">
                            <div className="flex items-center gap-3">
                                <FiBook className="text-white/40" />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Module Summary</h3>
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight border-b border-white/5 pb-4">
                                    <span className="text-zinc-600">Depth</span>
                                    <span className="text-white">{scanDepth}/10</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight border-b border-white/5 pb-4">
                                    <span className="text-zinc-600">Budget</span>
                                    <span className="text-white">{tokenBudget} TKN</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight border-b border-white/5 pb-4">
                                    <span className="text-zinc-600">Recursive</span>
                                    <span className="text-white">{recursiveScanning ? "Active" : "Disabled"}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 rounded-2xl bg-white text-zinc-950 flex items-center justify-center gap-3 group mt-6 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FiPlus className="group-hover:scale-110 transition-transform" />
                                        <span>Archive Module</span>
                                    </>
                                )}
                            </button>
                        </section>

                        <div className="px-8 space-y-4">
                            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black text-center leading-relaxed">
                                Archives are stored in the central persistence layer. Once archived, you can begin injecting semantic entries into the module.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateLorebookPage;
