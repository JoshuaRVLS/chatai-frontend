"use client";

import { UserPersona } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { FaPlus, FaUser, FaInfo, FaCheck, FaTimes } from "react-icons/fa";
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

  // 🔹 Loading State
  if (isPending)
    return (
      <div className="min-h-screen pt-24 px-6 flex flex-col items-center justify-center space-y-6 animate-pulse">
        <div className="h-10 w-40 bg-var-color-borders rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-var-color-borders rounded-2xl" />
          ))}
        </div>
      </div>
    );

  // 🔹 Error State
  if (error)
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-center text-red-500">
        Error loading personas: {error.message}
      </div>
    );

  return (
    <motion.div
      className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4 sm:px-8"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div className="max-w-6xl mx-auto">
        {/* 🔹 Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
          variants={item}
        >
          <div>
            <h1 className="text-4xl font-bold text-var-color-primary-text mb-2">
              My Personas
            </h1>
            <p className="text-var-color-secondary-text text-sm sm:text-base">
              Create and manage unique personalities for your AI interactions.
            </p>
          </div>
          <motion.button
            onClick={() => setIsCreating(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-var-color-primary-button hover:bg-var-color-primary-hover-state text-white rounded-xl font-semibold shadow-md"
          >
            <FaPlus className="w-4 h-4" />
            New Persona
          </motion.button>
        </motion.div>

        {/* 🔹 Create Persona */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6 mb-8 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-var-color-primary-text mb-4">
                Create New Persona
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-var-color-secondary-text mb-2">
                    Persona Name
                  </label>
                  <input
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    className="w-full px-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg text-var-color-primary-text focus:ring-2 focus:ring-var-color-primary-button outline-none"
                    placeholder="e.g., Chill GPT"
                  />
                </div>

                <div>
                  <label className="block text-sm text-var-color-secondary-text mb-2">
                    Personality Description
                  </label>
                  <textarea
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full px-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg text-var-color-primary-text focus:ring-2 focus:ring-var-color-primary-button outline-none resize-none"
                    rows={5}
                    placeholder="Describe your persona's tone, style, and behavior..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <motion.button
                    onClick={() => setIsCreating(false)}
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 border border-var-color-borders text-var-color-secondary-text rounded-lg hover:bg-var-color-borders flex items-center gap-2"
                  >
                    <FaTimes className="w-4 h-4" /> Cancel
                  </motion.button>

                  <motion.button
                    onClick={save}
                    whileHover={{ scale: 1.05 }}
                    className="px-5 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state flex items-center gap-2"
                  >
                    <FaCheck className="w-4 h-4" /> Save Persona
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔹 Persona List */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
        >
          {data && data.length > 0 ? (
            data.map((p) => (
              <motion.div
                key={p.id}
                variants={item}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <PersonaCard initialPersona={p} />
              </motion.div>
            ))
          ) : (
            <motion.div
              className="col-span-full text-center py-16"
              variants={item}
            >
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-var-color-borders flex items-center justify-center mb-6">
                  <FaUser className="text-var-color-disabled w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-var-color-primary-text mb-2">
                  No personas yet
                </h3>
                <p className="text-var-color-secondary-text mb-6">
                  Create your first persona to personalize your AI experience.
                </p>
                <motion.button
                  onClick={() => setIsCreating(true)}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-6 py-3 bg-var-color-primary-button text-white rounded-xl hover:bg-var-color-primary-hover-state shadow-md"
                >
                  <FaPlus /> Create Persona
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 🔹 Info Section */}
        {data && data.length > 0 && (
          <motion.div
            className="mt-10 bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6"
            variants={item}
          >
            <div className="flex items-start gap-3">
              <FaInfo className="text-var-color-primary-button w-5 h-5 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-var-color-primary-text mb-2">
                  About Personas
                </h4>
                <p className="text-var-color-secondary-text leading-relaxed">
                  Personas define your communication style and tone when
                  chatting with AI. Use them to customize your mood, intent, or
                  personality for different experiences.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Persona;
