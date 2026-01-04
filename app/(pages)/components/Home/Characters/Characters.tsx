"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import CharacterCard from "../../CharacterCard/CharacterCard";
import { motion, AnimatePresence } from "motion/react";
import { FiAlertTriangle, FiRefreshCw, FiHash, FiGrid, FiSearch } from "react-icons/fi";
import SearchBar from "../SearchBar";

const Characters = ({
  searchQuery,
  onSearch,
  allCharacters
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  allCharacters: any[];
}) => {
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const { isPending, error, data, refetch } = useQuery<any[]>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  // Extract unique tags
  const allTags = React.useMemo(() => {
    if (!data) return [];
    const tags = new Set<string>();
    data.forEach(char => {
      char.tags.forEach((tag: any) => tags.add(tag.name));
    });
    return Array.from(tags).sort();
  }, [data]);

  const filteredData = data?.filter((char) => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some((tag: any) => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      char.author.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || char.tags.some((tag: any) => tag.name === selectedTag);

    return matchesSearch && matchesTag;
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-10 w-full px-6 md:px-12">
        <div className="h-8 w-48 bg-white/5 rounded-xl shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[450px] rounded-[2rem] bg-white/5 shimmer border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-error/10 flex items-center justify-center">
          <FiAlertTriangle className="text-error w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Node Connectivity Lost</h3>
          <p className="text-white/40 text-sm max-w-xs mx-auto">Unable to establish connection with the central character database.</p>
        </div>
        <button onClick={() => refetch()} className="btn-primary px-8 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <FiRefreshCw /> Initialize Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full px-6 md:px-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white italic">
              {searchQuery ? "Search Results" : "Community Characters"}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedTag === null
                ? "bg-primary text-slate-950 border-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                : "bg-white/5 text-white/30 border-white/5 hover:border-white/10"
                }`}
            >
              <FiGrid size={12} /> All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedTag === tag
                  ? "bg-primary text-slate-950 border-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                  : "bg-white/5 text-white/30 border-white/5 hover:border-white/10"
                  }`}
              >
                <FiHash size={12} /> {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:max-w-md">
          <SearchBar characters={allCharacters} onSearch={onSearch} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredData?.map((character, index) => (
            <motion.div
              key={character.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <CharacterCard
                characterName={character.name}
                image={`/api/image/${character.id}`}
                characterId={character.id}
                characterBio={character.bio}
                authorName={character.author.username}
                tags={character.tags}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredData?.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20">
            <FiAlertTriangle size={32} />
          </div>
          <p className="text-white/30 font-black uppercase tracking-widest text-[10px]">No matches found in this sector.</p>
        </div>
      )}
    </div>
  );
};

export default Characters;
