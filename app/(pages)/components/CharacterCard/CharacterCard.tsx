"use client";

import Image from "next/image";
import { FiUser, FiEdit2, FiTrash2, FiStar, FiMessageCircle, FiEye } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
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
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isOwner) return;
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("close-context-menus", { detail: { id: characterId } }));
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOwner) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("close-context-menus", { detail: { id: characterId } }));
      setContextMenuPos({ x, y });
      setShowContextMenu(true);
      if ("vibrate" in navigator) navigator.vibrate(40);
      longPressTimer.current = null;
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    router.push(`/edit_character/${characterId}`);
  };

  const handleDelete = async () => {
    setShowContextMenu(false);
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

  useEffect(() => {
    const handleCloseAll = (e: any) => {
      if (e.detail?.id !== characterId) setShowContextMenu(false);
    };
    const handleClick = () => setShowContextMenu(false);
    const handleScroll = () => setShowContextMenu(false);
    window.addEventListener("close-context-menus", handleCloseAll);
    if (showContextMenu) {
      document.addEventListener("click", handleClick);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      window.removeEventListener("close-context-menus", handleCloseAll);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showContextMenu, characterId]);

  return (
    <>
      <div
        ref={containerRef}
        onClick={handleNavigate}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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

      <AnimatePresence>
        {showContextMenu && isOwner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ left: contextMenuPos.x, top: contextMenuPos.y }} className="fixed z-100 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[120px]">
            <button onClick={handleEdit} className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"><FiEdit2 size={14} /> Edit</button>
            <button onClick={handleDelete} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"><FiTrash2 size={14} /> Delete</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default CharacterCard;
