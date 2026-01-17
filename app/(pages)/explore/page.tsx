"use client";

import React, { useState, useEffect } from "react";
import Characters from "../components/Home/Characters/Characters";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const ExplorePage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q);
        else params.delete("q");
        params.set("p", "1"); // Reset pagination on search
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Sync state FROM url (Handles "Back" button)
    useEffect(() => {
        setSearchQuery(searchParams.get("q") || "");
    }, [searchParams]);

    return (
        <div className="flex flex-col w-full gap-8 pt-24 pb-20 min-h-screen px-6 md:px-12 bg-page">
            {/* Header */}
            <div>
                <h1 className="text-6xl md:text-8xl font-black text-text-primary italic uppercase tracking-tighter mb-4">
                    Explore
                </h1>
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs md:text-sm">
                    Discover new characters and adventures
                </p>
            </div>
            <div className="max-w-[1600px] mx-auto w-full">
                <Characters
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                />
            </div>
        </div>
    );
};

export default ExplorePage;
