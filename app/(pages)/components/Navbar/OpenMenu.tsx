"use client";

import React from "react";
import { signOut } from "next-auth/react";
import {
  FaLine,
  FaMask,
  FaSignOutAlt,
  FaUserFriends,
  FaUserPlus,
} from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import Link from "next/link";
import { motion, Variants } from "motion/react";

const OpenMenu = () => {
  // ✅ Use Variants type and proper easing array
  const menuVariants: Variants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for "easeOut"
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] }, // smooth ease-in-out
    },
  };

  const links = [
    {
      href: "/create_character",
      icon: <FaUserPlus />,
      label: "Create Character",
    },
    { href: "/my_characters", icon: <FaUserFriends />, label: "My Characters" },
    { href: "#", icon: <FaLine />, label: "My Chats" },
    { href: "/my_personas", icon: <FaMask />, label: "My Personas" },
    { href: "/settings", icon: <FaGear />, label: "Settings" },
  ];

  return (
    <motion.div
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute right-8 top-16 z-50"
    >
      {/* Glass / neon effect container */}
      <motion.div className="relative overflow-hidden rounded-2xl border border-[rgba(0,255,200,0.25)] bg-[#0b0f0f]/80 backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,200,0.15)] p-4 min-w-[220px]">
        {/* Animated gradient glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-[rgba(0,255,200,0.05)] to-transparent"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 5,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Menu items */}
        <motion.ul className="relative flex flex-col gap-2">
          {links.map((link, i) => (
            <motion.li
              key={i}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(0,255,200,0.1)",
                boxShadow: "0 0 10px rgba(0,255,200,0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-[0.95rem] cursor-pointer text-cyan-200"
            >
              <span className="text-cyan-400 text-lg">{link.icon}</span>
              <Link
                href={link.href}
                className="w-full font-light hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            </motion.li>
          ))}

          <div className="my-2 h-px bg-[rgba(0,255,200,0.15)]" />

          {/* Sign Out */}
          <motion.li
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(255,82,82,0.15)",
              boxShadow: "0 0 10px rgba(255,82,82,0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:text-white transition-all cursor-pointer"
            onClick={() => signOut()}
          >
            <FaSignOutAlt className="text-red-400 text-lg" />
            <span>Sign Out</span>
          </motion.li>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
};

export default OpenMenu;
