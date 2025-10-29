"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import CharacterCard from "../CharacterCard/CharacterCard";
import { FaPencilAlt, FaTrash, FaPlus, FaUser, FaRobot } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, Variants } from "motion/react";
import { CharactersData } from "@/@types/type"; // adjust the import path to your type definitions

const MyCharacters: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [hasAnimated, setHasAnimated] = useState(false);

  const { isPending, data, error } = useQuery<CharactersData>({
    queryKey: ["myCharacters", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/my-characters/${user?.id}`);
      const json = await res.json();
      return json.data as CharactersData;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (data && !hasAnimated) setHasAnimated(true);
  }, [data, hasAnimated]);

  const deleteChar = async (characterId: string, characterName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${characterName}"? This action cannot be undone.`
      )
    )
      return;

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Character deleted successfully");
        window.location.reload();
      } else {
        toast.error("Failed to delete character");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the character");
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.05, ease: "easeOut" },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, rotateX: -10 },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (isPending)
    return (
      <div className="min-h-screen bg-[var(--color-primary-background)] pt-24 px-6 animate-pulse">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-var-color-borders rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 bg-var-color-borders rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary-background)] pt-20 px-6">
        <p className="text-var-color-error text-lg">Error loading characters</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--color-primary-background)] pt-24 pb-12 px-6 sm:px-12">
      <motion.div
        key="characters-page"
        initial={!hasAnimated ? { opacity: 0, y: 15 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto flex flex-col gap-10"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-var-color-primary-text mb-2">
              My Characters
            </h1>
            <p className="text-var-color-secondary-text text-sm sm:text-base">
              Manage your AI characters and create new ones
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              href="/create_character"
              className="bg-[var(--color-primary-button)] text-white px-5 sm:px-6 py-3 rounded-lg hover:bg-[var(--color-primary-hover-state)] shadow-lg flex items-center justify-center gap-2 font-semibold"
            >
              <FaPlus className="w-4 h-4" />
              Create New
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-[var(--color-for-dark-surface)] border border-[var(--color-borders)] rounded-xl p-5 flex items-center gap-4 backdrop-blur-xl">
            <div className="p-3 bg-[var(--color-primary-button)] rounded-lg">
              <FaRobot className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-primary-text)]">
                {data?.length || 0}
              </p>
              <p className="text-[var(--color-secondary-text)] text-sm">
                Total Characters
              </p>
            </div>
          </div>
        </motion.div>

        {/* Character Grid */}
        {data && data.length > 0 ? (
          <motion.div
            key={data?.length}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {data.map((character) => (
              <motion.div
                key={character.id}
                variants={cardVariants}
                whileHover={{
                  scale: 1.03,
                  rotateX: 2,
                  boxShadow: "0 8px 25px rgba(0,196,179,0.25)",
                }}
                transition={{ type: "spring", stiffness: 250, damping: 15 }}
                className="group relative bg-[var(--color-for-dark-surface)] border border-[var(--color-borders)] rounded-xl overflow-hidden transition-all duration-300"
              >
                <CharacterCard
                  characterName={character.name}
                  image={
                    character.photo?.data
                      ? `data:${character.photo.mimetype};base64,${Buffer.from(
                          Object.values(character.photo.data)
                        ).toString("base64")}`
                      : null
                  }
                  characterId={character.id}
                  characterBio={character.bio}
                  authorName={character.author.username}
                  tags={character.tags}
                />

                {/* Desktop Hover Buttons */}
                <div className="hidden sm:flex absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                  <Link
                    href={`/edit_character/${character.id}`}
                    className="p-2 bg-[var(--color-for-dark-surface)]/80 backdrop-blur-sm border border-[var(--color-borders)] rounded-lg hover:bg-[var(--color-primary-button)] hover:text-white transition-colors shadow-md"
                    title="Edit character"
                  >
                    <FaPencilAlt className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => deleteChar(character.id, character.name)}
                    className="p-2 bg-[var(--color-for-dark-surface)]/80 backdrop-blur-sm border border-[var(--color-borders)] rounded-lg hover:bg-[var(--color-error)] hover:text-white transition-colors shadow-md"
                    title="Delete character"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>

                {/* Mobile Action Bar */}
                <div className="sm:hidden border-t border-[var(--color-borders)] bg-[var(--color-primary-background)]/80 p-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/edit_character/${character.id}`}
                      className="flex-1 bg-[var(--color-primary-button)] text-white py-2 px-3 rounded text-sm font-medium text-center flex items-center justify-center gap-1"
                    >
                      <FaPencilAlt className="w-3 h-3" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteChar(character.id, character.name)}
                      className="flex-1 bg-[var(--color-error)] text-white py-2 px-3 rounded text-sm font-medium text-center flex items-center justify-center gap-1"
                    >
                      <FaTrash className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto px-4">
              <div className="w-24 h-24 mx-auto mb-6 bg-[var(--color-borders)] rounded-full flex items-center justify-center">
                <FaUser className="text-[var(--color-disabled)] w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold text-[var(--color-primary-text)] mb-2">
                No characters yet
              </h3>
              <p className="text-[var(--color-secondary-text)] mb-6">
                Create your first AI character to start chatting and sharing
                with the community.
              </p>
              <Link
                href="/create_character"
                className="bg-[var(--color-primary-button)] text-white px-6 py-3 rounded-lg hover:bg-[var(--color-primary-hover-state)] transition-all duration-200 inline-flex items-center justify-center gap-2 font-semibold"
              >
                <FaPlus className="w-4 h-4" />
                Create Your First Character
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MyCharacters;
