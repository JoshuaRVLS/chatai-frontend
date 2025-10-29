import { signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";
import Profile from "./Profile";
import { motion } from "motion/react";

const AuthenticatedMenu = () => {
  return (
    <motion.div 
      className="flex gap-2 items-center"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 196, 179, 0.3)" }}
        whileTap={{ scale: 0.95 }}
      >
        <Link className="rounded-full btn-outline" href={"/create_character"}>
          Create Character
        </Link>
      </motion.div>
      <Profile />
    </motion.div>
  );
};

export default AuthenticatedMenu;