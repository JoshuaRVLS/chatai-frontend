// Characters.tsx 
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import CharacterCard from "../../CharacterCard/CharacterCard";
import { CharactersData } from "@/@types/type";
import { motion } from "motion/react";

const Characters = () => {
  const { isPending, error, data } = useQuery<CharactersData>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  if (isPending) {
    return (
      <motion.div 
        className="flex flex-col gap-4 w-full pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-3xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Community Characters
        </motion.h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="card bg-var-color-for-dark-surface border border-var-color-borders rounded-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="aspect-[4/3] bg-var-color-borders shimmer"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-var-color-borders rounded shimmer"></div>
                <div className="h-3 bg-var-color-borders rounded shimmer w-3/4"></div>
                <div className="h-3 bg-var-color-borders rounded shimmer w-1/2"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.p 
        className="text-var-color-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {error.message}
      </motion.p>
    );
  }

  // Only animate if data is loaded
  const shouldAnimate = !!data && data.length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div 
      className="flex flex-col gap-4 w-full pb-8"
      initial={shouldAnimate ? "hidden" : false}  // Skip initial hidden if no data
      animate={shouldAnimate ? "visible" : { opacity: 1 }}  // Animate only when data is ready
      variants={containerVariants}
    >
      <motion.h1 
        className="text-3xl"
        variants={itemVariants}
      >
        Community Characters
      </motion.h1>
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full"
      >
        {data.map((character, index) => (
          <motion.div
            key={character.id}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0, 196, 179, 0.3)" }}
            transition={{ type: "spring", stiffness: 300 }}
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
      </motion.div>
    </motion.div>
  );
};

export default Characters;
