"use client";

import Image from "next/image";
import { FiUser, FiMoreHorizontal } from "react-icons/fi";
import { motion } from "motion/react";
import React from "react";
import { useRouter } from "next/navigation";

interface CharacterCardProps {
  characterName: string;
  image: string | null;
  characterBio: string;
  authorName: string;
  characterId?: string;
  tags?: { name: string; id: string }[];
}

const CharacterCard = ({
  characterName,
  image,
  characterBio,
  authorName,
  characterId,
  tags,
}: CharacterCardProps) => {
  const router = useRouter();

  const handleNavigate = () => {
    if (characterId) {
      router.push(`/character/${characterId}`);
    }
  };

  return (
    <motion.div
      onClick={handleNavigate}
      className="group relative h-[340px] flex flex-col cursor-pointer overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0f172a]/40 backdrop-blur-md transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(56,189,248,0.1)]"
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Image Container */}
      <div className="relative h-[60%] w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-105"
            alt={characterName}
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-white/5">
            <FiUser className="text-white/10 w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80" />

        {/* Floating Badge */}
        <div className="absolute top-3 right-3 backdrop-blur-xl bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Active</span>
        </div>
      </div>

      {/* Info Content */}
      <div className="relative flex-1 p-4 flex flex-col justify-between -mt-8 backdrop-blur-xl bg-gradient-to-b from-transparent to-[#020617]/90">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight line-clamp-1 tracking-tighter italic uppercase">
              {characterName}
            </h3>
            <div className="p-1 px-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs">
              <FiMoreHorizontal />
            </div>
          </div>

          <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed font-medium">
            {characterBio}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1 pt-1">
            {tags?.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-[8px] font-black rounded-md border border-white/5 bg-white/5 text-primary/60 uppercase tracking-widest"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black text-white/30 uppercase tracking-tighter">
                {authorName.slice(0, 2)}
              </div>
              <span className="text-[10px] font-bold text-white/60 group-hover:text-primary transition-colors truncate max-w-[100px]">{authorName}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCard;
