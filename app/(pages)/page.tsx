"use client";

import React, { useState } from "react";
import Characters from "./components/Home/Characters/Characters";
import History from "./components/Home/History/History";
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
    <div className="flex flex-col w-full gap-16 pt-32 pb-32">
      <div className="max-w-7xl mx-auto w-full space-y-16">
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
            onSearch={setSearchQuery}
            allCharacters={characters}
          />
        </motion.section>
      </div>
    </div>
  );
};

export default HomePage;
