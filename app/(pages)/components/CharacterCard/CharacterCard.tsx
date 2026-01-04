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
      className="group relative h-[400px] flex flex-col cursor-pointer overflow-hidden rounded-[2rem] border border-white/5 bg-[#0f172a]/40 backdrop-blur-md transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(56,189,248,0.1)]"
      whileHover={{ y: -10 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Image Container with Parallax-like effect */}
      <div className="relative h-2/3 w-full overflow-hidden">
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
            <FiUser className="text-white/10 w-16 h-16" />
          </div>
        )}

        {/* Decorative Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating Badge */}
        <div className="absolute top-4 right-4 backdrop-blur-xl bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Active</span>
        </div>
      </div>

      {/* Info Content */}
      <div className="relative flex-1 p-6 flex flex-col justify-between -mt-12 backdrop-blur-xl bg-gradient-to-b from-transparent to-[#020617]/80">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors leading-tight line-clamp-1 tracking-tighter italic uppercase">
              {characterName}
            </h3>
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 group-hover:text-primary/70 transition-colors">
              <FiMoreHorizontal />
            </div>
          </div>

          <p className="text-xs text-white/50 line-clamp-3 leading-relaxed font-medium">
            {characterBio}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tags?.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 text-[9px] font-black rounded-lg border border-white/5 bg-white/5 text-primary/60 uppercase tracking-widest hover:border-primary/30 transition-colors"
              >
                {tag.name}
              </span>
            ))}
            {tags && tags.length > 3 && (
              <span className="px-2 py-1 text-[9px] font-black text-white/20 uppercase">
                +{tags.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center text-primary text-[10px] font-black uppercase tracking-tighter">
                {authorName.slice(0, 2)}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1">Architect</span>
                <span className="text-[11px] font-bold text-white/80 group-hover:text-primary transition-colors">{authorName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCard;
