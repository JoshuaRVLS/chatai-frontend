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
    <div className="flex flex-col w-full gap-16 pt-32 pb-32">

      {session?.user && !searchQuery && (
        <section className="px-6 md:px-0">
          <History />
        </section>
      )}

      <section className="px-4 md:px-0">
        <Characters
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          allCharacters={characters}
        />
      </section>
    </div>
  );
};

export default HomePage;
