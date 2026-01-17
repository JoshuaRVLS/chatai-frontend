
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    link: string | null;
    isActive: boolean;
    order: number;
}

const BannerCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data: banners, isLoading } = useQuery<Banner[]>({
        queryKey: ["activeBanners"],
        queryFn: async () => {
            const res = await fetch("/api/banners");
            if (!res.ok) return [];
            const all = await res.json();
            return all.filter((b: any) => b.isActive);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (!banners || banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 10000); // 10s rotation
        return () => clearInterval(interval);
    }, [banners, currentIndex]);

    const nextSlide = () => {
        if (!banners) return;
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        if (!banners) return;
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    if (isLoading) {
        return (
            <div className="relative w-full aspect-16/10 md:aspect-3/1 rounded-3xl overflow-hidden bg-surface-hover border border-border-default shadow-2xl animate-pulse flex items-center justify-center">
                <div className="absolute inset-0 bg-linear-to-br from-surface/5 to-transparent" />
                <div className="w-12 h-12 rounded-full border-2 border-border-default border-t-text-primary animate-spin" />
            </div>
        );
    }

    if (!banners || banners.length === 0) return null;

    return (
        <div className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden rounded-[2.5rem] group border border-border-default shadow-2xl">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 bg-bg-surface"
                >
                    <ImageRenderer
                        src={banners[currentIndex].imageUrl}
                        alt={banners[currentIndex].title || ""}
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content */}
                    {(banners[currentIndex].title || banners[currentIndex].link) && (
                        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10 flex flex-col items-start gap-2 md:gap-3">
                            {banners[currentIndex].title && (
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl md:text-5xl font-black text-white italic uppercase tracking-tighter drop-shadow-xl"
                                >
                                    {banners[currentIndex].title}
                                </motion.h2>
                            )}

                            {banners[currentIndex].link && (
                                <Link href={banners[currentIndex].link} className="relative group/btn overflow-hidden rounded-xl px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                                    <span className="relative z-10">Explore Now</span>
                                </Link>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prevSlide(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface/80 backdrop-blur-md border border-border-default text-text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
                    >
                        <FiChevronLeft size={24} />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextSlide(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface/80 backdrop-blur-md border border-border-default text-text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
                    >
                        <FiChevronRight size={24} />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ImageRenderer = ({ src, alt }: { src: string; alt: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative w-full h-full overflow-hidden bg-bg-surface">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-hover animate-pulse">
                    <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-text-primary animate-spin" />
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setIsLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

export default BannerCarousel;
