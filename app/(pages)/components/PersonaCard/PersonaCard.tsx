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
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

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
      className={`relative rounded-3xl overflow-hidden border transition-all duration-500 ${isActive ? 'bg-surface border-border-hover shadow-xl' : 'bg-surface border-border-default hover:border-border-hover'}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Subtle Background Glow for Active Card */}
      {isActive && (
        <div className="absolute inset-0 bg-text-primary/5 pointer-events-none" />
      )}

      {/* Header Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left group"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 overflow-hidden relative ${isActive ? 'bg-text-primary text-white dark:text-black shadow-lg' : 'bg-surface-hover text-text-muted group-hover:bg-text-primary/10'}`}>
              {initialPersona.image ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 bg-surface animate-pulse flex items-center justify-center">
                      <div className="w-4 h-4 border border-border-default border-t-text-primary rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={`/api/persona/image/${initialPersona.id}`}
                    alt={personaName}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setImageLoading(false)}
                  />
                </>
              ) : (
                <FaUser size={16} />
              )}
            </div>
            {isActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-text-primary rounded-full border-2 border-bg-page"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-text-primary italic tracking-tight uppercase leading-none group-hover:text-text-primary/70 transition-colors">
              {personaName}
            </h3>
            <p className="text-text-muted text-[9px] font-black uppercase tracking-widest leading-none">
              {isActive ? "Primary Identity" : "Secondary Identity"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isExpanded ? 'bg-text-primary/10 border-text-primary/20 text-text-primary' : 'bg-transparent border-border-default text-text-muted group-hover:border-border-hover group-hover:text-text-primary'}`}
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
            className="overflow-hidden border-t border-border-default"
          >
            <div className="p-6 space-y-6">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Identity Signature</label>
                    <input
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="input-modern w-full font-bold text-sm h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Behavioral Logic Matrix</label>
                    <textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="input-modern w-full min-h-[100px] text-xs py-3 leading-relaxed"
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Identity Visual</label>
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border-default bg-surface">
                          {previewLoading && (
                            <div className="absolute inset-0 bg-surface animate-pulse flex items-center justify-center">
                              <div className="w-4 h-4 border border-border-default border-t-text-primary rounded-full animate-spin" />
                            </div>
                          )}
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className={`w-full h-full object-cover transition-opacity duration-300 ${previewLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setPreviewLoading(false)}
                            onError={() => setPreviewLoading(false)}
                          />
                          <button
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="absolute top-1 right-1 w-4 h-4 bg-overlay text-text-primary rounded-full flex items-center justify-center hover:bg-black/70 transition-all font-bold z-10"
                          >
                            <span className="text-[8px]">×</span>
                          </button>
                        </div>
                      ) : (
                        <label className="w-16 h-16 rounded-xl border border-dashed border-border-default flex flex-col items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-all cursor-pointer">
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
                                setPreviewLoading(true);
                                setImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      )}
                      <p className="text-text-muted text-[8px] font-bold uppercase tracking-widest max-w-[150px]">
                        Recommended: Square. Max 5MB.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-border-default text-text-muted rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-surface-hover transition-all"
                    >
                      Abort
                    </button>
                    <button
                      onClick={save}
                      className="px-6 py-2 bg-text-primary text-white dark:text-black rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-lg"
                    >
                      <FaCheck size={10} /> Confirm Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2 leading-none">
                      <FaInfo size={8} className="text-text-muted" /> Behavioral Manifest
                    </h4>
                    <div className="bg-surface border border-border-default rounded-2xl p-5 text-text-secondary text-xs leading-relaxed italic font-medium">
                      "{persona}"
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 h-10 bg-surface-hover border border-border-default rounded-lg text-text-muted font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-surface hover:text-text-primary transition-all"
                      >
                        <FaEdit size={10} /> Edit
                      </button>
                      <button
                        onClick={deletePersona}
                        className="flex-1 h-10 bg-surface-hover border border-border-default rounded-lg text-text-muted font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-surface hover:text-text-primary transition-all"
                      >
                        <FaTrash size={10} /> Purge
                      </button>
                    </div>
                    <button
                      onClick={usePersona}
                      disabled={isActive}
                      className={`px-6 h-10 rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all shadow-xl ${isActive ? 'bg-text-primary text-white dark:text-black cursor-default px-8' : 'bg-surface-hover text-text-primary hover:bg-surface'}`}
                    >
                      {isActive ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-bg-page animate-pulse" /> Linked
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
