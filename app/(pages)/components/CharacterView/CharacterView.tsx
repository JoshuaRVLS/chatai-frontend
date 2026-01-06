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
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({
    biography: true,
    scenario: false,
    persona: false,
    intro: false,
  });

  const startChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: id, userId: user?.id }),
      });
      if (!res.ok) return;
      const { chat } = await res.json();
      router.push(`/chat/${chat.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-white/40 font-medium tracking-widest text-[10px] uppercase">Initializing Profile...</p>
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
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-primary/20">
      {/* Dynamic Header Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Sidebar - Visuals & Actions */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group"
            >
              <Image
                src={`/api/image/${data.id}`}
                alt={data.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Active Intelligence</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">{data.name}</h1>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={startChat}
              className="w-full py-5 bg-primary text-slate-950 font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <FiMessageCircle size={18} />
              Begin Conversation
            </motion.button>

            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Architect</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <FiUser className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">{data.author.username}</p>
                  <p className="text-[10px] text-white/30 uppercase font-black">Verified Creator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Details */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-2">
                {data.tags.map(tag => (
                  <span key={tag.id} className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.03] text-[10px] font-black text-primary/60 uppercase tracking-widest">
                    #{tag.name}
                  </span>
                ))}
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
                <p className="text-lg text-white/70 leading-relaxed font-medium">
                  {data.bio}
                </p>
              </CollapsibleSection>

              <CollapsibleSection
                title="Scenario"
                icon={<FiPlay />}
                isOpen={expandedSections.scenario}
                onToggle={() => setExpandedSections(prev => ({ ...prev, scenario: !prev.scenario }))}
              >
                <p className="text-sm text-white/50 leading-loose">{data.scenario}</p>
              </CollapsibleSection>

              <CollapsibleSection
                title="Persona"
                icon={<FiUser />}
                isOpen={expandedSections.persona}
                onToggle={() => setExpandedSections(prev => ({ ...prev, persona: !prev.persona }))}
              >
                <p className="text-sm text-white/50 leading-loose">{data.persona}</p>
              </CollapsibleSection>

              <CollapsibleSection
                title="Greeting Protocol"
                icon={<FiMessageCircle />}
                isOpen={expandedSections.intro}
                onToggle={() => setExpandedSections(prev => ({ ...prev, intro: !prev.intro }))}
              >
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm font-medium text-white/80 leading-relaxed italic">"{data.introMessage}"</p>
                </div>
              </CollapsibleSection>
            </div>

            {/* Feedback Section */}
            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Community Logs</h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                  <FiStar className="text-yellow-500" /> Interaction Quality
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
    <div className="border border-white/5 rounded-[2rem] bg-white/[0.01] overflow-hidden transition-all duration-300 hover:border-white/10">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? "bg-primary text-slate-950" : "bg-white/5 text-primary/40 group-hover:bg-white/10"
            }`}>
            {icon}
          </div>
          <span className={`text-sm font-black uppercase tracking-[0.2em] transition-colors ${isOpen ? "text-white" : "text-white/30 group-hover:text-white/50"
            }`}>
            {title}
          </span>
        </div>
        <div className={`transition-transform duration-500 ${isOpen ? "rotate-180 text-primary" : "text-white/10"}`}>
          <FiChevronDown size={20} />
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
            <div className="px-6 pb-6 pt-2 border-t border-white/5">
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
