"use client";

import React, { useState } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
import BannerCarousel from "./components/Home/BannerCarousel";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const HomeClient = () => {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q);
        else params.delete("q");

        // Always reset page when search changes
        params.set("p", "1");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex flex-col w-full gap-8 pt-24 pb-20">
            <h1 className="sr-only">JChatAI - Premium AI Character Conversations and Roleplay</h1>
            <div className="w-full space-y-10">
                {/* Banner Section */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="px-6 md:px-12"
                >
                    <BannerCarousel />
                </motion.section>

                {session?.user && !searchQuery && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="px-6 md:px-12"
                    >
                        <History />
                    </motion.section>
                )}

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="px-6 md:px-12"
                >
                    <Characters
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                    />
                </motion.section>
            </div>
        </div>
    );
};

export default HomeClient;
