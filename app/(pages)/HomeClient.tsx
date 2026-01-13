"use client";

import React, { useState, useEffect, useRef } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
import BannerCarousel from "./components/Home/BannerCarousel";
import TrendingSection from "./TrendingSection";
import TrendingAuthors from "./TrendingAuthors";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { scaleInVariants, fadeUpVariants } from "./components/Animations/variants";
import { FiGrid, FiClock, FiStar } from "react-icons/fi";

type HomeTab = 'featured' | 'browse' | 'history';

const HomeClient = () => {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [activeTab, setActiveTab] = useState<HomeTab>('featured');

    // Refs for sections
    const featuredRef = useRef<HTMLDivElement>(null);
    const browseRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q);
        else params.delete("q");

        // Always reset page when search changes
        params.set("p", "1");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

        // Auto-scroll to browse on search
        if (q) {
            setTimeout(() => scrollToSection('browse'), 100);
        }
    };

    const scrollToSection = (id: HomeTab) => {
        const ref = id === 'featured' ? featuredRef : id === 'browse' ? browseRef : historyRef;
        if (ref.current) {
            const yOffset = -128; // Matches scroll-mt-32
            const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveTab(id);
        }
    };

    // Performance Optimized ScrollSpy using IntersectionObserver
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '-130px 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveTab(entry.target.id as HomeTab);
                }
            });
        }, options);

        if (featuredRef.current) observer.observe(featuredRef.current);
        if (historyRef.current) observer.observe(historyRef.current);
        if (browseRef.current) observer.observe(browseRef.current);

        return () => observer.disconnect();
    }, [session?.user]);

    const tabs: { id: HomeTab; label: string; icon: any }[] = [
        ...(session?.user ? [{ id: 'history' as HomeTab, label: 'History', icon: FiClock }] : []),
        { id: 'featured', label: 'Featured', icon: FiStar },
        { id: 'browse', label: 'Browse', icon: FiGrid },
    ];

    return (
        <div className="flex flex-col w-full gap-8 pt-24 pb-20 min-h-screen">
            <h1 className="sr-only">JChatAI - Premium AI Character Conversations and Roleplay</h1>

            {/* Navigation Tabs (Sticky) */}
            <div className="sticky top-[64px] md:top-0 z-30 px-6 md:px-12 py-4 bg-zinc-950/95 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar w-full">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => scrollToSection(tab.id)}
                            className={`flex items-center gap-2 pb-3 text-sm font-black uppercase tracking-wider transition-all relative shrink-0 ${activeTab === tab.id
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="homeActiveTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full space-y-24 px-6 md:px-12">

                {/* FEATURED & HISTORY FLOW */}
                <section id="featured" ref={featuredRef} className="space-y-16 scroll-mt-32">
                    <BannerCarousel />

                    {/* HISTORY (Immediately after Banner) */}
                    {session?.user && (
                        <div id="history" ref={historyRef} className="scroll-mt-32">
                            <History />
                        </div>
                    )}

                    <TrendingSection />
                    <TrendingAuthors />
                </section>

                {/* BROWSE SECTION */}
                <section id="browse" ref={browseRef} className="pb-32 scroll-mt-32">
                    <Characters
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                    />
                </section>

            </div>
        </div>
    );
};

export default HomeClient;
