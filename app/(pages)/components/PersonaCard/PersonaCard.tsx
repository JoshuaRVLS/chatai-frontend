"use client";

import { UserPersona } from "@/app/generated/prisma";
import React, { useContext, useState } from "react";
import { FaUser, FaInfo, FaCheck, FaEdit, FaTrash, FaTimes, FaPlus } from "react-icons/fa";
import { AuthContext } from "../../providers/AuthProvider";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";

const PersonaCard = ({ initialPersona }: { initialPersona: UserPersona }) => {
  const [personaName, setPersonaName] = useState<string>(initialPersona.name);
  const [persona, setPersona] = useState<string>(initialPersona.person);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const { user } = useContext(AuthContext);
  const confirm = useConfirm();

  const { data: activePersonaId, refetch } = useQuery<string>({
    queryKey: ["personaUsed"],
    queryFn: () =>
      fetch(`/api/persona-used/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  const usePersona = async () => {
    try {
      const response = await fetch("/api/persona-used", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, personaId: initialPersona.id }),
      });
      if (!response.ok) return toast.error("Failed to set persona as default");
      toast.success("Identity core synchronized");
      await refetch();
    } catch (error) {
      toast.error("An error occurred while setting persona");
    }
  };

  const save = async () => {
    if (!personaName.trim() || !persona.trim()) {
      toast.error("Please fill in both name and persona description");
      return;
    }

    try {
      const response = await fetch(`/api/persona/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaName, persona, personaId: initialPersona.id }),
      });
      if (!response.ok) return toast.error("Failed to update persona");
      toast.success("Identity reconfiguration successful");
      setIsEditing(false);
      await refetch();
    } catch (error) {
      toast.error("An error occurred while updating persona");
    }
  };

  const deletePersona = async () => {
    if (!(await confirm({
      title: "Deconstruct Identity",
      message: `Are you sure you want to permanently delete "${personaName}"? This process is irreversible.`,
      confirmLabel: "Delete Persona",
      variant: "danger"
    }))) return;

    try {
      const response = await fetch(`/api/persona/${initialPersona.id}`, { method: "DELETE" });
      if (!response.ok) return toast.error("Failed to delete persona");
      toast.success("Identity purged from network");
      await refetch();
    } catch (error) {
      toast.error("An error occurred while deleting persona");
    }
  };

  const isActive = activePersonaId === initialPersona.id;

  return (
    <motion.div
      className={`relative rounded-[2.5rem] overflow-hidden border transition-all duration-500 ${isActive ? 'bg-white/[0.05] border-purple-500/50 shadow-[0_20px_60px_rgba(168,85,247,0.15)]' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Background Glow for Active Card */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-transparent to-blue-600/10 pointer-events-none" />
      )}

      {/* Header Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-8 flex items-center justify-between text-left group"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-white/30 group-hover:bg-white/10'}`}>
              <FaUser size={20} />
            </div>
            {isActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-[#020617] shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-tight group-hover:text-primary transition-colors">
              {personaName}
            </h3>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              {isActive ? "Default Neural Core" : "Secondary Proxy Node"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isExpanded ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/10 group-hover:border-white/10'}`}
        >
          <FaPlus size={14} />
        </motion.div>
      </motion.button>

      {/* Content Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-8 space-y-8">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Identity Signature</label>
                    <input
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Behavioral Logic Matrix</label>
                    <textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-500/50 transition-all font-medium resize-none text-sm leading-relaxed"
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-white/5 text-white/30 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                    >
                      Abort
                    </button>
                    <button
                      onClick={save}
                      className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                    >
                      <FaCheck /> Confirm Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                      <FaInfo size={10} className="text-purple-500" /> Behavioral Manifest
                    </h4>
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-white/60 text-sm leading-relaxed italic font-medium">
                      "{persona}"
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <FaEdit className="text-purple-400" /> Edit
                      </button>
                      <button
                        onClick={deletePersona}
                        className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                      >
                        <FaTrash /> Purge
                      </button>
                    </div>
                    <button
                      onClick={usePersona}
                      disabled={isActive}
                      className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${isActive ? 'bg-primary text-black cursor-default' : 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
                    >
                      {isActive ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-black animate-pulse" /> Linked
                        </>
                      ) : (
                        <>Establish Neural Link</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PersonaCard;
