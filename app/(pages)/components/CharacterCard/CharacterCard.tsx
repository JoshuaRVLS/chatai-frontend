"use client";
import { useCanvasGlow } from "@/app/(pages)/hooks/useCanvasGlow";
import Image from "next/image";
import { FiUser, FiMoreHorizontal } from "react-icons/fi";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import defaultJPG from "@/public/default.jpg";
import { useRouter } from "next/navigation";

const CharacterCard = ({
  characterName,
  image,
  characterBio,
  authorName,
  characterId,
  tags,
}: {
  characterName: string;
  image: File | Blob | string | null;
  characterBio: string;
  authorName: string;
  characterId?: string;
  tags?: { name: string; id: string }[];
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();
  const glowRef = useCanvasGlow();

  useEffect(() => {
    if (!image) return;
    if (typeof image === "string") {
      setImageUrl(image);
    } else {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [image]);

  return (
    <motion.div
      onClick={() => characterId && router.push(`/character/${characterId}`)}
      className="relative flex flex-col rounded-2xl overflow-hidden group cursor-pointer
                 border border-cyan-400/30 bg-[rgba(10,15,20,0.6)] backdrop-blur-xl
                 shadow-[0_0_20px_rgba(0,255,255,0.15)] transition-all duration-300
                 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] hover:border-cyan-400/70
                 h-[420px] w-full"
      whileHover={{ y: -8 }}
    >
      {/* Canvas Glow Background */}
      <canvas
        ref={glowRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Image Section (fixed height ratio) */}
      <div className="relative h-[60%] overflow-hidden z-10">
        {imageUrl ? (
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          >
            <Image
              src={imageUrl || defaultJPG}
              fill
              className="object-cover rounded-t-2xl opacity-90"
              alt={characterName}
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full bg-cyan-900/20">
            <FiUser className="text-cyan-300 w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
      </div>

      {/* Info Section (fills remaining space) */}
      <div className="relative z-10 flex flex-col justify-between p-4 flex-1">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-cyan-300 group-hover:text-white transition-colors duration-200 line-clamp-1">
              {characterName}
            </h3>
            <motion.div whileHover={{ rotate: 90 }}>
              <FiMoreHorizontal className="text-cyan-200/50 w-5 h-5" />
            </motion.div>
          </div>

          <p className="text-sm text-gray-400 line-clamp-2">{characterBio}</p>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 text-xs text-cyan-400/70">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />@
            {authorName}
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.slice(0, 3).map((tag) => (
                <motion.span
                  key={tag.id}
                  whileHover={{ scale: 1.1 }}
                  className="px-2 py-1 text-xs rounded-md border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 transition-all"
                >
                  {tag.name}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCard;
