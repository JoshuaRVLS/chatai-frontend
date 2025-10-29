"use client";
import React, { useContext } from "react";
import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import AuthenticatedMenu from "./AuthenticatedMenu";
import Link from "next/link";
import Reveal from "../Animations/Reveal";
import Search from "./Search";
import { motion } from "motion/react";

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <motion.div 
      className="nav"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          href="/"
          className="font-bitcount text-3xl font-normal tracking-widest text-primary-text"
        >
          JChatAI<sup>BETA</sup>
        </Link>
      </motion.div>
      {/* <Search /> */}
      {user ? (
        <AuthenticatedMenu />
      ) : (
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 196, 179, 0.3)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/register" className="btn-outline">
            Sign Up
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Navbar;