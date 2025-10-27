"use client";

import React from "react";
import Reveal from "../Animations/Reveal";
import { signOut } from "next-auth/react";
import {
  FaLine,
  FaMask,
  FaSignOutAlt,
  FaUserFriends,
  FaUserPlus,
} from "react-icons/fa";
import Link from "next/link";

const OpenMenu = () => {
  return (
      <div className="relative -z-10 select-none">
        <div className="nav-menu">
          <div className="nav-item">
            <FaUserPlus className="icon" />
            <Link href="/create_character" className="nav-link w-full">
              Create Character
            </Link>
          </div>
          <div className="nav-item">
            <FaUserFriends className="icon" />
            <Link href={"/my_characters"} className="nav-link w-full">
              My Characters
            </Link>
          </div>
          <div className="nav-item">
            <FaLine className="icon" />
            <span className="nav-link w-full">My Chats</span>
          </div>
          <div className="nav-item">
            <FaMask className="icon" />
            <Link href={"/my_personas"} className="nav-link w-full">
              My Personas
            </Link>
          </div>
          <div className="nav-item mt-2 btn-outline">
            <FaSignOutAlt className="icon" />
            <span className="nav-link w-full" onClick={() => signOut()}>
              Sign Out
            </span>
          </div>
        </div>
      </div>
  );
};

export default OpenMenu;
