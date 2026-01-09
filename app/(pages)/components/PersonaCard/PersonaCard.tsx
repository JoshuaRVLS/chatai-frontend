"use client";

import { UserPersona } from "@/app/generated/prisma";
import React, { useContext, useState } from "react";
import { FaUser, FaInfo, FaCheck, FaEdit, FaTrash, FaTimes, FaPlus } from "react-icons/fa";
import { AuthContext } from "../../providers/AuthProvider";
import { toast } from '@/app/lib/toast';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";

const PersonaCard = ({ initialPersona }: { initialPersona: any }) => {
  const [personaName, setPersonaName] = useState<string>(initialPersona.name);
  const [persona, setPersona] = useState<string>(initialPersona.person);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialPersona.image ? `/api/persona/image/${initialPersona.id}?t=${Date.now()}` : null);

  const { user } = useContext(AuthContext);
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const { data: activePersonaId, refetch } = useQuery<string>({
    queryKey: ["personaUsed"],
    queryFn: () =>
      fetch(`/api/persona-used/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  const usePersona = async () => {
    // Optimistic Update
    queryClient.setQueryData(["personaUsed"], initialPersona.id);

    try {
      const response = await fetch("/api/persona-used", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, personaId: initialPersona.id }),
      });
      if (!response.ok) {
        toast.error("Failed to set persona as default");
        queryClient.invalidateQueries({ queryKey: ["personaUsed"] });
        return;
      }
      toast.success("Identity core synchronized");
      await refetch();
    } catch (error) {
      toast.error("An error occurred while setting persona");
      queryClient.invalidateQueries({ queryKey: ["personaUsed"] });
    }
  };

  const save = async () => {
    if (!personaName.trim() || !persona.trim()) {
      toast.error("Please fill in both name and persona description");
      return;
    }

    // Optimistic Update
    queryClient.setQueryData(["personas"], (old: any[] | undefined) => {
      if (!old) return old;
      return old.map(p => p.id === initialPersona.id ? { ...p, name: personaName, person: persona } : p);
    });

    try {
      const response = await fetch(`/api/persona/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaName, persona, personaId: initialPersona.id }),
      });
      if (!response.ok) {
        toast.error("Failed to update persona");
        queryClient.invalidateQueries({ queryKey: ["personas"] });
        return;
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const imgRes = await fetch(`/api/persona/image/${initialPersona.id}`, {
          method: "POST",
          body: formData,
        });
        if (!imgRes.ok) toast.error("Failed to upload persona image");
      }

      toast.success("Identity reconfiguration successful");
      setIsEditing(false);
      setImageFile(null);
      await queryClient.invalidateQueries({ queryKey: ["personas"] });
    } catch (error) {
      toast.error("An error occurred while updating persona");
      queryClient.invalidateQueries({ queryKey: ["personas"] });
    }
  };

  const deletePersona = async () => {
    if (!(await confirm({
      title: "Deconstruct Identity",
      message: `Are you sure you want to permanently delete "${personaName}"? This process is irreversible.`,
      confirmLabel: "Delete Persona",
      variant: "danger"
    }))) return;

    // Optimistic Delete
    queryClient.setQueryData(["personas"], (old: any[] | undefined) => {
      if (!old) return old;
      return old.filter(p => p.id !== initialPersona.id);
    });

    try {
      const response = await fetch(`/api/persona/${initialPersona.id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Failed to delete persona");
        queryClient.invalidateQueries({ queryKey: ["personas"] });
        return;
      }
      toast.success("Identity purged from network");
      await queryClient.invalidateQueries({ queryKey: ["personas"] });
    } catch (error) {
      toast.error("An error occurred while deleting persona");
      queryClient.invalidateQueries({ queryKey: ["personas"] });
    }
  };

  const isActive = activePersonaId === initialPersona.id;

  return (
    <motion.div
      className={`relative rounded-3xl overflow-hidden border transition-all duration-500 ${isActive ? 'bg-white/5 border-white/20 shadow-2xl' : 'bg-white/1 border-white/5 hover:border-white/10'}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Subtle Background Glow for Active Card */}
      {isActive && (
        <div className="absolute inset-0 bg-white/1 pointer-events-none" />
      )}

      {/* Header Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left group"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 overflow-hidden ${isActive ? 'bg-white text-zinc-950 shadow-xl' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10'}`}>
              {initialPersona.image ? (
                <img
                  src={`/api/persona/image/${initialPersona.id}`}
                  alt={personaName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser size={16} />
              )}
            </div>
            {isActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-[#09090b]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-white italic tracking-tight uppercase leading-none group-hover:text-zinc-300 transition-colors">
              {personaName}
            </h3>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest leading-none">
              {isActive ? "Primary Identity" : "Secondary Identity"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isExpanded ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-zinc-800 group-hover:border-white/10 group-hover:text-zinc-500'}`}
        >
          <FaPlus size={10} />
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
            <div className="p-6 space-y-6">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Identity Signature</label>
                    <input
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="input-modern w-full font-bold text-sm h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Behavioral Logic Matrix</label>
                    <textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="input-modern w-full min-h-[100px] text-xs py-3 leading-relaxed"
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Identity Visual</label>
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="absolute top-1 right-1 w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all font-bold"
                          >
                            <span className="text-[8px]">×</span>
                          </button>
                        </div>
                      ) : (
                        <label className="w-16 h-16 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-600 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                          <FaPlus size={10} />
                          <span className="text-[7px] font-black uppercase mt-1">Upload</span>
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
                        Recommended: Square. Max 5MB.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-white/5 text-zinc-600 rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-white/5 transition-all"
                    >
                      Abort
                    </button>
                    <button
                      onClick={save}
                      className="px-6 py-2 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-lg"
                    >
                      <FaCheck size={10} /> Confirm Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2 leading-none">
                      <FaInfo size={8} className="text-zinc-500" /> Behavioral Manifest
                    </h4>
                    <div className="bg-white/1 border border-white/5 rounded-2xl p-5 text-zinc-500 text-xs leading-relaxed italic font-medium">
                      "{persona}"
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 h-10 bg-white/5 border border-white/5 rounded-lg text-zinc-500 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <FaEdit size={10} /> Edit
                      </button>
                      <button
                        onClick={deletePersona}
                        className="flex-1 h-10 bg-white/5 border border-white/5 rounded-lg text-zinc-800 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-zinc-900/50 hover:text-zinc-600 transition-all"
                      >
                        <FaTrash size={10} /> Purge
                      </button>
                    </div>
                    <button
                      onClick={usePersona}
                      disabled={isActive}
                      className={`px-6 h-10 rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all shadow-xl ${isActive ? 'bg-white text-zinc-950 cursor-default px-8' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {isActive ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" /> Linked
                        </>
                      ) : (
                        <>Use Identity</>
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
