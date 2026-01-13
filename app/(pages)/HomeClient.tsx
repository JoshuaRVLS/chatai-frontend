"use client";

import React, { useState } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
import BannerCarousel from "./components/Home/BannerCarousel";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { scaleInVariants, fadeUpVariants } from "./components/Animations/variants";

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
                    variants={scaleInVariants}
                    initial="hidden"
                    animate="visible"
                    className="px-6 md:px-12"
                >
                    <BannerCarousel />
                </motion.section>

                {session?.user && !searchQuery && (
                    <motion.section
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="px-6 md:px-12"
                    >
                        <History />
                    </motion.section>
                )}

                <motion.section
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
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
