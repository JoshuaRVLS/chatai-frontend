"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from '@/app/lib/toast';
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { useSettings } from "@/app/hooks/useSettings";
import HistoryCard from "./HistoryCard";

const History = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { settings } = useSettings();


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
      const showLeft = scrollLeft > 20;
      const showRight = scrollLeft < scrollWidth - clientWidth - 20;

      if (showLeft !== showLeftArrow) setShowLeftArrow(showLeft);
      if (showRight !== showRightArrow) setShowRightArrow(showRight);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
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
    if (e.stopPropagation) e.stopPropagation();

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



  if (isPending) {
    return (
      <div className="flex flex-col gap-6 px-6 md:px-12 py-4">
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
    <div className="flex flex-col gap-6 relative group/history">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6 mb-6 relative">
        <div className="absolute -bottom-px left-0 w-1/4 h-px bg-linear-to-r from-primary/30 to-transparent" />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Continue your last chat</span>
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
        className="flex gap-4 overflow-x-auto pb-6 -mx-6 md:-mx-12 px-6 md:px-12 snap-x snap-mandatory scroll-pl-6 md:scroll-pl-12 no-scrollbar"
      >
        {data.map((chat) => (
          <HistoryCard
            key={chat.id}
            chat={chat}
            onDelete={handleDeleteChat}
          />
        ))}

      </div>
    </div>
  );
};

export default React.memo(History);

