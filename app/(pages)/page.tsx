"use client";

import React, { useState } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const HomePage = () => {
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


  const { data: characters = [] } = useQuery<any[]>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  return (
    <div className="flex flex-col w-full gap-16 pt-32 pb-32">
      <div className="w-full space-y-16">
        {session?.user && !searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6"
          >
            <History />
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="px-4"
        >
          <Characters
            searchQuery={searchQuery}
            onSearch={handleSearch}
            allCharacters={characters}
          />
        </motion.section>
      </div>
    </div>
  );
};

export default HomePage;
