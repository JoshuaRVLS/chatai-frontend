// CharacterCard.tsx
'use client';

import { CharacterTag, User } from "@/app/generated/prisma";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import defaultJPG from "@/public/default.jpg";
import { useRouter } from "next/navigation";
import { FiUser, FiMoreHorizontal } from "react-icons/fi";
import { motion } from "motion/react";

const CharacterCard = ({
  characterName,
  image,
  characterBio,
  authorName,
  characterId,
  className,
  tags,
  selectedTags,
}: {
  characterName: string;
  image: File | Blob | string | null;
  characterBio: string;
  authorName: string;
  characterId?: string;
  className?: string;
  tags?: { name: string; id: string }[];
  selectedTags?: { label: string; value: string }[];
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      return;
    }

    if (typeof image === "string") {
      setImageUrl(image);
      return;
    }

    const url = URL.createObjectURL(image);
    setImageUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image]);

  const displayTags = tags || selectedTags?.map(tag => ({ name: tag.label, id: tag.value }));

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const tagVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      onClick={() => characterId && router.push(`/character/${characterId}`)}
      className={`${className} group bg-var-color-for-dark-surface border border-var-color-borders rounded-xl overflow-hidden cursor-pointer transition-all duration-300 relative`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        y: -8, 
        borderColor: "var(--color-primary-button)" 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >

      

      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Image
              src={imageUrl || defaultJPG}
              fill
              className="object-cover transition-opacity duration-500"
              alt={`${characterName} image`}
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-var-color-borders shimmer flex items-center justify-center">
                <FiUser className="text-var-color-disabled w-8 h-8" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="w-full h-full bg-var-color-borders flex items-center justify-center"
            whileHover={{ backgroundColor: "var(--color-primary-background)" }}
            transition={{ duration: 0.3 }}
          >
            <FiUser className="text-var-color-disabled w-8 h-8" />
          </motion.div>
        )}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-var-color-for-dark-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
      </div>
      
      <motion.div 
        className="p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <motion.h3 
            className="font-semibold text-var-color-primary-text line-clamp-1 flex-1"
            whileHover={{ color: "var(--color-primary-button)" }}
            transition={{ duration: 0.2 }}
          >
            {characterName}
          </motion.h3>
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <FiMoreHorizontal className="text-var-color-disabled w-4 h-4 flex-shrink-0 mt-0.5" />
          </motion.div>
        </div>
        
        <motion.div 
          className="flex items-center gap-2 mb-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="w-2 h-2 bg-var-color-primary-button rounded-full animate-pulse-glow" />
          <span className="text-var-color-secondary-text text-sm">@{authorName}</span>
        </motion.div>

        <motion.p 
          className="text-var-color-secondary-text text-sm line-clamp-2 leading-relaxed mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {characterBio}
        </motion.p>

        {displayTags && displayTags.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-1"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            initial="hidden"
            animate="visible"
          >
            {displayTags.slice(0, 3).map((tag) => (
              <motion.span 
                className="px-2 py-1 bg-var-color-primary-background border border-var-color-borders text-var-color-secondary-text text-xs rounded-md"
                key={tag.id}
                variants={tagVariants}
                whileHover={{ scale: 1.1, backgroundColor: "var(--color-primary-button)", color: "white" }}
                transition={{ duration: 0.2 }}
              >
                {tag.name}
              </motion.span>
            ))}
            {displayTags.length > 3 && (
              <motion.span 
                className="px-2 py-1 bg-var-color-primary-background border border-var-color-borders text-var-color-disabled text-xs rounded-md"
                variants={tagVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                +{displayTags.length - 3}
              </motion.span>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CharacterCard;