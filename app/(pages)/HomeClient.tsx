"use client";

import React, { useState, useEffect, useRef } from "react";
import History from "./components/Home/History/History";
import Characters from "./components/Home/Characters/Characters";
import BannerCarousel from "./components/Home/BannerCarousel";
import TrendingSection from "./TrendingSection";
import RecentSection from "./RecentSection";
import PopularSection from "./PopularSection";
import TrendingAuthors from "./TrendingAuthors";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FiClock, FiStar, FiGrid, FiList } from "react-icons/fi";

type HomeTab = 'featured' | 'history' | 'all';

const HomeClient = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [activeTab, setActiveTab] = useState<HomeTab>('featured');

    // Refs for sections
    const featuredRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const allRef = useRef<HTMLDivElement>(null);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        // If searching, auto-scroll to All/Browse section
        if (q) {
            scrollToSection('all');
        }
    };

    const scrollToSection = (id: HomeTab) => {
        let ref = featuredRef;
        if (id === 'history') ref = historyRef;
        if (id === 'all') ref = allRef;

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
        if (allRef.current) observer.observe(allRef.current);

        return () => observer.disconnect();
    }, [session?.user]);

    const tabs: { id: HomeTab; label: string; icon: any }[] = [
        { id: 'featured', label: 'Featured', icon: FiStar },
        ...(session?.user ? [{ id: 'history' as HomeTab, label: 'History', icon: FiClock }] : []),
        { id: 'all', label: 'All Models', icon: FiGrid },
    ];

    return (
        <div className="flex flex-col w-full gap-8 pt-6 pb-20 min-h-screen">
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

                {/* FEATURED SECTION */}
                <section id="featured" ref={featuredRef} className="space-y-16 scroll-mt-32">
                    <BannerCarousel />

                    {/* HISTORY (Immediately after Banner if signed in) */}
                    {session?.user && (
                        <div id="history" ref={historyRef} className="scroll-mt-32">
                            <History />
                        </div>
                    )}

                    <TrendingSection />
                    <RecentSection />
                    <PopularSection />
                    <TrendingAuthors />
                </section>

                {/* ALL / BROWSE SECTION */}
                <section id="all" ref={allRef} className="pb-32 scroll-mt-32">
                    <div className="flex flex-col items-center text-center gap-4 mb-12">
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">All Models</h3>
                        <p className="text-zinc-500 text-sm max-w-md mx-auto font-medium">Browse the complete collection of AI personas.</p>
                    </div>
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
