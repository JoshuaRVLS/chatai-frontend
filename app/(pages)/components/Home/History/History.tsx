"use client";
import {
  Character,
  CharacterImage,
  Chat,
  Message,
  User,
} from "@/app/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import { useCanvasGlow } from "@/app/(pages)/hooks/useCanvasGlow";
import React, { useContext } from "react";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import Link from "next/link";
import {
  FiMessageCircle,
  FiClock,
  FiArrowRight,
  FiPlay,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";

const History = () => {
  const { user } = useContext(AuthContext);
  const glowRef = useCanvasGlow();

  const { isPending, data, error, refetch } = useQuery<
    (Chat & {
      character: Character & {
        photo: CharacterImage;
        author: User;
        tags?: { name: string; id: string }[];
      };
      messages: Message[];
    })[]
  >({
    queryKey: ["chatsHistory"],
    queryFn: () =>
      fetch(`/api/history/${user?.id}`).then((res) =>
        res.json().then((data) => data.data)
      ),
    enabled: !!user?.id,
  });

  // ✅ Loading (Pending) State
  if (isPending)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full mb-12 px-12 py-12 flex flex-col items-center justify-center"
      >
        {/* Glow canvas */}
        <canvas
          ref={glowRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.05, 1],
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-cyan-400/10 border border-cyan-400/20 absolute"
        ></motion.div>

        <div className="relative z-10 w-full max-w-5xl">
          <div className="animate-pulse mb-8">
            <div className="h-8 bg-cyan-900/30 rounded w-1/3 mb-6"></div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="min-w-64 h-80 bg-cyan-900/20 border border-cyan-400/20 rounded-2xl"
                />
              ))}
            </div>
          </div>

          <p className="text-cyan-400/60 text-sm text-center">
            Loading your conversations...
          </p>
        </div>
      </motion.div>
    );

  // ❌ Error State
  if (error)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full py-24 flex flex-col items-center justify-center text-center space-y-4"
      >
        <motion.div
          animate={{ x: [-10, 10, -8, 8, 0] }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
            <FiAlertTriangle className="text-red-400 w-10 h-10" />
          </div>
          <h3 className="text-lg font-semibold text-red-400 mt-3">
            Error loading chat history
          </h3>
          <p className="text-red-400/70 text-sm max-w-sm">
            {error.message || "Something went wrong fetching your chats."}
          </p>
        </motion.div>

        <motion.button
          onClick={() => refetch()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg"
        >
          <FiRefreshCw className="animate-spin-slow" /> Retry
        </motion.button>
      </motion.div>
    );

  // No history — don’t render anything
  if (!data || data.length === 0) return null;

  // ✅ Main Section
  return (
    <div className="relative w-full mb-12 px-12">
      {/* Canvas Glow Layer */}
      <canvas
        ref={glowRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-cyan-300 mb-2 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
            Continue Chatting
          </h2>
          <p className="text-cyan-200/70 flex items-center gap-2 text-sm">
            <FiClock className="w-4 h-4" /> Pick up where you left off
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="hidden lg:flex items-center gap-2 text-cyan-400/40 text-sm"
        >
          <FiArrowRight className="w-4 h-4 animate-pulse" />
          Scroll horizontally to browse
        </motion.div>
      </motion.div>

      {/* Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <div className="flex gap-6 pb-4 overflow-x-auto scrollbar-hide">
          {data.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                y: -10,
                boxShadow: "0 0 25px rgba(0,255,255,0.3)",
                borderColor: "rgba(0,255,255,0.6)",
              }}
              className="flex flex-col min-w-64 max-w-64 rounded-2xl overflow-hidden border border-cyan-400/20 
                         bg-[rgba(15,20,25,0.65)] backdrop-blur-lg transition-all duration-300 flex-shrink-0"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                {chat.character.photo?.data ? (
                  <motion.img
                    src={`data:${
                      chat.character.photo.mimetype
                    };base64,${Buffer.from(
                      Object.values(chat.character.photo.data)
                    ).toString("base64")}`}
                    alt={chat.character.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-cyan-900/20">
                    <FiMessageCircle className="text-cyan-400 w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60"></div>
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-cyan-300 text-sm line-clamp-1 mb-1">
                    {chat.character.name}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {chat.character.bio}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-cyan-400/60 text-xs mt-2">
                  <FiMessageCircle className="w-3 h-3" />
                  <span>{chat.messages.length} messages</span>
                </div>
              </div>

              {/* Action */}
              <div className="border-t border-cyan-400/20 bg-cyan-900/20 p-3">
                {chat.messages.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-cyan-400/60 mb-1">
                      Last message:
                    </p>
                    <p className="text-xs text-cyan-200/80 line-clamp-2 bg-cyan-400/10 p-2 rounded border border-cyan-400/20">
                      {chat.messages[chat.messages.length - 1].content}
                    </p>
                  </div>
                )}
                <Link
                  href={`/chat/${chat.id}`}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-2 px-3 rounded-lg 
                             hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 
                             flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <FiPlay className="w-3 h-3" /> Continue
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mobile Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="lg:hidden text-center mt-4 text-cyan-400/50 text-xs flex items-center justify-center gap-2"
      >
        <FiArrowRight className="w-3 h-3 animate-bounce-x" />
        Swipe to see more conversations
      </motion.div>
    </div>
  );
};

export default History;
