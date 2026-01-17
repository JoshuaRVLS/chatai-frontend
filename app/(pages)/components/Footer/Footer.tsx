"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FiGithub, FiInstagram, FiMail, FiHeart } from "react-icons/fi";
import { usePathname } from "next/navigation";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const pathname = usePathname();

    if (pathname.startsWith("/chat/")) return null;

    return (
        <footer className="relative border-t border-border-default bg-surface/50 backdrop-blur-xl">
            <div className="w-full px-6 py-12">
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Brand Section */}
                    <div className="flex flex-col items-center">
                        <Link href="/" className="flex items-center gap-3 mb-4 group">
                            <div className="w-10 h-10 rounded-2xl bg-surface border border-border-default flex items-center justify-center transition-all group-hover:border-border-hover group-hover:bg-surface-hover overflow-hidden">
                                <Image
                                    src="/jchatai-icon.png"
                                    alt="JChatAI"
                                    width={40}
                                    height={40}
                                    className="object-contain scale-125 mix-blend-screen invert dark:invert-0"
                                    priority
                                />
                            </div>
                            <span className="text-xl font-black text-text-primary uppercase tracking-tighter italic">
                                JChat<span className="text-text-primary/50">AI</span>
                            </span>
                        </Link>
                        <p className="text-text-muted text-sm max-w-md font-medium">
                            Experience the next level of AI interaction. Modern, fast, and secure. Built for creators and roleplayers.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="https://github.com/JoshuaRVLS" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-border-hover transition-all" title="GitHub">
                            <FiGithub size={18} />
                        </a>
                        <a href="https://instagram.com/bknjos" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-border-hover transition-all" title="Instagram">
                            <FiInstagram size={18} />
                        </a>
                        <a href="mailto:jravaellnew@gmail.com" className="p-2 rounded-xl bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-border-hover transition-all" title="Email">
                            <FiMail size={18} />
                        </a>
                    </div>
                </div>

                <div className="pt-12 mt-12 border-t border-border-default flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-text-muted/50 text-xs font-black uppercase tracking-widest">
                        &copy; {currentYear} JChatAI. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-text-muted/50 text-xs font-black uppercase tracking-widest">
                        <span>Made with</span>
                        <FiHeart className="text-red-500 fill-red-500 animate-pulse" size={12} />
                        <span>for roleplayers</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="text-text-muted/50 hover:text-text-primary/80 text-[10px] font-black uppercase tracking-widest transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-text-muted/50 hover:text-text-primary/80 text-[10px] font-black uppercase tracking-widest transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
