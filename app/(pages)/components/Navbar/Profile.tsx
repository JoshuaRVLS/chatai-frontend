"use client";

import { AuthContext } from "@/app/(pages)/providers/AuthProvider";
import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import OpenMenu from "./OpenMenu";
import { motion, AnimatePresence } from "motion/react";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).id !== "profile") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <div>
      <motion.div
        whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(0, 196, 179, 0.3)" }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          onClick={() => setMenuOpen(!menuOpen)}
          src={`/api/users/picture/${user?.id}`}
          alt={`Your Profile`}
          width={40}
          height={40}
          className={`object-cover rounded-full cursor-pointer transition ${
            menuOpen ? "brightness-75" : "brightness-100"
          }`}
        />
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <OpenMenu />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;