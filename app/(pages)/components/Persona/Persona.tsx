"use client";

import { UserPersona } from "@/app/generated/prisma";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { FaPlus, FaUser, FaInfo, FaCheck, FaTimes } from "react-icons/fa";
import { FiCpu } from "react-icons/fi";
import { toast } from '@/app/lib/toast';
import PersonaCard from "../PersonaCard/PersonaCard";
import { motion, AnimatePresence } from "motion/react";

const Persona: React.FC = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [personaName, setPersonaName] = useState("");
  const [persona, setPersona] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { isPending, data, error, refetch } = useQuery<any[]>({
    queryKey: ["personas"],
    queryFn: async () => {
      const res = await fetch(`/api/persona/${user?.id}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!user?.id,
  });

  const save = async () => {
    if (!personaName.trim() || !persona.trim()) {
      toast.error("Please fill in both name and persona description");
      return;
    }

    // Optimistic Update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticPersona = {
      id: optimisticId,
      name: personaName.trim(),
      person: persona.trim(),
      userId: user?.id,
      image: null, // No image yet
    };

    queryClient.setQueryData(["personas"], (old: any[] | undefined) => {
      if (!old) return [optimisticPersona];
      return [optimisticPersona, ...old];
    });

    try {
      const res = await fetch(`/api/persona/${user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaName, persona }),
      });

      if (!res.ok) {
        toast.error("Failed to create persona");
        queryClient.invalidateQueries({ queryKey: ["personas"] });
        return;
      }
      const { data: newPersona } = await res.json();

      if (imageFile && newPersona?.id) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const imgRes = await fetch(`/api/persona/image/${newPersona.id}`, {
          method: "POST",
          body: formData,
        });
        if (!imgRes.ok) toast.error("Failed to upload persona image");
      }

      toast.success("Persona created successfully!");
      setPersona("");
      setPersonaName("");
      setImageFile(null);
      setImagePreview(null);
      setIsCreating(false);

      // Surgical Replace
      queryClient.setQueryData(["personas"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(p => p.id === optimisticId ? { ...newPersona, image: imageFile ? { id: 'temp' } : null } : p);
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["personas"] });
      }, 1000);
    } catch {
      toast.error("Error creating persona");
      queryClient.invalidateQueries({ queryKey: ["personas"] });
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
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Identity Link Failure: {error.message}</p>
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
                Personas
              </h1>
            </div>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-3 leading-none">
              Identity Architectures • {data?.length || 0} Profiles Active
            </p>
          </div>

          {!isCreating && (
            <motion.button
              onClick={() => setIsCreating(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl"
            >
              <FaPlus size={10} /> New Identity
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
              className="max-w-2xl mx-auto mb-16"
            >
              <div className="bg-white/1 rounded-2xl p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">
                      Forge Identity
                    </h3>
                    <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Configuration Module Alpha-1</p>
                  </div>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all border border-white/5"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Identity Identifier</label>
                    <input
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="input-modern w-full font-bold text-sm h-12"
                      placeholder="e.g. Cyber Punk Rebel"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Behavioral Matrix</label>
                    <textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="input-modern w-full min-h-[120px] py-4 text-xs leading-relaxed"
                      placeholder="Define personality traits, speech patterns, and background..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Identity Visual</label>
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all"
                          >
                            <FaTimes size={8} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-20 h-20 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-600 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                          <FaPlus size={12} />
                          <span className="text-[8px] font-black uppercase mt-1">Upload</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      )}
                      <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest max-w-[150px]">
                        Recommended: Square aspect ratio. Max 5MB.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <motion.button
                      onClick={save}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl"
                    >
                      <FaCheck size={10} /> Establish Link
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid Section */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
        >
          {data && data.length > 0 ? (
            data.map((p) => (
              <motion.div key={p.id} variants={item}>
                <PersonaCard initialPersona={p} />
              </motion.div>
            ))
          ) : !isCreating && (
            <motion.div
              className="col-span-full py-20 relative group"
              variants={item}
            >
              <div className="absolute inset-0 bg-white/1 border border-dashed border-white/5 rounded-2xl group-hover:bg-white/2 transition-all duration-700" />
              <div className="max-w-sm mx-auto space-y-6 text-center relative">
                <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  <FiCpu className="text-zinc-800 text-3xl group-hover:text-zinc-500 transition-colors duration-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">
                    No Core Detected
                  </h3>
                  <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Your digital existence is currently amorphous. Initialize a persona core for identity synchronization.
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsCreating(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-white text-zinc-950 font-black uppercase tracking-widest text-[10px] rounded-lg shadow-xl"
                >
                  <FaPlus className="inline mr-2" size={10} /> Initialize System
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Module */}
        {data && data.length > 0 && (
          <motion.div
            className="mt-16"
            variants={item}
          >
            <div className="relative bg-white/1 border border-white/5 rounded-2xl p-8 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-zinc-400 border border-white/10 shadow-xl shrink-0">
                  <FaInfo className="text-lg" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-white italic tracking-tight uppercase leading-none">
                    Identity Protocol
                  </h4>
                  <p className="text-zinc-600 text-[10px] leading-relaxed font-bold max-w-2xl uppercase tracking-tighter">
                    Persona profiles serve as the semantic foundation for all AI interactions. Each identity encapsulates specific behavioral logic and contextual memory, allowing the AI systems to adapt their response parameters.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Persona;
