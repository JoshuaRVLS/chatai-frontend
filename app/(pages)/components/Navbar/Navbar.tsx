"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  FiHome,
  FiPlusSquare,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiUsers,
  FiCpu,
  FiBookOpen,
  FiSettings
} from "react-icons/fi";
import { signOut, useSession } from "next-auth/react";
import UserAvatar from "../Common/UserAvatar";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const openModal = useAuthModalStore((state) => state.openModal);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navLinks: any[] = [];

  const dropdownLinks = [
    { name: "Create Character", href: "/create_character", icon: <FiPlusSquare /> },
    { name: "Create Lorebook", href: "/create_lorebook", icon: <FiPlusSquare /> },
    { name: "Lorebooks", href: "/lorebooks-repository", icon: <FiBookOpen /> },
    { name: "My Lorebooks", href: "/lorebooks", icon: <FiBookOpen /> },
    { name: "My Characters", href: "/my_characters", icon: <FiUsers /> },
    { name: "My Personas", href: "/my_personas", icon: <FiCpu /> },
    { name: "Settings", href: "/settings", icon: <FiSettings /> },
  ];

  const [isProfileHovered, setIsProfileHovered] = useState(false);

  if (pathname.startsWith("/chat/")) return null;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-3 bg-zinc-950/60 backdrop-blur-md border-b border-white/5 transition-colors duration-500"
      >
        <div className="w-full flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={(e) => {
              // Ensure full refresh if navigation gets stuck
              if (pathname === '/') {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-white/20 group-hover:bg-white/5 overflow-hidden">
              <Image
                src="/jchatai-icon.png"
                alt="JChatAI"
                width={40}
                height={40}
                className="object-contain mix-blend-screen scale-125"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.2em] text-white leading-none">CHATAi</span>
              <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">
                AI Hub</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-12">
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all hover:text-white flex items-center gap-2 ${pathname === link.href ? "text-white bg-white/10" : "text-zinc-500"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-6">
              {session ? (
                <div
                  className="relative group"
                  onMouseEnter={() => setIsProfileHovered(true)}
                  onMouseLeave={() => setIsProfileHovered(false)}
                >
                  <Link href="/settings" className="flex items-center gap-4 transition-opacity hover:opacity-80">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{session.user?.name || (session.user as any)?.username}</p>
                      <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">Member</p>
                    </div>
                    <UserAvatar
                      name={session.user?.name || (session.user as any)?.username}
                      image={session.user?.image}
                      size="md"
                    />
                  </Link>

                  <AnimatePresence>
                    {session.user && isProfileHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full pt-2 w-56 z-60"
                      >
                        <div className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                          {/* Header section in dropdown */}
                          <div className="px-4 py-3 border-b border-white/5 bg-white/2">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{session.user.name || (session.user as any).username}</p>
                            <p className="text-[7px] text-zinc-500 uppercase tracking-widest font-black mt-0.5">Authorized Member</p>
                          </div>

                          <div className="p-1.5 flex flex-col gap-0.5">
                            {dropdownLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsProfileHovered(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/5 text-zinc-500 hover:text-white group/item"
                              >
                                <span className="text-sm transition-transform group-hover/item:scale-110">{link.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{link.name}</span>
                              </Link>
                            ))}

                            <div className="h-px bg-white/5 my-1 mx-2" />

                            <button
                              onClick={() => signOut()}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-zinc-900 text-zinc-600 hover:text-zinc-200 group/item"
                            >
                              <FiLogOut className="text-sm transition-transform group-hover/item:scale-110" />
                              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => openModal('login')}
                  className="px-5 py-2 rounded-lg border border-white/5 text-zinc-400 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-zinc-950 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 rounded-2xl bg-white/5 text-white/40 hover:text-primary transition-colors"
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-zinc-950/95 backdrop-blur-2xl flex flex-col p-8 pt-24 md:hidden"
          >
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600 px-4 mb-2">Navigation</p>
              {dropdownLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${pathname === link.href ? "bg-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{link.name}</span>
                </Link>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-3">
              {session ? (
                <>
                  <div className="h-px bg-white/5 my-4" />
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl bg-white/5 text-white/40 hover:text-white transition-all border border-white/5"
                  >
                    <UserAvatar name={session.user?.name || (session.user as any)?.username} image={session.user?.image} size="sm" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">{session.user?.name || (session.user as any)?.username}</span>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase mt-1">View Profile</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl text-zinc-600 hover:text-white transition-all border border-transparent hover:border-white/10"
                  >
                    <FiLogOut size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openModal('login');
                  }}
                  className="flex items-center justify-center p-6 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-widest text-[10px] cursor-pointer"
                >
                  Authorize System Access
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
