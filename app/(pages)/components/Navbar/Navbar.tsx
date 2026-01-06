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

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { name: "Create", href: "/create_character", icon: <FiPlusSquare /> },
    { name: "My Lorebooks", href: "/lorebooks", icon: <FiBookOpen /> },
    { name: "My Characters", href: "/my_characters", icon: <FiUsers /> },
    { name: "My Personas", href: "/my_personas", icon: <FiCpu /> },
    { name: "Settings", href: "/settings", icon: <FiSettings /> },
  ];

  const [isProfileHovered, setIsProfileHovered] = useState(false);

  if (pathname.startsWith("/chat/")) return null;

  return (
    <>
      <motion.nav
        initial={false}
        animate={{
          y: isScrolled ? 20 : 0,
          width: isScrolled ? "calc(100% - 40px)" : "100%",
          maxWidth: isScrolled ? "1200px" : "100%",
          paddingTop: isScrolled ? "12px" : "24px",
          paddingBottom: isScrolled ? "12px" : "24px",
          borderRadius: isScrolled ? "32px" : "0px",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 px-6 md:px-12 transition-colors duration-500 ${isScrolled
          ? "bg-slate-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] after:absolute after:inset-0 after:rounded-[32px] after:shadow-[0_0_30px_rgba(56,189,248,0.05)] after:-z-10"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-primary/50 group-hover:bg-primary/5 overflow-hidden">
              <Image
                src="/jchatai-icon.png"
                alt="JChatAI"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-[0.2em] text-white leading-none">CHATAi</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em]">AI Platform</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-12">
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-white flex items-center gap-2 ${pathname === link.href ? "text-primary bg-white/5" : "text-white/30"
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
                      <p className="text-[11px] font-black text-white uppercase tracking-tight italic">{session.user?.name}</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">Member</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="text-white/20" />
                      )}
                    </div>
                  </Link>

                  <AnimatePresence>
                    {isProfileHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full pt-4 w-64 z-[60]"
                      >
                        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl">
                          <div className="flex flex-col gap-1">
                            {dropdownLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsProfileHovered(false)}
                                className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-white/5 text-white/40 hover:text-primary group/item"
                              >
                                <span className="text-lg transition-transform group-hover/item:scale-110">{link.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{link.name}</span>
                              </Link>
                            ))}
                            <div className="h-px bg-white/5 my-1" />
                            <button
                              onClick={() => signOut()}
                              className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-red-500/10 text-red-500/40 hover:text-red-500 group/item"
                            >
                              <FiLogOut className="text-lg transition-transform group-hover/item:scale-110" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-950 transition-all">
                  Sign In
                </Link>
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
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 z-[60] bg-[#020617] backdrop-blur-2xl flex flex-col p-8 pt-32 gap-10 md:hidden"
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 text-white/40 hover:text-primary transition-colors"
            >
              <FiX size={24} />
            </button>

            <div className="flex flex-col gap-4">
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 px-4">Features</p>
              {dropdownLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-5 rounded-[2rem] transition-all ${pathname === link.href ? "bg-white/10 text-primary font-bold shadow-[0_0_20px_rgba(56,189,248,0.1)]" : "bg-white/[0.02] text-white/30"
                    }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{link.name}</span>
                </Link>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4">
              {session ? (
                <>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/[0.02] text-white/30"
                  >
                    <FiUser size={20} />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">User Profile</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-4 p-5 rounded-[2rem] bg-error/5 text-error/60"
                  >
                    <FiLogOut size={20} />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center p-5 rounded-3xl bg-primary text-slate-950 font-black uppercase tracking-widest"
                >
                  Authenticate
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
