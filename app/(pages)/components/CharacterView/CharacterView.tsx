"use client";

import { Character, CharacterTag, User } from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useContext, useState } from "react";
import Comments from "../Comments/Comments";
import { useRouter } from "next/navigation";
import { bytesToBase64 } from "@/app/utils/image";
import { AuthContext } from "../../providers/AuthProvider";
import {
  FiMessageCircle,
  FiUser,
  FiInfo,
  FiPlay,
  FiChevronDown,
  FiChevronUp,
  FiTag,
  FiAward,
  FiStar,
  FiHeart,
} from "react-icons/fi";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";

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
    scenario: false,
    persona: false,
    intro: false,
  });
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  if (isPending)
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-var-color-primary-background via-var-color-for-dark-surface to-var-color-primary-background pt-20 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-var-color-borders rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-var-color-borders rounded-xl"
                ></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-96 bg-var-color-borders rounded-xl"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-var-color-error">
        Error loading character: {error.message}
      </div>
    );

  const startChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: id, userId: user?.id }),
      });
      if (!response.ok) return;
      const { chat } = await response.json();
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const totalTokens = Math.floor(
    (data.persona.length + data.introMessage.length + data.scenario.length) / 4
  );
  const permanentTokens = Math.floor(
    (data.persona.length + data.scenario.length) / 4
  );

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-var-color-primary-background via-var-color-for-dark-surface to-var-color-primary-background pt-20 pb-10 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Glow Elements */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y }}
      >
        <div className="absolute top-10 left-10 w-80 h-80 bg-var-color-primary-button/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-var-color-secondary-button/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_70%,rgba(0,0,0,0.5)_100%)]"></div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,255,0.1)] p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Character Image */}
            <div className="relative group rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <Image
                src={bytesToBase64(data.photo)}
                alt={data.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70"></div>
              <motion.div
                className="absolute bottom-4 left-4 bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FiAward className="w-4 h-4" />
                <span className="font-semibold">{totalTokens} tokens</span>
              </motion.div>
            </div>

            {/* Character Info */}
            <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                  {data.name}
                </h1>
                <p className="mt-2 text-var-color-secondary-text flex items-center gap-2">
                  <FiUser /> by @{data.author.username}
                </p>
              </div>

              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <motion.span
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-sm border border-var-color-borders text-var-color-secondary-text bg-white/10 backdrop-blur-md hover:bg-var-color-primary-button/20 transition"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiTag className="inline mr-1" /> {tag.name}
                    </motion.span>
                  ))}
                </div>
              )}

              <p className="text-var-color-secondary-text bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                {data.bio}
              </p>

              <motion.button
                onClick={startChat}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(0,255,255,0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                className="self-start bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button text-white font-semibold px-8 py-3 rounded-xl transition-all"
              >
                <FiMessageCircle className="inline mr-2" />
                Start Chatting
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Definition Sections */}
        <div className="xl:col-span-3 space-y-6">
          {[
            {
              key: "scenario",
              icon: FiPlay,
              title: "Scenario & Setting",
              text: data.scenario,
            },
            {
              key: "persona",
              icon: FiUser,
              title: "Personality & Traits",
              text: data.persona,
            },
            {
              key: "intro",
              icon: FiMessageCircle,
              title: "Intro Message",
              text: data.introMessage,
            },
          ].map(({ key, icon: Icon, title, text }) => (
            <motion.div
              key={key}
              className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() =>
                  toggleSection(key as keyof typeof expandedSections)
                }
                className="w-full p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-var-color-primary-button to-var-color-secondary-button rounded-xl text-white shadow-md">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-var-color-primary-text">
                    {title}
                  </h3>
                </div>
                {expandedSections[key as keyof typeof expandedSections] ? (
                  <FiChevronUp className="w-5 h-5 text-var-color-secondary-text" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-var-color-secondary-text" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections[key as keyof typeof expandedSections] && (
                  <motion.div
                    className="px-5 pb-5"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-var-color-secondary-text whitespace-pre-wrap leading-relaxed">
                        {text}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Feedback Section */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-bold flex items-center gap-2 text-var-color-primary-text mb-4">
            <FiStar className="text-yellow-400" /> Feedback & Discussion
          </h3>
          <Comments characterId={id} />
        </motion.div>
      </section>
    </motion.div>
  );
};

export default CharacterView;
