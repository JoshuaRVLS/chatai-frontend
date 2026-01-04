"use client";

import React, { useState, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { FaTimes, FaRobot, FaUser, FaCheck } from "react-icons/fa";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import type { UserPersona } from "@/app/generated/prisma";

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel: string;
    currentPersonaId: string | null;
    onSave: (model: string, personaId: string | null) => void;
}

const AVAILABLE_MODELS = [
    { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", description: "Default Model" },
    { id: "xiaomi/mimo-v2-flash:free", name: "Mimo V2 Flash", description: "Fast & Free" },
    { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", description: "Balanced Speed" },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", description: "High Logic" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", description: "Balanced performance" },
];

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
    isOpen,
    onClose,
    currentModel,
    currentPersonaId,
    onSave,
}) => {
    const { user } = useContext(AuthContext);
    const [selectedModel, setSelectedModel] = useState(currentModel);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(currentPersonaId);

    const { data: personas } = useQuery<UserPersona[]>({
        queryKey: ["personas", user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/persona/${user?.id}`);
            const json = await res.json();
            return json.data || [];
        },
        enabled: !!user?.id && isOpen,
    });

    useEffect(() => {
        setSelectedModel(currentModel);
        setSelectedPersonaId(currentPersonaId);
    }, [currentModel, currentPersonaId, isOpen]);

    const handleSave = () => {
        onSave(selectedModel, selectedPersonaId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-slate-950/95 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-3xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                                Session Config
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                        {/* Model Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FaRobot className="text-primary" />
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">AI Model</span>
                            </div>
                            <div className="grid gap-2">
                                {AVAILABLE_MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => setSelectedModel(model.id)}
                                        className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedModel === model.id
                                            ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-bold ${selectedModel === model.id ? "text-primary" : "text-white"}`}>
                                                    {model.name}
                                                </p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                                                    {model.description}
                                                </p>
                                            </div>
                                            {selectedModel === model.id && (
                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                    <FaCheck size={10} className="text-slate-950" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Persona Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FaUser className="text-purple-400" />
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Active Persona</span>
                            </div>
                            <div className="grid gap-2">
                                <button
                                    onClick={() => setSelectedPersonaId(null)}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedPersonaId === null
                                        ? "bg-purple-500/10 border-purple-500/50"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`font-bold ${selectedPersonaId === null ? "text-purple-400" : "text-white"}`}>
                                                No Persona
                                            </p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                                                Use default identity
                                            </p>
                                        </div>
                                        {selectedPersonaId === null && (
                                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                                <FaCheck size={10} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {personas?.map((persona) => (
                                    <button
                                        key={persona.id}
                                        onClick={() => setSelectedPersonaId(persona.id)}
                                        className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedPersonaId === persona.id
                                            ? "bg-purple-500/10 border-purple-500/50"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-bold ${selectedPersonaId === persona.id ? "text-purple-400" : "text-white"}`}>
                                                    {persona.name}
                                                </p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5 line-clamp-1">
                                                    {persona.person.slice(0, 50)}...
                                                </p>
                                            </div>
                                            {selectedPersonaId === persona.id && (
                                                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <FaCheck size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-all font-medium"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            className="px-8 py-3 rounded-xl bg-primary text-slate-950 font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                        >
                            Apply Settings
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatSettingsModal;
