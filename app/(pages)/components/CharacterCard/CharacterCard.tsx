"use client";

import Image from "next/image";
import { FiUser, FiMoreHorizontal, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/hooks/useSettings";
import { AuthContext } from "../../providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from '@/app/lib/toast';
import { useAuthAction } from "@/app/hooks/useAuthAction";
import { cleanHtml } from "@/app/utils/clean-html";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { FiStar } from "react-icons/fi";

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
}: CharacterCardProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const { user } = useContext(AuthContext);
  const { withAuth } = useAuthAction();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [tempUnblur, setTempUnblur] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

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

    // Close any other open context menus globally
    window.dispatchEvent(new CustomEvent("close-context-menus", { detail: { id: characterId } }));

    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOwner) return;

    // Clear any existing timer
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
    }, 450); // Faster long-press for snappier feel
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

    // Optimistic Update across all character queries (lists, feed, etc.)
    queryClient.setQueriesData({ queryKey: ["characters"] }, (old: any) => {
      if (!old) return old;
      // Handle simple array response
      if (Array.isArray(old)) {
        return old.filter((char: any) => char.id !== characterId);
      }
      // Handle paginated response format { data: [], meta: {} }
      if (old.data && Array.isArray(old.data)) {
        return {
          ...old,
          data: old.data.filter((char: any) => char.id !== characterId)
        };
      }
      return old;
    });

    queryClient.setQueriesData({ queryKey: ["current-user-characters"] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.filter((char: any) => char.id !== characterId);
      }
      if (old.data && Array.isArray(old.data)) {
        return {
          ...old,
          data: old.data.filter((char: any) => char.id !== characterId)
        };
      }
      return old;
    });

    try {
      const res = await fetch(`/api/characters/${characterId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Character deleted");
        // Trigger background invalidation without awaiting
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        queryClient.invalidateQueries({ queryKey: ["current-user-characters"] });
        queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
      } else {
        toast.error("Failed to delete character");
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        queryClient.invalidateQueries({ queryKey: ["current-user-characters"] });
        queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
      }
    } catch {
      toast.error("Failed to delete character");
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-characters"] });
      queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
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
    const handleScroll = () => setShowContextMenu(false);

    // Close on any right click elsewhere on the window
    const handleWindowContextMenu = (e: MouseEvent) => {
      setShowContextMenu(false);
    };

    window.addEventListener("close-context-menus", handleCloseAll);
    if (showContextMenu) {
      document.addEventListener("click", handleClick);
      window.addEventListener("contextmenu", handleWindowContextMenu);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("close-context-menus", handleCloseAll);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("contextmenu", handleWindowContextMenu);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showContextMenu, characterId]);

  return (
    <>
      <motion.div
        onClick={handleNavigate}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={`relative h-[240px] lg:h-[320px] flex flex-col cursor-pointer rounded-xl lg:rounded-2xl transition-all duration-300 isolate ${!disableHover ? 'group' : ''}`}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 240px' } as any}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Base Card (Visible by Default, Hidden on Hover) */}
        <div className="absolute inset-0 rounded-xl lg:rounded-2xl overflow-hidden border border-white/5 bg-zinc-950 opacity-100 group-hover:opacity-0 transition-opacity duration-200">
          <div className="relative h-full w-full">
            {image ? (
              <Image
                src={image}
                fill
                className={`object-cover object-top ${shouldBlur ? 'blur-xl grayscale-[0.5]' : ''}`}
                alt={characterName}
                sizes="(max-width: 768px) 50vw, 20vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white/5"><FiUser className="text-white/10 w-12 h-12" /></div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-[#020617] via-[#020617]/80 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-4">
              <div className="flex justify-between items-end mb-1">
                <h3 className="text-xs lg:text-sm font-black text-white leading-tight line-clamp-1 uppercase shadow-black drop-shadow-md flex-1 pr-2">{characterName}</h3>
                {rating > 0 && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-yellow-400 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/5">
                    <FiStar size={8} className="fill-yellow-400" />
                    <span>{rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="text-[9px] text-zinc-500 line-clamp-1 font-medium mt-1 [&_p]:inline [&_br]:hidden" dangerouslySetInnerHTML={{ __html: cleanHtml(characterBio) }} />
            </div>
          </div>
        </div>

        {/* Floating "Mini Profile" (Visible on Hover) */}
        <div className="absolute -top-3 -left-3 -right-3 z-50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
          <div className="w-full h-auto min-h-[calc(100%+1.5rem)] bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">

            {/* Full Background Image */}
            <div className="absolute inset-0 z-0">
              {image ? (
                <Image
                  src={image}
                  fill
                  className={`object-cover ${shouldBlur ? 'blur-2xl' : 'opacity-40'}`}
                  alt={characterName}
                />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3 relative z-10 h-full">
              {/* Header: Title & Meta */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none drop-shadow-lg">{characterName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-zinc-400">{authorName}</span>
                    {rating > 0 && (
                      <>
                        <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                        <div className="flex items-center gap-1 text-[9px] font-black text-yellow-400">
                          <FiStar size={8} className="fill-yellow-400" />
                          <span>{rating.toFixed(1)}</span>
                          <span className="text-zinc-600">({ratingCount})</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                  <span className="text-[8px] font-black text-white/80 uppercase tracking-widest">Lv. 1</span>
                </div>
              </div>

              {/* Scrollable Bio */}
              <div
                className="text-[11px] text-zinc-300 font-medium leading-relaxed max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40 wrap-break-word shadow-black drop-shadow-sm prose prose-invert prose-p:my-1 prose-headings:text-white prose-headings:text-xs prose-strong:text-white prose-a:text-cyan-400"
                dangerouslySetInnerHTML={{ __html: cleanHtml(characterBio) }}
              />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Interactive Tags */}
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Map(tags?.map(tag => [tag.id, tag])).values()).slice(0, 4).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success(`Filter by: ${tag.name}`);
                    }}
                    className="px-2 py-1 text-[9px] font-black rounded-md border border-white/10 bg-black/40 text-zinc-400 uppercase tracking-wider hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 mt-1 border-t border-white/10 flex gap-2">

                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                  className="p-2.5 bg-white/5 text-white/40 rounded-xl hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                >
                  <FiEdit2 size={14} />
                </button>
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

