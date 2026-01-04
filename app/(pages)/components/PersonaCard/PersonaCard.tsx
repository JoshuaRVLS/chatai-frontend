"use client";

import { UserPersona } from "@/app/generated/prisma";
import React, { useContext, useState } from "react";
import { FaUser, FaInfo, FaCheck, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          personaId: initialPersona.id,
        }),
      });
      if (!response.ok) {
        toast.error("Failed to set persona as default");
        return;
      }

      toast.success("Persona set as default");
      await refetch();
    } catch (error) {
      console.log(error);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaName,
          persona: persona,
          personaId: initialPersona.id,
        }),
      });
      if (!response.ok) {
        return toast.error("Failed to update persona");
      }

      toast.success("Persona updated successfully");
      setIsEditing(false);
      await refetch();
    } catch (error) {
      console.log(error);
      toast.error("An error occurred while updating persona");
    }
  };

  const deletePersona = async () => {
    if (!(await confirm({
      title: "Delete Persona",
      message: `Are you sure you want to delete "${personaName}"? This action cannot be undone.`,
      confirmLabel: "Delete Persona",
      variant: "danger"
    }))) return;

    try {
      const response = await fetch(`/api/persona/${initialPersona.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        return toast.error("Failed to delete persona");
      }

      toast.success("Persona deleted successfully");
      await refetch();
    } catch (error) {
      console.log(error);
      toast.error("An error occurred while deleting persona");
    }
  };

  const isActive = activePersonaId === initialPersona.id;

  return (
    <motion.div
      className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden"
      whileHover={{ boxShadow: "0 10px 30px rgba(0, 196, 179, 0.2)" }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
        whileHover={{ backgroundColor: "var(--color-borders)" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={`p-2 rounded-full ${isActive ? 'bg-var-color-primary-button text-white' : 'bg-var-color-borders text-var-color-secondary-text'
              }`}
            animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
          >
            <FaUser className="w-4 h-4" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-var-color-primary-text">
              {personaName}
            </h3>
            <p className="text-var-color-secondary-text text-sm">
              {isActive ? "Default Persona" : "Click to expand"}
            </p>
          </div>
        </div>
        <motion.div
          className="flex items-center gap-2"
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isActive && (
            <span className="px-2 py-1 bg-var-color-primary-button text-white text-xs rounded-full">
              Active
            </span>
          )}
          <FaTimes className="text-var-color-disabled" />
        </motion.div>
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="p-6 border-t border-var-color-borders"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isEditing ? (
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
                      className="w-full pl-10 pr-4 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
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
                      className="w-full pl-10 pr-4 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text resize-none"
                      rows={6}
                      whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(0, 196, 179, 0.3)" }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <motion.button
                    onClick={() => setIsEditing(false)}
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
                    Save Changes
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-var-color-secondary-text mb-2">
                    Personality Description
                  </h4>
                  <p className="text-var-color-primary-text bg-var-color-primary-background border border-var-color-borders rounded-lg p-4 whitespace-pre-wrap">
                    {persona}
                  </p>
                </div>

                <div className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-var-color-borders text-var-color-secondary-text rounded-lg hover:bg-var-color-borders transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaEdit className="w-4 h-4" />
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={deletePersona}
                      className="px-4 py-2 border border-var-color-error text-var-color-error rounded-lg hover:bg-var-color-error hover:text-white transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaTrash className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>

                  <motion.button
                    onClick={usePersona}
                    disabled={isActive}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isActive
                      ? 'bg-var-color-primary-button text-white cursor-default'
                      : 'bg-var-color-secondary-button text-white hover:bg-var-color-secondary-hover-state'
                      }`}
                    whileHover={!isActive ? { scale: 1.05, boxShadow: "0 10px 20px rgba(164, 95, 255, 0.3)" } : {}}
                    whileTap={!isActive ? { scale: 0.95 } : {}}
                  >
                    <FaCheck className="w-4 h-4" />
                    {isActive ? 'Currently Active' : 'Set as Default'}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PersonaCard;