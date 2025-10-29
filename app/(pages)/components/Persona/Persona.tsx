"use client";

import { UserPersona } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { FaPlus, FaUser, FaInfo, FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import PersonaCard from "../PersonaCard/PersonaCard";
import { motion, AnimatePresence } from "motion/react";

const Persona = () => {
  const { user } = useContext(AuthContext);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [personaName, setPersonaName] = useState<string>("New Persona");
  const [persona, setPersona] = useState<string>("");

  const { isPending, data, error, refetch } = useQuery<UserPersona[]>({
    queryKey: ["personas"],
    queryFn: () =>
      fetch(`/api/persona/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  const save = async () => {
    if (!personaName.trim() || !persona.trim()) {
      toast.error("Please fill in both name and persona description");
      return;
    }

    try {
      const response = await fetch(`/api/persona/${user?.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ personaName, persona: persona }),
      });
      if (!response.ok) {
        return toast.error("Failed to create persona");
      }

      toast.success("Persona created successfully");
      setIsCreating(false);
      setPersonaName("New Persona");
      setPersona("");
      await refetch();
    } catch (error) {
      console.log(error);
      toast.error("An error occurred while creating persona");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isPending) return (
    <motion.div 
      className="min-h-screen bg-var-color-primary-background pt-24 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i} 
                className="h-20 bg-var-color-borders rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              ></motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (error) return (
    <motion.div 
      className="min-h-screen bg-var-color-primary-background pt-24 px-4 flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <p className="text-var-color-error text-lg">Error loading personas: {error.message}</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="min-h-screen bg-var-color-primary-background pt-24 pb-8 px-4"
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
  
        >
          <div>
            <h1 className="text-4xl font-bold text-var-color-primary-text mb-2">
              My Personas
            </h1>
            <p className="text-var-color-secondary-text">
              Manage your AI personalities for different chat experiences
            </p>
          </div>
          <motion.button
            onClick={() => setIsCreating(true)}
            className="bg-var-color-primary-button text-white px-6 py-3 rounded-lg hover:bg-var-color-primary-hover-state transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
            whileTap={{ scale: 0.95 }}
  
          >
            <FaPlus className="w-4 h-4" />
            Add Persona
          </motion.button>
        </motion.div>

        {/* Create Persona Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-var-color-primary-text mb-4">
                Create New Persona
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
                    Persona Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-var-color-disabled w-4 h-4" />
                    </div>
                    <motion.input
                      type="text"
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
                      placeholder="Enter persona name"
                      whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-var-color-secondary-text mb-2">
                    Personality Description
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FaInfo className="text-var-color-disabled w-4 h-4" />
                    </div>
                    <motion.textarea
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text resize-none"
                      placeholder="Describe your personality, tone, and behavior..."
                      rows={6}
                      whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <motion.button
                    onClick={() => {
                      setIsCreating(false);
                      setPersonaName("New Persona");
                      setPersona("");
                    }}
                    className="px-4 py-2 border border-var-color-borders text-var-color-secondary-text rounded-lg hover:bg-var-color-borders transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={save}
                    className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaCheck className="w-4 h-4" />
                    Create Persona
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personas List */}
        <motion.div 
          className="space-y-4"
        
        >
          {data && data.length > 0 ? (
            data.map((persona, index) => (
              <motion.div
                key={persona.id}
       
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <PersonaCard initialPersona={persona} />
              </motion.div>
            ))
          ) : (
            /* Empty State */
            <motion.div 
              className="text-center py-16"
    
            >
              <div className="max-w-md mx-auto">
                <motion.div 
                  className="w-24 h-24 mx-auto mb-6 bg-var-color-borders rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <FaUser className="text-var-color-disabled w-10 h-10" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-var-color-primary-text mb-2">
                  No personas yet
                </h3>
                <p className="text-var-color-secondary-text mb-6">
                  Create your first persona to customize how you interact with AI characters.
                </p>
                <motion.button
                  onClick={() => setIsCreating(true)}
                  className="bg-var-color-primary-button text-white px-8 py-3 rounded-lg hover:bg-var-color-primary-hover-state transition-all duration-200 inline-flex items-center gap-2 font-semibold"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 196, 179, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPlus className="w-4 h-4" />
                  Create Your First Persona
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Section */}
        <AnimatePresence>
          {data && data.length > 0 && (
            <motion.div 
              className="mt-8 bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <FaInfo className="text-var-color-primary-button w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-var-color-primary-text mb-2">
                    About Personas
                  </h4>
                  <p className="text-var-color-secondary-text">
                    Personas allow you to define your own personality, tone, and behavior when chatting with AI characters. 
                    Set a default persona to automatically apply it to all new conversations, or switch between personas for different chat experiences.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Persona;