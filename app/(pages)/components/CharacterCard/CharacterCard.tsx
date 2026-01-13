"use client";

import Image from "next/image";
import { FiUser, FiMoreHorizontal, FiEye, FiEdit2, FiTrash2, FiPlay, FiStar } from "react-icons/fi";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dismissalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Mouse Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth Springs
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const floatX = useSpring(mouseX, springConfig);
  const floatY = useSpring(mouseY, springConfig);

  const [isHovered, setIsHovered] = useState(false);
  const [isInsidePreview, setIsInsidePreview] = useState(false);

  useEffect(() => {
    const handleCloseAllPreviews = (e: any) => {
      if (e.detail?.id !== characterId) {
        setIsHovered(false);
        setIsInsidePreview(false);
        if (dismissalTimeoutRef.current) {
          clearTimeout(dismissalTimeoutRef.current);
          dismissalTimeoutRef.current = null;
        }
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      }
    };

    const handleScroll = (e: Event) => {
      isScrollingRef.current = true;
      if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);

      // Immediate check: if scrolling moved the card away from the cursor, start dismissal
      if (isHovered && !isInsidePreview) {
        const isStillOver = containerRef.current?.matches(':hover');
        if (!isStillOver) handleMouseLeave();
      }

      scrollEndTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;

        // Final verification after scroll momentum stops
        setTimeout(() => {
          if (isHovered && !isInsidePreview) {
            const isStillOver = containerRef.current?.matches(':hover');
            if (!isStillOver) handleMouseLeave();
          }
        }, 50);
      }, 150);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isInsidePreview) return;

      const isOverContainer = containerRef.current?.contains(e.target as Node);
      const isOverPreview = previewRef.current?.contains(e.target as Node);

      if (!isOverContainer && !isOverPreview && !isHovered) return;

      if (isOverContainer || isOverPreview) {
        if (dismissalTimeoutRef.current) {
          clearTimeout(dismissalTimeoutRef.current);
          dismissalTimeoutRef.current = null;
          setIsHovered(true);
        }
      }

      let x = e.clientX + 20;
      let y = e.clientY - 230;

      const vWidth = window.innerWidth;
      const vHeight = window.innerHeight;

      if (x + 320 > vWidth - 20) {
        x = e.clientX - 340;
      }
      if (y < 20) y = 20;
      if (y + 460 > vHeight - 20) y = vHeight - 480;

      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node) && !previewRef.current?.contains(e.target as Node)) {
        setIsHovered(false);
        setIsInsidePreview(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("close-character-previews", handleCloseAllPreviews);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("close-character-previews", handleCloseAllPreviews);
    };
  }, [isHovered, isInsidePreview, mouseX, mouseY, characterId]);

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

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disableHover) return;

    window.dispatchEvent(new CustomEvent("close-character-previews", { detail: { id: characterId } }));

    if (dismissalTimeoutRef.current) {
      clearTimeout(dismissalTimeoutRef.current);
      dismissalTimeoutRef.current = null;
      setIsHovered(true);
      return;
    }

    let x = e.clientX + 20;
    let y = e.clientY - 230;
    const vWidth = window.innerWidth;
    const vHeight = window.innerHeight;
    if (x + 320 > vWidth - 20) x = e.clientX - 340;
    if (y < 20) y = 20;
    if (y + 460 > vHeight - 20) y = vHeight - 480;

    mouseX.set(x);
    mouseY.set(y);

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (isInsidePreview) return;

    const graceTime = isScrollingRef.current ? 300 : 150;

    if (dismissalTimeoutRef.current) clearTimeout(dismissalTimeoutRef.current);
    dismissalTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setIsInsidePreview(false);
      dismissalTimeoutRef.current = null;
    }, graceTime);
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-[240px] lg:h-[320px] flex flex-col cursor-pointer rounded-xl lg:rounded-2xl transition-all duration-300 group"
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

        <AnimatePresence>
          {isHovered && !disableHover && (
            <motion.div
              ref={previewRef}
              onMouseEnter={() => {
                setIsInsidePreview(true);
                if (dismissalTimeoutRef.current) {
                  clearTimeout(dismissalTimeoutRef.current);
                  dismissalTimeoutRef.current = null;
                }
              }}
              onMouseLeave={() => {
                setIsInsidePreview(false);
                handleMouseLeave();
              }}
              style={{ position: 'fixed', left: floatX, top: floatY, width: 320, zIndex: 1000 }}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full h-[460px] bg-zinc-950 border border-white/10 rounded-4xl shadow-[0_32px_128px_-12px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative">
                <div className="absolute inset-0 z-0">
                  {image ? <Image src={image} fill className={`object-cover ${shouldBlur ? 'blur-2xl' : 'opacity-40'}`} alt={characterName} /> : <div className="w-full h-full bg-zinc-900" />}
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/90 to-zinc-950/50" />
                </div>
                <div className="p-5 flex flex-col gap-3 relative z-10 h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none drop-shadow-lg">{characterName}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-zinc-400">{authorName}</span>
                        {rating > 0 && (
                          <div className="flex items-center gap-1 text-[11px] font-black text-yellow-400">
                            <FiStar size={8} className="fill-yellow-400" />
                            <span>{rating.toFixed(1)}</span>
                            <span className="text-zinc-600">({ratingCount})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="text-[11px] text-zinc-300 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanHtml(characterBio) }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags?.slice(0, 4).map((tag) => (
                      <span key={tag.id} className="px-2 py-1 text-[9px] font-black rounded-md border border-white/10 bg-black/60 text-zinc-400 uppercase tracking-wider">{tag.name}</span>
                    ))}
                  </div>
                  <div className="pt-4 mt-auto border-t border-white/10 flex gap-3 items-center">
                    <button onClick={(e) => { e.stopPropagation(); handleNavigate(e); }} className="flex-1 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                      <FiPlay size={12} className="fill-current" />
                      Chat Now
                    </button>
                    {isOwner && <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-white hover:bg-white/10 transition-colors border border-white/5"><FiEdit2 size={14} /></button>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
