"use client";

import React, { useState, useEffect, useRef } from "react";
import History from "./components/Home/History/History";
import BannerCarousel from "./components/Home/BannerCarousel";
import TrendingSection from "./TrendingSection";
import RecentSection from "./RecentSection";
import PopularSection from "./PopularSection";
import TrendingAuthors from "./TrendingAuthors";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FiClock, FiStar, FiZap, FiActivity } from "react-icons/fi";

type HomeTab = 'featured' | 'history' | 'recent' | 'popular';

const HomeClient = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<HomeTab>('featured');

    // Refs for sections
    const featuredRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const recentRef = useRef<HTMLDivElement>(null);
    const popularRef = useRef<HTMLDivElement>(null);

    const scrollToSection = (id: HomeTab) => {
        let ref = featuredRef;
        if (id === 'history') ref = historyRef;
        if (id === 'recent') ref = recentRef;
        if (id === 'popular') ref = popularRef;

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
            threshold: 0.1
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
        if (recentRef.current) observer.observe(recentRef.current);
        if (popularRef.current) observer.observe(popularRef.current);

        const handleScroll = () => {
            if (window.scrollY < 100) {
                setActiveTab('featured');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [session?.user]);

    const tabs: { id: HomeTab; label: string; icon: any }[] = [
        { id: 'featured', label: 'Featured', icon: FiStar },
        ...(session?.user ? [{ id: 'history' as HomeTab, label: 'History', icon: FiClock }] : []),
        { id: 'recent', label: 'New', icon: FiActivity },
        { id: 'popular', label: 'Popular', icon: FiZap },
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
                </section>

                <section id="recent" ref={recentRef} className="scroll-mt-32">
                    <RecentSection />
                </section>

                <section id="popular" ref={popularRef} className="scroll-mt-32">
                    <PopularSection />
                </section>

                <TrendingAuthors />

                {/* EXPLORE MORE CTA */}
                <div className="pt-16 pb-32 flex flex-col items-center text-center gap-8 border-t border-white/5">
                    <div className="space-y-3">
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Endless Possibilities</h3>
                        <p className="text-zinc-500 text-sm max-w-md mx-auto font-medium">Dive deeper into the archives. Thousands of unique personas and stories are waiting to be discovered.</p>
                    </div>
                    <button
                        onClick={() => router.push('/explore')}
                        className="group relative px-12 py-5 bg-white text-zinc-950 font-black uppercase text-sm tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] active:scale-95"
                    >
                        Explore More
                        <div className="absolute inset-x-4 -bottom-1 h-px bg-zinc-950/20 group-hover:bg-zinc-950/40 transition-colors" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default HomeClient;
