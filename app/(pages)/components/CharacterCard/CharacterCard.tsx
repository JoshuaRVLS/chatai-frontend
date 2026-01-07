"use client";

import Image from "next/image";
import { FiUser, FiMoreHorizontal, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/hooks/useSettings";
import { AuthContext } from "../../providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface CharacterCardProps {
  characterName: string;
  image: string | null;
  characterBio: string;
  authorName: string;
  authorId?: string;
  characterId?: string;
  isNsfw?: boolean;
  tags?: { name: string; id: string }[];
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
}: CharacterCardProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [tempUnblur, setTempUnblur] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const shouldBlur = isNsfw && settings?.blurNsfw && !tempUnblur;
  const isOwner = user?.id === authorId;

  const handleNavigate = (e: React.MouseEvent) => {
    if (shouldBlur) {
      e.stopPropagation();
      setTempUnblur(true);
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

    // Close any other open context menus globally
    window.dispatchEvent(new CustomEvent("close-context-menus", { detail: { id: characterId } }));

    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    router.push(`/edit_character/${characterId}`);
  };

  const handleDelete = async () => {
    setShowContextMenu(false);
    if (!confirm(`Delete "${characterName}"? This cannot be undone.`)) return;

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

  // Global menu closure handlers
  React.useEffect(() => {
    const handleCloseAll = (e: any) => {
      // If the event was triggered by another card, close this one
      if (e.detail?.id !== characterId) {
        setShowContextMenu(false);
      }
    };

    const handleClick = () => setShowContextMenu(false);

    // Close on any right click elsewhere on the window
    const handleWindowContextMenu = (e: MouseEvent) => {
      // If we're right-clicking outside of any card context, close open ones
      // This is partially handled by handleContextMenu preventing bubble,
      // but this ensures background right-clicks also clear menus.
      setShowContextMenu(false);
    };

    window.addEventListener("close-context-menus", handleCloseAll);
    if (showContextMenu) {
      document.addEventListener("click", handleClick);
      window.addEventListener("contextmenu", handleWindowContextMenu);
    }

    return () => {
      window.removeEventListener("close-context-menus", handleCloseAll);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("contextmenu", handleWindowContextMenu);
    };
  }, [showContextMenu, characterId]);

  return (
    <>
      <motion.div
        onClick={handleNavigate}
        onContextMenu={handleContextMenu}
        className="group relative h-[240px] flex flex-col cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 transition-[border-color,box-shadow,transform] duration-300 hover:border-white/20 hover:shadow-lg will-change-transform"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 240px' } as any}
        whileHover={{ y: -4 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Image Container */}
        <div className="relative h-[55%] w-full overflow-hidden">
          {image ? (
            <div className="relative w-full h-full">
              <Image
                src={image}
                fill
                className={`object-cover object-top transition-all duration-700 group-hover:scale-105 ${shouldBlur ? 'blur-2xl scale-110 grayscale-[0.5]' : ''}`}
                alt={characterName}
                sizes="(max-width: 768px) 50vw, 20vw"
              />

              {/* NSFW Blur Overlay - only covers image area */}
              <AnimatePresence>
                {shouldBlur && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                      <FiEye className="text-white/40 text-lg" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-[8px] font-black text-white/80 uppercase tracking-widest">Sensitive</p>
                      <p className="text-[7px] font-bold text-white/30 uppercase tracking-tighter">Click to Reveal</p>
                    </div>

                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-zinc-800 border border-white/5">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">NSFW</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-white/5">
              <FiUser className="text-white/10 w-12 h-12" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-[#020617] via-transparent to-transparent opacity-80 pointer-events-none" />

          {/* Floating Badge */}
          <div className="absolute top-2 right-2 bg-black/50 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Linked</span>
          </div>
        </div>

        {/* Info Content - removed z-20 for better batching, removed backdrop-blur */}
        <div className="relative flex-1 p-2.5 flex flex-col justify-between -mt-4 bg-zinc-950/95">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-white group-hover:text-zinc-400 transition-colors leading-tight line-clamp-1 tracking-tight uppercase">
                {characterName}
              </h3>
              <div className="p-1 rounded-md bg-white/5 border border-white/5 text-white/20 text-[9px]">
                <FiMoreHorizontal />
              </div>
            </div>

            <p className="text-[9px] text-zinc-500 line-clamp-2 leading-snug font-medium">
              {characterBio}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1 pt-0.5">
              {Array.from(new Map(tags?.map(tag => [tag.id, tag])).values()).slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-[7px] font-black rounded-sm border border-white/5 bg-white/5 text-zinc-500 uppercase tracking-wider"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[6px] font-black text-white/20 uppercase tracking-tighter">
                  {authorName.slice(0, 2)}
                </div>
                <span className="text-[8px] font-bold text-zinc-500 group-hover:text-white transition-colors truncate max-w-[80px]">{authorName}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right-click Context Menu */}
      <AnimatePresence>
        {showContextMenu && isOwner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            className="fixed z-100 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[120px]"
          >
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
            >
              <FiEdit2 size={14} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
            >
              <FiTrash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default CharacterCard;

