"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import CharacterCard from "../../CharacterCard/CharacterCard";
import { motion, AnimatePresence } from "motion/react";
import { FiAlertTriangle, FiRefreshCw, FiHash, FiGrid, FiSearch, FiX, FiChevronDown } from "react-icons/fi";
import SearchBar from "../SearchBar";
import { useSettings } from "@/app/hooks/useSettings";

const Characters = ({
  searchQuery,
  onSearch,
  allCharacters
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  allCharacters: any[];
}) => {
  const { settings } = useSettings();
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = React.useState("");
  const [debouncedTagSearch, setDebouncedTagSearch] = React.useState("");
  const [showTagDropdown, setShowTagDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  // Debounce tag search for performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTagSearch(tagSearchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [tagSearchQuery]);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTags]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { isPending, error, data, refetch } = useQuery<any[]>({
    queryKey: ["characters"],
    queryFn: () =>
      fetch("/api/characters").then((res) =>
        res.json().then((data) => data.data)
      ),
  });

  // Extract unique tags - memoized
  const allTags = React.useMemo(() => {
    if (!data) return [];
    const tags = new Set<string>();
    data.forEach(char => {
      char.tags.forEach((tag: any) => tags.add(tag.name));
    });
    return Array.from(tags).sort();
  }, [data]);

  // Filter tags based on debounced search - memoized
  const filteredTags = React.useMemo(() => {
    const search = debouncedTagSearch.toLowerCase();
    return allTags.filter(tag =>
      tag.toLowerCase().includes(search) &&
      !selectedTags.includes(tag)
    );
  }, [allTags, debouncedTagSearch, selectedTags]);

  const handleAddTag = (tag: string) => {
    setSelectedTags(prev => [...prev, tag]);
    setTagSearchQuery("");
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const filteredData = data?.filter((char) => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some((tag: any) => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      char.author.username.toLowerCase().includes(searchQuery.toLowerCase());

    // Multi-tag filter: character must have ALL selected tags
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(selectedTag =>
        char.tags.some((tag: any) => tag.name === selectedTag)
      );

    // NSFW Filtering
    if (!settings?.showNsfw && char.isNsfw) return false;

    return matchesSearch && matchesTags;
  });

  const totalPages = Math.ceil((filteredData?.length || 0) / pageSize);
  const paginatedData = filteredData?.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-10 w-full px-6 md:px-12">
        <div className="h-8 w-48 bg-white/5 rounded-xl shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[340px] rounded-[1.5rem] bg-white/5 shimmer border border-white/5" />
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-white/5 pb-16 relative">
        <div className="absolute -bottom-px left-0 w-1/3 h-px bg-gradient-to-r from-primary/50 to-transparent" />

        <div className="space-y-8 flex-1 min-w-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary/20 rounded-full" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Character Directory</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white italic leading-none">
              {searchQuery ? "Signal results" : "Community Characters"}
            </h2>
          </div>

          <div className="flex items-center gap-4 pt-2 relative">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-white/20 flex items-center justify-center shrink-0 shadow-2xl">
              <FiHash size={16} />
            </div>

            {/* Multi-Select Tags Filter */}
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2" ref={dropdownRef}>
              {/* Selected Tags */}
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-widest"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${tag} filter`}
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}

              {/* Tag Search Input */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => {
                      setTagSearchQuery(e.target.value);
                      setShowTagDropdown(true);
                    }}
                    onFocus={() => setShowTagDropdown(true)}
                    placeholder={selectedTags.length > 0 ? "Add more tags..." : "Filter by tags..."}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 w-48 transition-colors"
                  />
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
                    aria-label="Toggle tag dropdown"
                  >
                    <FiChevronDown size={16} className={`transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                  {showTagDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50"
                    >
                      {filteredTags.length > 0 ? (
                        filteredTags.slice(0, 20).map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              handleAddTag(tag);
                              setShowTagDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                          >
                            {tag}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-white/30 text-center">
                          {tagSearchQuery ? "No matching tags" : "All tags selected"}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clear All Button */}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-md relative group">
          <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
          <SearchBar characters={allCharacters} onSearch={onSearch} />
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <AnimatePresence mode="popLayout">
          {paginatedData?.map((character, index) => (
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
                authorId={character.authorId}
                isNsfw={character.isNsfw}
                tags={character.tags}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-6">
          <button
            disabled={page === 1}
            onClick={() => {
              setPage(p => Math.max(1, p - 1));
              setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-20 hover:bg-white/10 transition-all"
          >
            Prev Cycle
          </button>
          <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">
            Module <span className="text-primary italic">{page}</span> / <span className="text-white/60">{totalPages}</span>
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => {
              setPage(p => Math.min(totalPages, p + 1));
              setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-20 hover:bg-white/10 transition-all"
          >
            Next Cycle
          </button>
        </div>
      )}

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
