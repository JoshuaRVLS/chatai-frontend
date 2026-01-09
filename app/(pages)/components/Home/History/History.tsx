"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  FiPlay,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from '@/app/lib/toast';
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { useSettings } from "@/app/hooks/useSettings";
import { FiEye } from "react-icons/fi";

const History = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { settings } = useSettings();
  const [tempUnblur, setTempUnblur] = useState<{ [key: string]: boolean }>({});

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
      // Initial check
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

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!(await confirm({
      title: "Clear History",
      message: "Are you sure you want to remove this chat from your history? This action cannot be undone.",
      confirmLabel: "Terminate Record",
      variant: "danger"
    }))) return;

    // Optimistic Update
    queryClient.setQueryData(["chatsHistory"], (old: any[] | undefined) => {
      if (!old) return old;
      return old.filter(chat => chat.id !== chatId);
    });

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Chat removed from history");
        await queryClient.invalidateQueries({ queryKey: ["chatsHistory"] });
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
    <div className="flex flex-col gap-10 px-6 md:px-12 relative group/history">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10 relative">
        <div className="absolute -bottom-px left-0 w-1/4 h-px bg-linear-to-r from-primary/30 to-transparent" />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Continue your journey</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic flex items-baseline gap-4">
            Chat History
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
        className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide -mx-6 px-6 snap-x"
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
            className="group shrink-0 w-[340px] snap-start"
          >
            <motion.div
              className="relative h-44 flex gap-6 p-5 items-center rounded-4xl border border-white/5 bg-[#0f172a]/40 backdrop-blur-md hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(56,189,248,0.1)]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/5 shrink-0 border border-white/5 shadow-xl">
                {(() => {
                  const shouldBlur = chat.character.isNsfw && settings?.blurNsfw && !tempUnblur[chat.id];
                  return (
                    <>
                      <Image
                        src={`/api/image/${chat.character.id}`}
                        fill
                        className={`object-cover transition-transform duration-700 group-hover:scale-110 ${shouldBlur ? 'blur-xl grayscale-[0.5]' : ''}`}
                        alt={chat.character.name}
                        sizes="112px"
                      />
                      <AnimatePresence>
                        {shouldBlur && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-colors group-hover:bg-black/60"
                          >
                            <FiEye className="text-white/60 text-lg mb-1" />
                            <p className="text-[8px] font-black text-white uppercase tracking-widest text-center px-2">Reveal Content</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
                <div className="absolute inset-0 bg-linear-to-t from-[#020617]/40 to-transparent" />
              </div>

              <div className="flex flex-col justify-between flex-1 min-w-0 h-full py-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white truncate group-hover:text-primary transition-colors tracking-tight italic uppercase">
                    {chat.character.name}
                  </h3>
                  <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed font-medium">
                    {chat.messages[0]?.content || "No active signal detected."}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-[9px] text-primary/60 uppercase tracking-widest font-black">
                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    {(chat._count?.messages || chat.messages.length)} {(chat._count?.messages || chat.messages.length) === 1 ? "Message" : "Messages"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <FiTrash2 size={12} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-slate-950 scale-0 group-hover:scale-100 transition-transform">
                      <FiPlay size={10} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default History;
