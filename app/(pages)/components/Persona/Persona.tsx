"use client";

import { UserPersona } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { FaPlus, FaUser, FaInfo, FaCheck, FaTimes } from "react-icons/fa";
import { FiCpu } from "react-icons/fi";
import toast from "react-hot-toast";
import PersonaCard from "../PersonaCard/PersonaCard";
import { motion, AnimatePresence } from "motion/react";

const Persona: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [isCreating, setIsCreating] = useState(false);
  const [personaName, setPersonaName] = useState("");
  const [persona, setPersona] = useState("");

  const { isPending, data, error, refetch } = useQuery<UserPersona[]>({
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

    try {
      const res = await fetch(`/api/persona/${user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaName, persona }),
      });

      if (!res.ok) return toast.error("Failed to create persona");

      toast.success("Persona created successfully!");
      setPersona("");
      setPersonaName("");
      setIsCreating(false);
      await refetch();
    } catch {
      toast.error("Error creating persona");
    }
  };

  // 🔹 Animation Variants
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
      <div className="min-h-screen pt-32 px-6 bg-[#020617]">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-12 bg-white/5 rounded-2xl w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-white/5 rounded-[2rem]" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen pt-24 bg-[#020617] flex items-center justify-center text-center">
        <p className="text-red-400 font-black uppercase tracking-widest italic">Identity Link Failure: {error.message}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-20 px-4 sm:px-8 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        {/* 🔹 Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
          variants={item}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              <h1 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                Personas
              </h1>
            </div>
            <p className="text-white/30 text-xs sm:text-sm font-black uppercase tracking-[0.3em] ml-5 leading-loose">
              Neural Proxies • Identity Layer • {data?.length || 0} Profiles Synchronized
            </p>
          </div>

          {!isCreating && (
            <motion.button
              onClick={() => setIsCreating(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-white/10 transition-all"
            >
              <FaPlus /> Build New Identity
            </motion.button>
          )}
        </motion.div>

        {/* 🔹 Create Persona Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-3xl mx-auto mb-16 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-50" />
              <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                    Neural Configuration
                  </h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Identity Designation</label>
                    <input
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium"
                      placeholder="e.g., Tactical Specialist"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Behavioral Logic</label>
                    <textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium resize-none"
                      rows={5}
                      placeholder="Describe the tone, speech patterns, and identity traits..."
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <motion.button
                      onClick={save}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      <FaCheck className="inline mr-2" /> Sync Identity
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔹 Persona List */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
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
              className="col-span-full py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] text-center"
              variants={item}
            >
              <div className="max-w-xs mx-auto space-y-8">
                <div className="w-24 h-24 mx-auto bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center">
                  <FiCpu className="text-white/10 text-4xl" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                    Zero Identity Detected
                  </h3>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                    Personalized neural proxies allow for specialized interaction flows. Initialize your first identity now.
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsCreating(true)}
                  whileHover={{ scale: 1.05 }}
                  className="px-8 py-5 bg-primary text-slate-950 font-black uppercase tracking-widest text-xs rounded-[1.5rem]"
                >
                  <FaPlus className="inline mr-2" /> Initialize System
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 🔹 Info Section */}
        {data && data.length > 0 && (
          <motion.div
            className="mt-20 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-3xl overflow-hidden relative"
            variants={item}
          >
            <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
              <FiCpu size={120} />
            </div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 flex-shrink-0">
                <FaInfo />
              </div>
              <div className="space-y-3">
                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">
                  System Architecture
                </h4>
                <p className="text-white/40 text-xs leading-loose font-medium max-w-2xl">
                  Neural Personas act as a translation layer for your input. They define how the AI perceives your location, status, and emotional state during the transmission. Multi-persona support allows for seamless roleplay transitions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Persona;
