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
        <p className="text-red-400 font-bold uppercase tracking-widest italic">Identity Link Failure: {error.message}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-20 px-4 sm:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        {/* Header Section */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20"
          variants={item}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
              <h1 className="text-6xl sm:text-8xl font-black text-white italic tracking-tighter uppercase leading-none">
                Personas
              </h1>
            </div>
            <p className="text-white/40 text-sm font-bold uppercase tracking-[0.4em] ml-6 opacity-70">
              Identity Architectures • {data?.length || 0} Profiles Active
            </p>
          </div>

          {!isCreating && (
            <motion.button
              onClick={() => setIsCreating(true)}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-white backdrop-blur-xl border border-white/20 text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all"
            >
              <FaPlus className="text-purple-600" /> New Identity
            </motion.button>
          )}
        </motion.div>

        {/* Form Section */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="max-w-4xl mx-auto mb-20"
            >
              <div className="relative p-[1px] rounded-[3rem] overflow-hidden bg-gradient-to-br from-white/20 to-transparent">
                <div className="relative bg-white/[0.03] backdrop-blur-[60px] rounded-[3rem] p-10 sm:p-14 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-white italic tracking-tight uppercase">
                        Forge Identity
                      </h3>
                      <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Configuration Module Alpha-1</p>
                    </div>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Identity Identifier</label>
                      <input
                        value={personaName}
                        onChange={(e) => setPersonaName(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/10 outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all font-bold tracking-tight text-lg"
                        placeholder="e.g. Cyber Punk Rebel"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Behavioral Matrix</label>
                      <textarea
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-3xl px-8 py-6 text-white placeholder:text-white/10 outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all font-medium resize-none text-base leading-relaxed"
                        rows={6}
                        placeholder="Define personality traits, speech patterns, and background..."
                      />
                    </div>

                    <div className="flex justify-end pt-6">
                      <motion.button
                        onClick={save}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative px-12 py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <span className="relative group-hover:text-white transition-colors z-10 flex items-center gap-3">
                          <FaCheck className="text-purple-600 group-hover:text-white transition-colors" /> Establish Link
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid Section */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
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
              className="col-span-full py-28 relative group"
              variants={item}
            >
              <div className="absolute inset-0 bg-white/[0.01] border-[2px] border-dashed border-white/10 rounded-[4rem] group-hover:bg-white/[0.02] group-hover:border-white/20 transition-all duration-700" />
              <div className="max-w-sm mx-auto space-y-10 text-center relative">
                <div className="w-28 h-28 mx-auto bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-700">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <FiCpu className="text-white/20 text-5xl group-hover:text-white transition-colors duration-700" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                    No Core Detected
                  </h3>
                  <p className="text-white/30 text-[11px] font-bold uppercase tracking-[0.25em] leading-loose">
                    Your digital existence is currently amorphous. Initialize a persona core to synchronize your identity across the network.
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsCreating(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-[0_20px_40px_rgba(168,85,247,0.25)]"
                >
                  <FaPlus className="inline mr-2" /> Initialize System
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Module */}
        {data && data.length > 0 && (
          <motion.div
            className="mt-24 relative p-[1px] rounded-[3rem] overflow-hidden"
            variants={item}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="relative bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] p-12 overflow-hidden">
              <div className="absolute top-0 right-0 p-10 text-white/5 pointer-events-none group-hover:text-white/10 transition-colors duration-1000">
                <FiCpu size={160} />
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-8 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl">
                  <FaInfo className="text-xl" />
                </div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white italic tracking-tight uppercase">
                    Identity Protocol
                  </h4>
                  <p className="text-white/40 text-sm leading-relaxed font-semibold max-w-3xl">
                    Persona profiles serve as the semantic foundation for all AI interactions. Each identity encapsulates specific behavioral logic and contextual memory, allowing the AI systems to adapt their response parameters to match your designated status.
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
