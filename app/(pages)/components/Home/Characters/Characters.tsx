"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import CharacterCard from "../../CharacterCard/CharacterCard";
import { CharactersData } from "@/@types/type";
import { motion, AnimatePresence } from "motion/react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

const Characters = () => {
  const { isPending, error, data, refetch } = useQuery<CharactersData>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  // =========================
  // 💠 Pending (Loading)
  // =========================
  if (isPending) {
    return (
      <motion.div
        className="flex flex-col gap-4 w-full pb-8 px-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-3xl font-semibold text-cyan-300 mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Community Characters
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.95, 1, 0.95],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
              className="card bg-[rgba(10,20,25,0.8)] border border-cyan-400/20 rounded-xl overflow-hidden backdrop-blur-md"
            >
              <div className="aspect-[4/3] bg-cyan-400/10 shimmer relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-cyan-400/10 rounded shimmer"></div>
                <div className="h-3 bg-cyan-400/10 rounded w-3/4 shimmer"></div>
                <div className="h-3 bg-cyan-400/10 rounded w-1/2 shimmer"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-cyan-400/70 text-sm text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Loading community creations...
        </motion.p>
      </motion.div>
    );
  }

  // =========================
  // ❌ Error Animation
  // =========================
  if (error) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{
            x: [-10, 10, -8, 8, 0],
          }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
            <FiAlertTriangle className="text-red-400 w-10 h-10" />
          </div>
          <h3 className="text-lg font-semibold text-red-400 mt-3">
            Failed to load characters
          </h3>
          <p className="text-red-400/70 text-sm">
            {error.message || "Something went wrong fetching the data."}
          </p>
        </motion.div>

        <motion.button
          onClick={() => refetch()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg"
        >
          <FiRefreshCw className="animate-spin-slow" /> Retry
        </motion.button>
      </motion.div>
    );
  }

  // =========================
  // ✅ Main Grid
  // =========================
  const shouldAnimate = !!data && data.length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // ✅ Fixed section of your Characters component
  return (
    <motion.div
      className="flex flex-col gap-4 w-full pb-8 px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1
        className="text-3xl font-semibold text-cyan-300 mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Community Characters
      </motion.h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full">
        {data?.map((character, index) => (
          <motion.div
            key={character.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 30px rgba(0, 255, 255, 0.3)",
            }}
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Characters;
