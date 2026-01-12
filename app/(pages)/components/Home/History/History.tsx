"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  FiPlay,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiEye,
  FiMessageSquare,
  FiClock,
} from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from '@/app/lib/toast';
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { useSettings } from "@/app/hooks/useSettings";
import { formatDistanceToNow } from "date-fns";

const History = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { settings } = useSettings();
  const [tempUnblur, setTempUnblur] = useState<{ [key: string]: boolean }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { isPending, data, error } = useQuery<any[]>({
    queryKey: ["chatsHistory"],
    queryFn: async () => {
      const resp = await fetch("/api/chats");
      if (!resp.ok) throw new Error("Failed to fetch chats");
      const json = await resp.json();
      return json.chats || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
    }
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [data]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent | React.Touch | any, chatId: string) => {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    setShowContextMenu(null);

    if (!(await confirm({
      title: "Clear History",
      message: "Are you sure you want to remove this chat from your history? This action cannot be undone.",
      confirmLabel: "Terminate Record",
      variant: "danger"
    }))) return;

    queryClient.setQueryData(["chatsHistory"], (old: any[] | undefined) => {
      if (!old) return old;
      return old.filter(chat => chat.id !== chatId);
    });

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Chat removed from history");
        queryClient.invalidateQueries({ queryKey: ["chatsHistory"] });
      } else {
        toast.error("Failed to remove chat");
        queryClient.invalidateQueries({ queryKey: ["chatsHistory"] });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
      queryClient.invalidateQueries({ queryKey: ["chatsHistory"] });
    }
  };

  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    longPressTimer.current = setTimeout(() => {
      setContextMenuPos({ x, y });
      setShowContextMenu(chatId);
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

  useEffect(() => {
    const handleClose = () => setShowContextMenu(null);
    if (showContextMenu) {
      window.addEventListener("scroll", handleClose, { passive: true });
      window.addEventListener("click", handleClose);
      window.addEventListener("contextmenu", handleClose);
    }
    return () => {
      window.removeEventListener("scroll", handleClose);
      window.removeEventListener("click", handleClose);
      window.removeEventListener("contextmenu", handleClose);
    };
  }, [showContextMenu]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-10 px-6 md:px-12 py-8">
        <div className="h-6 w-40 bg-white/5 rounded-full shimmer" />
        <div className="flex gap-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[320px] h-44 rounded-4xl bg-white/5 shimmer border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col gap-10 relative group/history">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10 relative">
        <div className="absolute -bottom-px left-0 w-1/4 h-px bg-linear-to-r from-primary/30 to-transparent" />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Chronological Archives</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic flex items-baseline gap-4">
            YOUR HISTORY
            <span className="text-xl text-primary/30 not-italic font-black opacity-50">{data.length} {data.length === 1 ? "Record" : "Records"}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll("left")}
            disabled={!showLeftArrow}
            className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all ${showLeftArrow ? "opacity-100 hover:bg-white hover:text-slate-950 hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "opacity-0 pointer-events-none"
              }`}
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!showRightArrow}
            className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all ${showRightArrow ? "opacity-100 hover:bg-white hover:text-slate-950 hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "opacity-0 pointer-events-none"
              }`}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide -mx-6 md:-mx-12 px-6 md:px-12 snap-x"
      >
        {data.map((chat, index) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            onClick={(e) => {
              const shouldBlur = chat.character.isNsfw && settings?.blurNsfw && !tempUnblur[chat.id];
              if (shouldBlur) {
                e.preventDefault();
                setTempUnblur(prev => ({ ...prev, [chat.id]: true }));
              }
            }}
            className="group shrink-0 w-[380px] snap-start"
          >
            <motion.div
              className="relative overflow-hidden flex flex-col p-6 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_80px_rgba(0,0,0,0.4)]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onTouchStart={(e) => handleTouchStart(e, chat.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

              <div className="flex gap-5 items-start relative z-10">
                <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-white/5 shrink-0 border border-white/10 shadow-2xl">
                  {(() => {
                    const shouldBlur = chat.character.isNsfw && settings?.blurNsfw && !tempUnblur[chat.id];
                    const isLoading = imageLoading[chat.id] !== false;
                    return (
                      <>
                        {isLoading && (
                          <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                          </div>
                        )}
                        <Image
                          src={`/api/image/${chat.character.id}`}
                          fill
                          className={`object-cover transition-all duration-700 group-hover:scale-110 ${shouldBlur ? 'blur-xl grayscale-[0.5]' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                          alt={chat.character.name}
                          sizes="96px"
                          onLoad={() => setImageLoading(prev => ({ ...prev, [chat.id]: false }))}
                          onError={() => setImageLoading(prev => ({ ...prev, [chat.id]: false }))}
                        />
                        <AnimatePresence>
                          {shouldBlur && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-colors group-hover:bg-black/80"
                            >
                              <FiEye className="text-white text-xl mb-1 hover:scale-110 transition-transform" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })()}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-white truncate leading-none mb-2 tracking-tight uppercase italic group-hover:text-primary transition-colors">
                      {chat.character.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/10 text-[9px] font-black text-primary uppercase tracking-wider">
                        <FiMessageSquare className="w-2.5 h-2.5" />
                        {(chat._count?.messages || chat.messages.length)}
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-wider">
                        <FiClock className="w-2.5 h-2.5" />
                        {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative group/msg">
                <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed font-medium transition-colors group-hover/msg:text-white/80">
                  {chat.messages[0]?.content || "No transmission received."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">Access Code: #{chat.id.slice(-4).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Terminate Archival Signal"
                  >
                    <FiTrash2 size={14} />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-110 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all">
                    <FiPlay size={14} className="fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
        {showContextMenu && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
              className="fixed z-100 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
            >
              <button
                onClick={(e) => handleDeleteChat(e, showContextMenu)}
                className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 flex items-center gap-3 transition-colors"
              >
                <FiTrash2 size={14} />
                Terminate
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default History;

