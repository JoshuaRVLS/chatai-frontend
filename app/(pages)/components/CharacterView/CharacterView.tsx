"use client";

import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useContext, useState } from "react";
import Comments from "../Comments/Comments";
import { useRouter } from "next/navigation";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "../../providers/AuthProvider";
import { FiMessageCircle, FiUser, FiInfo, FiPlay, FiChevronDown, FiChevronUp, FiTag, FiAward } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";

const CharacterView = ({ id }: { id: string }) => {
  const { isPending, error, data } = useQuery<Character & { author: User; photo: { data: Uint8Array; mimetype: string; name: string }; tags: CharacterTag[] }>({
    queryKey: ["character", id],
    queryFn: () => fetch(`/api/characters/${id}`).then((res) => res.json().then((data) => data.data)),
  });

  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({ scenario: false, persona: false, intro: false });

  if (isPending) return (
    <motion.div className="min-h-screen bg-var-color-primary-background pt-20 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-var-color-borders rounded-xl"></div>)}</div>
            <div className="space-y-4"><div className="h-96 bg-var-color-borders rounded-xl"></div></div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (error) return (
    <motion.div className="min-h-screen bg-var-color-primary-background pt-20 px-4 flex items-center justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center"><p className="text-var-color-error text-lg">Error loading character: {error.message}</p></div>
    </motion.div>
  );

  const startChat = async () => {
    try {
      const response = await fetch("/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characterId: id, userId: user?.id }) });
      if (!response.ok) return;
      const { chat } = await response.json();
      router.push(`/chat/${chat.id}`);
    } catch (error) { console.log(error); }
  };

  const toggleSection = (section: keyof typeof expandedSections) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  const totalTokens = Math.floor((data.persona.length + data.introMessage.length + data.scenario.length) / 4);
  const permanentTokens = Math.floor((data.persona.length + data.scenario.length) / 4);

  return (
    <motion.div className="min-h-screen bg-var-color-primary-background pt-20 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Hero Section */}
      <motion.div className="bg-gradient-to-br from-var-color-for-dark-surface to-var-color-primary-background border-b border-var-color-borders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* Character Image */}
            <motion.div className="lg:col-span-1" whileHover={{ scale: 1.05 }}>
              <div className="relative group">
                <div className="aspect-square rounded-3xl overflow-hidden border-4 border-var-color-borders shadow-2xl">
                  <Image src={bytesToBase64(data.photo)} fill className="object-cover group-hover:scale-105 transition-transform" alt={data.name} priority />
                </div>
                <motion.div className="absolute -bottom-4 -right-4 bg-var-color-primary-button text-white px-3 md:px-4 py-2 rounded-full shadow-lg border-2 border-var-color-primary-background" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
                  <div className="flex items-center gap-2 text-sm font-semibold"><FiAward className="w-4 h-4" />{totalTokens} tokens</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Character Info */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div>
                <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-var-color-primary-text mb-4 leading-tight" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  {data.name}
                </motion.h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6">
                  <div className="flex items-center gap-2 text-var-color-secondary-text bg-var-color-for-dark-surface px-3 md:px-4 py-2 rounded-full border border-var-color-borders">
                    <FiUser className="w-4 h-4" /><span className="font-medium">by @{data.author.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-var-color-secondary-text bg-var-color-for-dark-surface px-3 md:px-4 py-2 rounded-full border border-var-color-borders">
                    <FiInfo className="w-4 h-4" /><span>{permanentTokens} permanent tokens</span>
                  </div>
                </div>
                {data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag) => (
                      <span key={tag.id} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-var-color-primary-background border border-var-color-borders text-var-color-secondary-text rounded-full text-sm font-medium">
                        <FiTag className="w-3 h-3" />{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <motion.div className="bg-var-color-for-dark-surface/50 border border-var-color-borders rounded-2xl p-4 md:p-6 backdrop-blur-sm" whileHover={{ boxShadow: "0 10px 30px rgba(0, 196, 179, 0.2)" }}>
                <h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text mb-3 flex items-center gap-2">
                  <motion.div className="w-2 h-2 bg-var-color-primary-button rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}></motion.div>
                  About this Character
                </h3>
                <p className="text-var-color-secondary-text leading-relaxed text-base md:text-lg">{data.bio}</p>
              </motion.div>
              <motion.button onClick={startChat} className="w-full lg:w-auto bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 font-bold text-base md:text-lg group" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiMessageCircle className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                Start Chatting with {data.name}
                <motion.div className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}></motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
          {/* Left Column - Character Definition */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            <motion.div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-3xl p-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="p-4 md:p-6">
                <h2 className="text-2xl md:text-3xl font-bold text-var-color-primary-text mb-2">Character Definition</h2>
                <p className="text-var-color-secondary-text">Explore the AI's personality, background, and conversation style</p>
              </div>
              <div className="space-y-3 px-3 pb-3">
                {/* Scenario Section */}
                <motion.div className="bg-var-color-primary-background border border-var-color-borders rounded-2xl overflow-hidden" whileHover={{ scale: 1.02 }}>
                  <motion.button onClick={() => toggleSection('scenario')} className="w-full p-4 md:p-6 flex items-center justify-between text-left group" whileHover={{ backgroundColor: "var(--color-borders)" }}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-gradient-to-br from-var-color-primary-button to-var-color-primary-hover-state rounded-xl text-white"><FiPlay className="w-5 h-5 md:w-6 md:h-6" /></div>
                      <div><h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text group-hover:text-var-color-primary-button">Scenario & Setting</h3><p className="text-var-color-secondary-text text-sm mt-1">{Math.floor(data.scenario.length / 4)} tokens • World context</p></div>
                    </div>
                    <motion.div animate={{ rotate: expandedSections.scenario ? 180 : 0 }}>{expandedSections.scenario ? <FiChevronUp className="w-5 h-5 md:w-6 md:h-6 text-var-color-primary-button" /> : <FiChevronDown className="w-5 h-5 md:w-6 md:h-6 text-var-color-disabled" />}</motion.div>
                  </motion.button>
                  <AnimatePresence>{expandedSections.scenario && <motion.div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-var-color-borders pt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-xl p-4 md:p-6"><p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap text-base md:text-lg">{data.scenario}</p></div>
                  </motion.div>}</AnimatePresence>
                </motion.div>

                {/* Persona Section */}
                <motion.div className="bg-var-color-primary-background border border-var-color-borders rounded-2xl overflow-hidden" whileHover={{ scale: 1.02 }}>
                  <motion.button onClick={() => toggleSection('persona')} className="w-full p-4 md:p-6 flex items-center justify-between text-left group" whileHover={{ backgroundColor: "var(--color-borders)" }}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-gradient-to-br from-var-color-secondary-button to-var-color-secondary-hover-state rounded-xl text-white"><FiUser className="w-5 h-5 md:w-6 md:h-6" /></div>
                      <div><h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text group-hover:text-var-color-secondary-button">Personality & Traits</h3><p className="text-var-color-secondary-text text-sm mt-1">{Math.floor(data.persona.length / 4)} tokens • Core personality</p></div>
                    </div>
                    <motion.div animate={{ rotate: expandedSections.persona ? 180 : 0 }}>{expandedSections.persona ? <FiChevronUp className="w-5 h-5 md:w-6 md:h-6 text-var-color-secondary-button" /> : <FiChevronDown className="w-5 h-5 md:w-6 md:h-6 text-var-color-disabled" />}</motion.div>
                  </motion.button>
                  <AnimatePresence>{expandedSections.persona && <motion.div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-var-color-borders pt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-xl p-4 md:p-6"><p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap text-base md:text-lg">{data.persona}</p></div>
                  </motion.div>}</AnimatePresence>
                </motion.div>

                {/* Intro Message Section */}
                <motion.div className="bg-var-color-primary-background border border-var-color-borders rounded-2xl overflow-hidden" whileHover={{ scale: 1.02 }}>
                  <motion.button onClick={() => toggleSection('intro')} className="w-full p-4 md:p-6 flex items-center justify-between text-left group" whileHover={{ backgroundColor: "var(--color-borders)" }}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-gradient-to-br from-var-color-info to-blue-600 rounded-xl text-white"><FiMessageCircle className="w-5 h-5 md:w-6 md:h-6" /></div>
                      <div><h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text group-hover:text-var-color-info">Opening Message</h3><p className="text-var-color-secondary-text text-sm mt-1">{Math.floor(data.introMessage.length / 4)} tokens • First message</p></div>
                    </div>
                    <motion.div animate={{ rotate: expandedSections.intro ? 180 : 0 }}>{expandedSections.intro ? <FiChevronUp className="w-5 h-5 md:w-6 md:h-6 text-var-color-info" /> : <FiChevronDown className="w-5 h-5 md:w-6 md:h-6 text-var-color-disabled" />}</motion.div>
                  </motion.button>
                  <AnimatePresence>{expandedSections.intro && <motion.div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-var-color-borders pt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-xl p-4 md:p-6"><p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap text-base md:text-lg italic">"{data.introMessage}"</p></div>
                  </motion.div>}</AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Comments */}
          <motion.div className="xl:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="bg-var-color-for-dark-surface border border-var-color-borders rounded-3xl overflow-hidden sticky top-24">
              <div className="p-4 md:p-6 border-b border-var-color-borders bg-gradient-to-r from-var-color-for-dark-surface to-var-color-primary-background">
                <h3 className="text-xl md:text-2xl font-bold text-var-color-primary-text flex items-center gap-3">
                  <div className="w-3 h-3 bg-var-color-primary-button rounded-full"></div>Community
                </h3>
                <p className="text-var-color-secondary-text text-sm mt-1">Share your thoughts</p>
              </div>
              <div className="p-4 md:p-6"><Comments characterId={data.id} /></div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterView;
