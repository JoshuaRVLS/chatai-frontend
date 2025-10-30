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
    scenario: false,
    persona: false,
    intro: false,
  });

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

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

  const toggleSection = (key: keyof typeof expandedSections) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
    }));

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 10);
        grad.addColorStop(0, "rgba(0,255,255,0.4)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 10, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (isPending) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 flex flex-col items-center text-center"
        >
          <motion.div
            className="w-24 h-24 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-6"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
          <motion.h1
            className="text-3xl font-bold text-cyan-300"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Loading Character...
          </motion.h1>
          <p className="text-sm text-cyan-100/70 mt-2 animate-pulse">
            Preparing immersive experience
          </p>
        </motion.div>
      </div>
    );
  }

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-var-color-error">
        Error: {error.message}
      </div>
    );

  const totalTokens = Math.floor(
    (data.persona.length + data.introMessage.length + data.scenario.length) / 4
  );

  return (
    <motion.div
      className="relative min-h-screen bg-gradient-to-br from-var-color-primary-background via-var-color-for-dark-surface to-var-color-primary-background pt-20 pb-20 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40"
      />

      {}
      <section className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,255,0.1)] p-6"
        >
          {}
          <div className="relative group rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <Image
              src={bytesToBase64(data.photo)}
              alt={data.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
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

          {}
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
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1 rounded-full text-sm border border-var-color-borders text-var-color-secondary-text bg-white/10 backdrop-blur-md hover:bg-var-color-primary-button/20 transition"
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
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(0,255,255,0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={startChat}
              className="self-start bg-gradient-to-r from-var-color-primary-button to-var-color-secondary-button text-white font-semibold px-8 py-3 rounded-xl transition-all"
            >
              <FiMessageCircle className="inline mr-2" />
              Start Chatting
            </motion.button>
          </div>
        </motion.div>
      </section>

      {}
      <section className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 xl:grid-cols-4 gap-8 relative z-10">
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="px-5 pb-5"
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
