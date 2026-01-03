"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  FiPlay,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

const History = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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

  if (isPending) {
    return (
      <div className="flex flex-col gap-10 px-6 md:px-12 py-8">
        <div className="h-6 w-40 bg-white/5 rounded-full shimmer" />
        <div className="flex gap-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[320px] h-44 rounded-[2rem] bg-white/5 shimmer border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 px-6 md:px-12 py-8 relative group/history">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white/90 italic flex items-center gap-4">
          <span className="w-12 h-1 bg-primary rounded-full" />
          Chat History
        </h2>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!showLeftArrow}
            className={`p-2 rounded-xl bg-white/5 border border-white/10 text-white transition-all ${showLeftArrow ? "opacity-100 hover:bg-primary hover:text-slate-950 hover:border-primary" : "opacity-0 pointer-events-none"
              }`}
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!showRightArrow}
            className={`p-2 rounded-xl bg-white/5 border border-white/10 text-white transition-all ${showRightArrow ? "opacity-100 hover:bg-primary hover:text-slate-950 hover:border-primary" : "opacity-0 pointer-events-none"
              }`}
          >
            <FiChevronRight size={16} />
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
            className="group flex-shrink-0 w-[340px] snap-start"
          >
            <motion.div
              className="relative h-44 flex gap-6 p-5 items-center rounded-[2rem] border border-white/5 bg-[#0f172a]/40 backdrop-blur-md hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(56,189,248,0.1)]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/5 shadow-xl">
                <Image
                  src={`/api/image/${chat.character.id}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={chat.character.name}
                  sizes="112px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/40 to-transparent" />
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
                    {chat._count?.messages || chat.messages.length} Packets
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-slate-950 scale-0 group-hover:scale-100 transition-transform">
                    <FiPlay size={10} className="fill-current ml-0.5" />
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
