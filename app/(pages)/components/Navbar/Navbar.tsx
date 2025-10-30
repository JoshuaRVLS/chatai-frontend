"use client";

import React, { useEffect, useRef, useContext } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "motion/react";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import AuthenticatedMenu from "./AuthenticatedMenu";
import Link from "next/link";

/* 🎇 Neon Animated Canvas Background */
const NeonCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = 80);
    const particles: { x: number; y: number; vx: number; vy: number }[] = [];

    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });

    for (let i = 0; i < 60; i++) particles.push(createParticle());

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40);
        gradient.addColorStop(0, "rgba(0, 255, 200, 0.8)");
        gradient.addColorStop(1, "rgba(0, 255, 200, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = 80;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-[80px] pointer-events-none opacity-50"
    />
  );
};

/* 🧠 Reactive Neon Navbar */
const ModernNavbar: React.FC = () => {
  const { user } = useContext(AuthContext);

  // Scroll-based animation
  const { scrollY } = useScroll();
  const blurValue = useTransform(scrollY, [0, 300], [8, 25]);
  const opacityValue = useTransform(scrollY, [0, 300], [1, 0.85]);
  const heightValue = useTransform(scrollY, [0, 300], [80, 65]);
  const glowValue = useTransform(scrollY, [0, 300], [0.25, 0.6]);

  // Compose dynamic styles
  const backdropStyle = useMotionTemplate`blur(${blurValue}px)`;
  const boxShadowStyle = useMotionTemplate`
    0 0 30px rgba(0,255,200,${glowValue.get()}),
    inset 0 0 20px rgba(0,255,200,${glowValue.get() / 2})
  `;

  return (
    <motion.nav
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-3 
                 border-b border-cyan-400/20 bg-black/50 backdrop-blur-md shadow-lg"
      style={{
        backdropFilter: backdropStyle,
        opacity: opacityValue,
        height: heightValue,
        boxShadow: boxShadowStyle,
      }}
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <NeonCanvas />

      {/* Brand */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="z-10"
      >
        <Link
          href="/"
          className="font-bitcount text-3xl tracking-widest text-cyan-400 hover:text-white transition"
        >
          JChatAI
          <sup className="text-xs text-gray-400 ml-1">BETA</sup>
        </Link>
      </motion.div>

      {/* Right: Authenticated / Unauthenticated */}
      <motion.div
        className="z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {user ? (
          <AuthenticatedMenu />
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black 
                        transition-all duration-300 shadow-[0_0_15px_rgba(0,255,200,0.5)]"
            >
              Sign Up
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.nav>
  );
};

export default ModernNavbar;
