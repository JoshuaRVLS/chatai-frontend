"use client";

import React from "react";

import { motion } from "motion/react";
import { Orbitron } from "next/font/google";
import { useAuthModalStore } from "@/app/hooks/useAuthModalStore";
import { FiLogIn } from "react-icons/fi";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "900"] });

const LoginLanding = () => {
    const openModal = useAuthModalStore((state) => state.openModal);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [activeVideo, setActiveVideo] = React.useState(0);
    const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>, index: number) => {
        if (index !== activeVideo) return;

        const video = e.currentTarget;
        const timeLeft = video.duration - video.currentTime;

        // Start fading in the next video 1.5s before end
        if (timeLeft < 1.5 && timeLeft > 0) {
            const nextIndex = (index + 1) % 2;
            const nextVideo = videoRefs.current[nextIndex];

            // Only trigger if we haven't already switched context behaviorally
            // (The state update triggers the visual crossfade)
            if (nextVideo && nextVideo.paused) {
                nextVideo.currentTime = 0;
                nextVideo.play().catch(() => { });
                setActiveVideo(nextIndex);
            }
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center z-50">
            {/* Background Image */}
            <div className="absolute inset-0 bg-linear-to-b from-indigo-950 to-purple-950"> {/* Placeholder Color */}
                {[0, 1].map((index) => (
                    <video
                        key={index}
                        ref={(el) => {
                            if (index === 0) videoRefs.current[0] = el;
                            else videoRefs.current[1] = el;
                        }}
                        autoPlay={index === 0}
                        muted
                        playsInline
                        className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-1000 [image-rendering:pixelated] 
                            ${activeVideo === index && (index !== 0 || isLoaded) ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        onTimeUpdate={(e) => handleTimeUpdate(e, index)}
                        onLoadedData={() => {
                            if (index === 0) setIsLoaded(true);
                        }}
                    >
                        <source src="/bg.mp4" type="video/mp4" />
                    </video>
                ))}

                <div className="absolute inset-0 bg-black/40 z-20" />
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/60 z-20" />
            </div>

            {/* Content Container */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative z-30 flex flex-col items-center justify-center gap-8 max-w-2xl px-6 text-center"
            >
                {/* Logo Section */}
                <div className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`${orbitron.className} text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-white/50 tracking-tighter drop-shadow-2xl`}
                    >
                        JChatAI
                    </motion.div>
                    <p className="text-cyan-400 text-xs md:text-sm font-bold uppercase tracking-[0.5em] animate-pulse">
                        System Online • Ready to Connect
                    </p>
                </div>

                {/* Separator */}
                <div className="w-24 h-1 bg-white/20 rounded-full" />

                {/* Description */}
                <p className="text-zinc-300 text-sm md:text-base font-medium max-w-md leading-relaxed drop-shadow-lg">
                    Enter the simulation. Create unique characters, explore infinite lorebooks, and experience premium AI conversations.
                </p>

                {/* Login Button */}
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6,182,212,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal('login')}
                    className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl overflow-hidden transition-all hover:bg-white/20 hover:border-cyan-400/50"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-3 relative z-10">
                        <span className={`${orbitron.className} text-lg font-bold tracking-widest`}>ENTER WORLD</span>
                        <FiLogIn className="text-xl group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.button>
            </motion.div>

            {/* Footer Credits */}
            <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-white/20 uppercase tracking-widest">
                JChatAI Space © 2026 • Secure Uplink Established
            </div>
        </div>
    );
};

export default LoginLanding;
