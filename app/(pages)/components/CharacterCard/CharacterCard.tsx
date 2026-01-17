"use client";

import Image from "next/image";
import { FiUser, FiEdit2, FiTrash2, FiStar, FiMessageCircle, FiEye } from "react-icons/fi";
import { motion } from "motion/react";
import React, { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/hooks/useSettings";
import { AuthContext } from "../../providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from '@/app/lib/toast';
import { useAuthAction } from "@/app/hooks/useAuthAction";
import { cleanHtml } from "@/app/utils/clean-html";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";

interface CharacterCardProps {
  characterName: string;
  image: string | null;
  characterBio: string;
  authorName: string;
  authorId?: string;
  characterId?: string;
  isNsfw?: boolean;
  tags?: { name: string; id: string }[];
  disableHover?: boolean;
  rating?: number;
  ratingCount?: number;
  chatCount?: number;
  views?: number;
}

const CharacterCard = React.memo(function CharacterCard({
  characterName,
  image,
  characterBio,
  authorName,
  authorId,
  characterId,
  isNsfw,
  tags,
  disableHover = false,
  rating = 0,
  ratingCount = 0,
  chatCount = 0,
  views = 0,
}: CharacterCardProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const { user } = useContext(AuthContext);
  const { withAuth } = useAuthAction();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [tempUnblur, setTempUnblur] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile Check
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldBlur = isNsfw && settings?.blurNsfw && !tempUnblur;
  const isOwner = user?.id === authorId;

  const handleUnblur = withAuth(() => {
    setTempUnblur(true);
  });

  const handleNavigate = (e: React.MouseEvent) => {
    if (shouldBlur) {
      e.stopPropagation();
      handleUnblur();
      return;
    }
    if (characterId) {
      router.push(`/character/${characterId}`);
    }
  };



  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/edit_character/${characterId}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirm({
      title: "Deconstruct Identity",
      message: `Are you sure you want to permanently delete "${characterName}"? This process is irreversible.`,
      confirmLabel: "Delete Character",
      variant: "danger"
    }))) return;

    queryClient.setQueriesData({ queryKey: ["characters"] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) return old.filter((char: any) => char.id !== characterId);
      if (old.data && Array.isArray(old.data)) {
        return { ...old, data: old.data.filter((char: any) => char.id !== characterId) };
      }
      return old;
    });

    try {
      const res = await fetch(`/api/characters/${characterId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Character deleted");
        queryClient.invalidateQueries({ queryKey: ["characters"] });
      } else {
        toast.error("Failed to delete character");
      }
    } catch {
      toast.error("Failed to delete character");
    }
  };



  return (
    <>
      <div
        ref={containerRef}
        onClick={handleNavigate}
        draggable={false}
        className="relative h-[240px] lg:h-[320px] flex flex-col cursor-pointer rounded-xl lg:rounded-2xl transition-all duration-300 group select-none"
      >
        <div className="absolute inset-0 rounded-xl lg:rounded-2xl overflow-hidden border border-white/5 bg-zinc-950">
          <div className="relative h-full w-full">
            {image ? (
              <Image
                src={image}
                fill
                className={`object-cover object-top ${shouldBlur ? 'blur-xl grayscale-[0.5]' : ''}`}
                alt={characterName}
                sizes="(max-width: 768px) 50vw, 20vw"
                draggable={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white/5"><FiUser className="text-white/10 w-12 h-12" /></div>
            )}

            {/* Edit/Delete Buttons for Owner */}
            {isOwner && (
              <div className="absolute top-2 right-2 z-20 flex gap-2">
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg bg-black/60 text-white/50 hover:bg-white/20 hover:text-white transition-colors border border-white/5"
                  title="Edit Character"
                >
                  <FiEdit2 size={12} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg bg-black/60 text-white/50 hover:bg-red-500/20 hover:text-red-500 transition-colors border border-white/5"
                  title="Delete Character"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-4">
              <div className="flex justify-between items-end mb-1">
                <h3 className="text-xs lg:text-sm font-black text-white leading-tight line-clamp-1 uppercase shadow-black drop-shadow-md flex-1 pr-2">{characterName}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/60 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/5">
                    <FiEye size={8} />
                    <span>{views}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/60 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/5">
                    <FiMessageCircle size={8} />
                    <span>{chatCount}</span>
                  </div>
                  {rating > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-black text-yellow-400 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/5">
                      <FiStar size={8} className="fill-yellow-400" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[9px] text-zinc-500 line-clamp-1 font-medium mt-1" dangerouslySetInnerHTML={{ __html: cleanHtml(characterBio) }} />
            </div>
          </div>
        </div>
      </div>


    </>
  );
});

export default CharacterCard;
