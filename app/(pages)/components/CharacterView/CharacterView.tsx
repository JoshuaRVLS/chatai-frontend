"use client";

import {
  FiMessageCircle,
  FiUser,
  FiPlay,
  FiChevronDown,
  FiChevronUp,
  FiTag,
  FiAward,
  FiStar,
} from "react-icons/fi";
import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useContext, useEffect, useRef, useState } from "react";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "../../providers/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import Comments from "../Comments/Comments";
import { useSettings } from "@/app/hooks/useSettings";
import { FiEye } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useAuthAction } from "@/app/hooks/useAuthAction";

const CharacterView = ({ id }: { id: string }) => {
  const { isPending, error, data } = useQuery<
    Character & {
      author: User;
      photo: { data: Uint8Array; mimetype: string; name: string };
      tags: CharacterTag[];
    }
  >({
    queryKey: ["character", id],
    queryFn: () =>
      fetch(`/api/characters/${id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  const { user } = useContext(AuthContext);
  const { withAuth } = useAuthAction();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [tempUnblur, setTempUnblur] = useState(false);
  const shouldBlur = data?.isNsfw && settings?.blurNsfw && !tempUnblur;

  const [expandedSections, setExpandedSections] = useState({
    biography: true,
    scenario: false,
    persona: false,
    intro: false,
  });

  const startChat = withAuth(async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: id, userId: user?.id }),
      });
      if (!res.ok) return;
      const { chat } = await res.json();

      // Invalidate history cache to ensure new chat appears
      queryClient.invalidateQueries({ queryKey: ["chatsHistory"] });

      router.push(`/chat/${chat.id}`);
    } catch (e) {
      console.error(e);
    }
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-600 font-bold tracking-widest text-[8px] uppercase">Initializing...</p>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-error font-bold">
        Error: {error.message}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 selection:bg-white/10">
      {/* Dynamic Header Background */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Sidebar - Visuals & Actions */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => shouldBlur && setTempUnblur(true)}
              className={`relative w-full aspect-3/4 overflow-hidden rounded-3xl border border-white/10 group shadow-2xl ${shouldBlur ? 'cursor-pointer' : ''}`}
            >
              <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Image
                src={`/api/image/${id}`}
                alt={data?.name || 'Character image'}
                fill
                className={`object-cover transition-transform duration-700 group-hover:scale-105 ${shouldBlur ? 'blur-3xl scale-110' : ''}`}
                priority
              />

              {/* NSFW Blur Overlay */}
              <AnimatePresence>
                {shouldBlur && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-colors group-hover:bg-black/60"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                      <FiEye className="text-white/60 text-2xl" />
                    </div>
                    <div className="p-5 flex flex-col gap-5">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Archive Entry</p>
                        <div className="mb-4 p-4 rounded-xl bg-white/1 border border-white/5 space-y-3 text-[11px] leading-relaxed text-zinc-400 font-medium italic">
                          &ldquo;{data?.bio}&rdquo;
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-6 left-6 px-4 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">NSFW</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-zinc-950/90 z-10 pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active System</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic leadning-none">{data?.name}</h1>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={startChat}
              className="w-full py-4 bg-white text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              <FiMessageCircle size={14} />
              Protocol Start
            </motion.button>

            <div className="bg-white/1 p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Architect</h4>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <FiUser className="text-zinc-400 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-tight">{data?.author.username}</p>
                  <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Verified Creator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Details */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Classification Tags</p>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white/2 border border-white/5">
                  {data?.tags?.map((tag: any) => (
                    <span key={tag.id} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-zinc-500 uppercase tracking-wider hover:text-white transition-colors cursor-default">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Collapsible Sections */}
            <div className="space-y-4">
              <CollapsibleSection
                title="Biography"
                icon={<FiAward />}
                isOpen={expandedSections.biography}
                onToggle={() => setExpandedSections(prev => ({ ...prev, biography: !prev.biography }))}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/70 prose-p:leading-relaxed prose-headings:text-white prose-strong:text-white prose-em:text-white/80">
                  <ReactMarkdown>{data.bio}</ReactMarkdown>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Scenario"
                icon={<FiPlay />}
                isOpen={expandedSections.scenario}
                onToggle={() => setExpandedSections(prev => ({ ...prev, scenario: !prev.scenario }))}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/50 prose-p:leading-loose prose-headings:text-white prose-strong:text-white/70">
                  <ReactMarkdown>{data.scenario}</ReactMarkdown>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Persona"
                icon={<FiUser />}
                isOpen={expandedSections.persona}
                onToggle={() => setExpandedSections(prev => ({ ...prev, persona: !prev.persona }))}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/50 prose-p:leading-loose prose-headings:text-white prose-strong:text-white/70">
                  <ReactMarkdown>{data.persona}</ReactMarkdown>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Greeting Protocol"
                icon={<FiMessageCircle />}
                isOpen={expandedSections.intro}
                onToggle={() => setExpandedSections(prev => ({ ...prev, intro: !prev.intro }))}
              >
                <div className="p-4 rounded-xl bg-white/2 border border-white/5 prose prose-invert prose-sm max-w-none prose-p:text-white/80 prose-p:leading-relaxed prose-p:italic prose-headings:text-white">
                  <ReactMarkdown>{data.introMessage}</ReactMarkdown>
                </div>
              </CollapsibleSection>
            </div>

            {/* Feedback Section */}
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Feedback Logs</h3>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                  <FiStar className="text-zinc-400" /> Interaction Quality
                </div>
              </div>
              <Comments characterId={id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const CollapsibleSection = ({ title, icon, children, isOpen, onToggle }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="border border-white/5 rounded-2xl bg-white/1 overflow-hidden transition-all duration-300 hover:border-white/10">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isOpen ? "bg-white text-zinc-950" : "bg-white/5 text-zinc-500 group-hover:bg-white/10"
            }`}>
            {icon}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isOpen ? "text-white" : "text-zinc-500 group-hover:text-zinc-400"
            }`}>
            {title}
          </span>
        </div>
        <div className={`transition-transform duration-500 ${isOpen ? "rotate-180 text-white" : "text-zinc-800"}`}>
          <FiChevronDown size={14} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/5">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CharacterView;
