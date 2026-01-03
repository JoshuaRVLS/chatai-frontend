"use client";

import React, { useState } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
import SearchBar from "./components/Home/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";

const HomePage = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: characters = [] } = useQuery<any[]>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  return (
    <div className="flex flex-col w-full gap-24 pb-32">
      {/* Hero Section */}
      <section className="relative pt-32 px-6">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl aspect-square bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Network Interface</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-tight uppercase italic">
              DISCOVER <span className="text-primary italic">CHAR AI.</span>
            </h1>
            <p className="text-white/40 text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed">
              Connect with digital personalities or deploy your own custom model in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <SearchBar characters={characters} onSearch={setSearchQuery} />
          </motion.div>
        </div>
      </section>

      {session?.user && !searchQuery && (
        <section className="px-6 md:px-0">
          <History />
        </section>
      )}

      <section className="px-4 md:px-0">
        <Characters searchQuery={searchQuery} />
      </section>
    </div>
  );
};

export default HomePage;
