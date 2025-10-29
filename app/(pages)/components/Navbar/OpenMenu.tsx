"use client";

import React from "react";
import Reveal from "../Animations/Reveal";
import { signOut } from "next-auth/react";
import {
  FaLine,
  FaMask,
  FaSignOutAlt,
  FaUserFriends,
  FaUserPlus
} from "react-icons/fa";
import { FaGear } from 'react-icons/fa6'
import Link from "next/link";
import { motion } from "motion/react";

const OpenMenu = () => {
  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div 
      className="relative -z-10 select-none"
      variants={menuVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="nav-menu"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="nav-item"
          variants={itemVariants}
          whileHover={{ backgroundColor: "var(--color-borders)", scale: 1.02 }}
        >
          <FaUserPlus className="icon" />
          <Link href="/create_character" className="nav-link w-full">
            Create Character
          </Link>
        </motion.div>
        <motion.div 
          className="nav-item"
          variants={itemVariants}
          whileHover={{ backgroundColor: "var(--color-borders)", scale: 1.02 }}
        >
          <FaUserFriends className="icon" />
          <Link href={"/my_characters"} className="nav-link w-full">
            My Characters
          </Link>
        </motion.div>
        <motion.div 
          className="nav-item"
          variants={itemVariants}
          whileHover={{ backgroundColor: "var(--color-borders)", scale: 1.02 }}
        >
          <FaLine className="icon" />
          <span className="nav-link w-full">My Chats</span>
        </motion.div>
        <motion.div 
          className="nav-item"
          variants={itemVariants}
          whileHover={{ backgroundColor: "var(--color-borders)", scale: 1.02 }}
        >
          <FaMask className="icon" />
          <Link href={"/my_personas"} className="nav-link w-full">
            My Personas
          </Link>
        </motion.div>
        <motion.div 
          className="nav-item"
          variants={itemVariants}
          whileHover={{ backgroundColor: "var(--color-borders)", scale: 1.02 }}
        >
          <FaGear className="icon" />
          <Link href={"/settings"} className="nav-link w-full">
            Settings
          </Link>
        </motion.div>
        <motion.div 
          className="nav-item mt-2 btn-outline"
          variants={itemVariants}
          whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 196, 179, 0.3)" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSignOutAlt className="icon" />
          <span className="nav-link w-full" onClick={() => signOut()}>
            Sign Out
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default OpenMenu;