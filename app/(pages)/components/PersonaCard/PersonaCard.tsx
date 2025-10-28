"use client";

import { UserPersona } from "@/app/generated/prisma";
import React, { useContext, useState } from "react";
import { FaUser, FaInfo, FaCheck, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { AuthContext } from "../../providers/AuthProvider";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

const PersonaCard = ({ initialPersona }: { initialPersona: UserPersona }) => {
  const [personaName, setPersonaName] = useState<string>(initialPersona.name);
  const [persona, setPersona] = useState<string>(initialPersona.person);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const { user } = useContext(AuthContext);

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
    if (!confirm(`Are you sure you want to delete "${personaName}"?`)) return;

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
    <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-var-color-borders transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            isActive ? 'bg-var-color-primary-button text-white' : 'bg-var-color-borders text-var-color-secondary-text'
          }`}>
            <FaUser className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-var-color-primary-text">
              {personaName}
            </h3>
            <p className="text-var-color-secondary-text text-sm">
              {isActive ? "Default Persona" : "Click to expand"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="px-2 py-1 bg-var-color-primary-button text-white text-xs rounded-full">
              Active
            </span>
          )}
          <FaTimes className={`text-var-color-disabled transition-transform ${
            isExpanded ? 'rotate-90' : 'rotate-0'
          }`} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 border-t border-var-color-borders">
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
                  <input
                    type="text"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text"
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
                  <textarea
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-var-color-primary-background border border-var-color-borders rounded-lg focus:ring-2 focus:ring-var-color-primary-button focus:border-transparent text-var-color-primary-text resize-none"
                    rows={6}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-var-color-borders text-var-color-secondary-text rounded-lg hover:bg-var-color-borders transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="px-4 py-2 bg-var-color-primary-button text-white rounded-lg hover:bg-var-color-primary-hover-state transition-colors flex items-center gap-2"
                >
                  <FaCheck className="w-4 h-4" />
                  Save Changes
                </button>
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
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-var-color-borders text-var-color-secondary-text rounded-lg hover:bg-var-color-borders transition-colors flex items-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={deletePersona}
                    className="px-4 py-2 border border-var-color-error text-var-color-error rounded-lg hover:bg-var-color-error hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FaTrash className="w-4 h-4" />
                    Delete
                  </button>
                </div>
                
                <button
                  onClick={usePersona}
                  disabled={isActive}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-var-color-primary-button text-white cursor-default'
                      : 'bg-var-color-secondary-button text-white hover:bg-var-color-secondary-hover-state'
                  }`}
                >
                  <FaCheck className="w-4 h-4" />
                  {isActive ? 'Currently Active' : 'Set as Default'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonaCard;