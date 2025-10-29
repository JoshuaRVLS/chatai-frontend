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
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
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
        </div>
      </motion.div>
    );

  if (error)
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-var-color-primary-background via-var-color-for-dark-surface to-var-color-primary-background pt-20 px-4 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <p className="text-var-color-error text-lg">
            Error loading character: {error.message}
          </p>
        </div>
      </motion.div>
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
    } catch (error) {
      console.log(error);
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
      className="min-h-screen bg-gradient-to-br from-var-color-primary-background via-var-color-for-dark-surface to-var-color-primary-background pt-20 pb-8 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Animated Background Elements */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y }}
      >
        <div className="absolute top-10 left-10 w-72 h-72 bg-var-color-primary-button/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-var-color-secondary-button/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-var-color-info/5 rounded-full blur-2xl"></div>
      </motion.div>

      {/* Hero Section */}
      <motion.div
        className="relative bg-gradient-to-br from-var-color-for-dark-surface/80 to-var-color-primary-background/80 border-b border-var-color-borders backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* Character Image */}
            <motion.div
              className="lg:col-span-1 relative"
              whileHover={{ scale: 1.05, rotateY: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative group">
                <div className="aspect-square rounded-3xl overflow-hidden border-4 border-var-color-borders shadow-2xl bg-gradient-to-br from-var-color-primary-button/20 to-var-color-secondary-button/20">
                  <Image
                    src={bytesToBase64(data.photo)}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={data.name}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button text-white px-3 md:px-4 py-2 rounded-full shadow-lg border-2 border-var-color-primary-background flex items-center gap-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <FiAward className="w-4 h-4" />
                  <span className="font-semibold">{totalTokens} tokens</span>
                </motion.div>
                <motion.div
                  className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full p-2"
                  whileHover={{ scale: 1.1 }}
                >
                  <FiHeart className="w-5 h-5 text-red-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Character Info */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div>
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-var-color-primary-text mb-4 leading-tight bg-gradient-to-r from-var-color-primary-text to-var-color-secondary-text bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {data.name}
                </motion.h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6">
                  <motion.div
                    className="flex items-center gap-2 text-var-color-secondary-text bg-var-color-for-dark-surface/50 px-3 md:px-4 py-2 rounded-full border border-var-color-borders backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FiUser className="w-4 h-4" />
                    <span className="font-medium">
                      by @{data.author.username}
                    </span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2 text-var-color-secondary-text bg-var-color-for-dark-surface/50 px-3 md:px-4 py-2 rounded-full border border-var-color-borders backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FiInfo className="w-4 h-4" />
                    <span>{permanentTokens} permanent tokens</span>
                  </motion.div>
                </div>
                {data.tags.length > 0 && (
                  <motion.div
                    className="flex flex-wrap gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {data.tags.map((tag, index) => (
                      <motion.span
                        key={tag.id}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-var-color-primary-background to-var-color-for-dark-surface border border-var-color-borders text-var-color-secondary-text rounded-full text-sm font-medium shadow-sm"
                        whileHover={{
                          scale: 1.1,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <FiTag className="w-3 h-3" />
                        {tag.name}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </div>
              <motion.div
                className="bg-var-color-for-dark-surface/30 border border-var-color-borders rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-xl"
                whileHover={{
                  boxShadow: "0 20px 40px rgba(0, 196, 179, 0.3)",
                  scale: 1.02,
                }}
              >
                <h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text mb-3 flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 bg-var-color-primary-button rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  ></motion.div>
                  About this Character
                </h3>
                <p className="text-var-color-secondary-text leading-relaxed text-base md:text-lg">
                  {data.bio}
                </p>
              </motion.div>
              <motion.button
                onClick={startChat}
                className="w-full lg:w-auto bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 font-bold text-base md:text-lg group shadow-lg"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0, 196, 179, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMessageCircle className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                Start Chatting with {data.name}
                <motion.div
                  className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                ></motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 relative">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
          {/* Left Column - Character Definition */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            <motion.div
              className="bg-var-color-for-dark-surface/50 border border-var-color-borders rounded-3xl p-1 backdrop-blur-sm shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-4 md:p-6">
                <h2 className="text-2xl md:text-3xl font-bold text-var-color-primary-text mb-2 bg-gradient-to-r from-var-color-primary-text to-var-color-secondary-text bg-clip-text text-transparent">
                  Character Definition
                </h2>
                <p className="text-var-color-secondary-text">
                  Explore the AI's personality, background, and conversation
                  style
                </p>
              </div>
              <div className="space-y-3 px-3 pb-3">
                {/* Scenario Section */}
                <motion.div
                  className="bg-var-color-primary-background/50 border border-var-color-borders rounded-2xl overflow-hidden backdrop-blur-sm"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  <motion.button
                    onClick={() => toggleSection("scenario")}
                    className="w-full p-4 md:p-6 flex items-center justify-between text-left group"
                    whileHover={{ backgroundColor: "var(--color-borders)" }}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-gradient-to-br from-var-color-primary-button to-var-color-primary-hover-state rounded-xl text-white shadow-lg">
                        <FiPlay className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text group-hover:text-var-color-primary-button">
                          Scenario & Setting
                        </h3>
                        <p className="text-var-color-secondary-text text-sm mt-1">
                          {Math.floor(data.scenario.length / 4)} tokens • World
                          context
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections.scenario ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {expandedSections.scenario ? (
                        <FiChevronUp className="w-5 h-5 md:w-6 md:h-6 text-var-color-primary-button" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 md:w-6 md:h-6 text-var-color-disabled" />
                      )}
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {expandedSections.scenario && (
                      <motion.div
                        className="px-4 md:px-6 pb-4 md:pb-6 border-t border-var-color-borders pt-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="bg-var-color-for-dark-surface/50 border border-var-color-borders rounded-xl p-4 md:p-6 backdrop-blur-sm">
                          <p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                            {data.scenario}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Persona Section */}
                <motion.div
                  className="bg-var-color-primary-background/50 border border-var-color-borders rounded-2xl overflow-hidden backdrop-blur-sm"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  <motion.button
                    onClick={() => toggleSection("persona")}
                    className="w-full p-4 md:p-6 flex items-center justify-between text-left group"
                    whileHover={{ backgroundColor: "var(--color-borders)" }}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-gradient-to-br from-var-color-secondary-button to-var-color-secondary-hover-state rounded-xl text-white shadow-lg">
                        <FiUser className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text group-hover:text-var-color-secondary-button">
                          Personality & Traits
                        </h3>
                        <p className="text-var-color-secondary-text text-sm mt-1">
                          {Math.floor(data.persona.length / 4)} tokens • Core
                          personality
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections.persona ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {expandedSections.persona ? (
                        <FiChevronUp className="w-5 h-5 md:w-6 md:h-6 text-var-color-secondary-button" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 md:w-6 md:h-6 text-var-color-disabled" />
                      )}
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {expandedSections.persona && (
                      <motion.div
                        className="px-4 md:px-6 pb-4 md:pb-6 border-t border-var-color-borders pt-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="bg-var-color-for-dark-surface/50 border border-var-color-borders rounded-xl p-4 md:p-6 backdrop-blur-sm">
                          <p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                            {data.persona}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Intro Message Section */}
                <motion.div
                  className="bg-var-color-primary-background/50 border border-var-color-borders rounded-2xl overflow-hidden backdrop-blur-sm"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  <motion.button
                    onClick={() => toggleSection("intro")}
                    className="w-full p-4 md:p-6 flex items-center justify-between text-left group"
                    whileHover={{ backgroundColor: "var(--color-borders)" }}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-gradient-to-br from-var-color-info to-blue-600 rounded-xl text-white shadow-lg">
                        <FiMessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-var-color-primary-text group-hover:text-var-color-info">
                          Intro Message
                        </h3>
                        <p className="text-var-color-secondary-text text-sm mt-1">
                          {Math.floor(data.introMessage.length / 4)} tokens •
                          Opening dialogue
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections.intro ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {expandedSections.intro ? (
                        <FiChevronUp className="w-5 h-5 md:w-6 md:h-6 text-var-color-info" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 md:w-6 md:h-6 text-var-color-disabled" />
                      )}
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {expandedSections.intro && (
                      <motion.div
                        className="px-4 md:px-6 pb-4 md:pb-6 border-t border-var-color-borders pt-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="bg-var-color-for-dark-surface/50 border border-var-color-borders rounded-xl p-4 md:p-6 backdrop-blur-sm">
                          <p className="text-var-color-secondary-text leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                            {data.introMessage}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Comments Section */}
          <motion.div
            className="space-y-4 md:space-y-6 xl:sticky xl:top-24 self-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="bg-var-color-for-dark-surface/50 border border-var-color-borders rounded-3xl p-4 md:p-6 backdrop-blur-sm shadow-xl"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
            >
              <h3 className="text-2xl font-bold text-var-color-primary-text mb-4 flex items-center gap-2">
                <FiStar className="text-yellow-400" />
                Feedback & Discussion
              </h3>
              <p className="text-var-color-secondary-text mb-4">
                Share your thoughts, ask questions, or connect with other users
                about{" "}
                <span className="font-semibold text-var-color-primary-text">
                  {data.name}
                </span>
                .
              </p>
              <Comments characterId={id} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterView;
