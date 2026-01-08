"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import CharacterCard from "../../CharacterCard/CharacterCard";
import { motion, AnimatePresence } from "motion/react";
import { FiAlertTriangle, FiRefreshCw, FiHash, FiGrid, FiSearch, FiX, FiChevronDown, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import SearchBar from "../SearchBar";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSettings } from "@/app/hooks/useSettings";

const Characters = ({
  searchQuery,
  onSearch,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
}) => {
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [tagSearchQuery, setTagSearchQuery] = React.useState("");
  const [debouncedTagSearch, setDebouncedTagSearch] = React.useState("");
  const [showTagDropdown, setShowTagDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = React.useRef<HTMLDivElement>(null);

  const [showAll, setShowAll] = React.useState(false);

  const [page, setPage] = React.useState(
    parseInt(searchParams.get("p") || "1", 10)
  );
  const [isEditingPage, setIsEditingPage] = React.useState(false);
  const [inputPage, setInputPage] = React.useState(page.toString());
  const pageSize = 32;

  const discoveryCategories = [
    { name: "Cyberpunk" },
    { name: "Medieval" },
    { name: "Assistant" },
    { name: "Horror" },
    { name: "Anime" },
    { name: "Romance" },
    { name: "Fantasy" },
  ];

  const handleCategoryToggle = (category: string) => {
    let newTags;
    if (selectedTags.includes(category)) {
      newTags = selectedTags.filter(t => t !== category);
    } else {
      newTags = [...selectedTags, category];
    }
    setSelectedTags(newTags);
    handleUpdateParams({ tags: newTags.length > 0 ? newTags.join(",") : null, p: "1" });
  };

  // Helper to update specific parameters in the URL
  const handleUpdateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  // Reset page to 1 when showAll is toggled off (to avoid empty pages)
  React.useEffect(() => {
    if (!showAll && page > 1) {
      setPage(1);
      setInputPage("1");
      handleUpdateParams({ p: "1" });
    }
  }, [showAll, handleUpdateParams]);

  const scrollToSection = React.useCallback(() => {
    if (gridRef.current) {
      const offset = 120;
      const elementPosition = gridRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth"
      });
    }
  }, []);

  // Sync state FROM url (Handles "Back" button and initial load)
  React.useEffect(() => {
    const p = searchParams.get("p");
    if (p) setPage(parseInt(p, 10));

    const tags = searchParams.get("tags");
    if (tags) setSelectedTags(tags.split(",").filter(Boolean));
    else setSelectedTags([]);
  }, [searchParams]);

  // Debounce tag search for performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTagSearch(tagSearchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [tagSearchQuery]);


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

  const { isPending, error, data: apiData, refetch } = useQuery<any>({
    queryKey: ["characters", page, searchQuery, selectedTags, showAll],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchQuery,
        tags: selectedTags.join(","),
        showAll: showAll.toString(),
      });
      return fetch(`/api/characters?${params.toString()}`).then((res) => res.json());
    },
  });

  const data = apiData?.data;
  const meta = apiData?.meta;

  // Extract unique tags - memoized
  const allTags = React.useMemo(() => {
    if (meta?.allTags) return meta.allTags;
    if (!data) return [];
    const tags = new Set<string>();
    data.forEach((char: any) => {
      char.tags.forEach((tag: any) => tags.add(tag.name));
    });
    return Array.from(tags).sort();
  }, [data, meta]);

  // Filter tags based on debounced search - memoized
  const filteredTags = React.useMemo(() => {
    const search = debouncedTagSearch.toLowerCase();
    return allTags.filter((tag: string) =>
      tag.toLowerCase().includes(search) &&
      !selectedTags.includes(tag)
    );
  }, [allTags, debouncedTagSearch, selectedTags]);

  const handleAddTag = (tag: string) => {
    const newTags = [...selectedTags, tag];
    setSelectedTags(newTags);
    setTagSearchQuery("");
    handleUpdateParams({ tags: newTags.join(","), p: "1" });
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
    handleUpdateParams({ tags: newTags.length > 0 ? newTags.join(",") : null, p: "1" });
  };

  // Filtering is now handled on the server
  const filteredData = data;

  const totalPages = meta?.totalPages || 1;
  const paginatedData = data;

  if (isPending) {
    return (
      <div className="flex flex-col gap-6 w-full px-6 md:px-8">
        <div className="h-6 w-32 bg-white/5 rounded-lg shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-[240px] rounded-xl bg-white/5 shimmer border border-white/5" />
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
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Database Link Severed</h3>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto">Unable to establish connection with the central character database.</p>
        </div>
        <button onClick={() => refetch()} className="btn-primary px-8 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <FiRefreshCw /> Initialize Reconnect
        </button>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="flex flex-col gap-8 w-full px-6 md:px-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-10 relative">
        <div className="absolute -bottom-px left-0 w-1/4 h-px bg-white/10" />

        <div className="space-y-8 flex-1 min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-white/10 rounded-full" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Character Hub</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
              {searchQuery ? "Search Results" : "Community Feed"}
            </h2>
          </div>

          {/* Quick Discovery Categories */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {discoveryCategories.map((cat) => (
              <motion.button
                key={cat.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryToggle(cat.name)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-300 whitespace-nowrap ${selectedTags.includes(cat.name)
                  ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white"
                  }`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{cat.name}</span>
              </motion.button>
            ))}
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
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-wider"
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
                        filteredTags.slice(0, 20).map((tag: string) => (
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
                  onClick={() => {
                    setSelectedTags([]);
                    handleUpdateParams({ tags: null, p: "1" });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 transition-colors"
                >
                  Clear All
                </button>
              )}

              {/* Show All (NSFW) Toggle */}
              <button
                onClick={() => setShowAll(!showAll)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${showAll
                  ? "bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${showAll ? "bg-orange-500 animate-pulse" : "bg-white/20"}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {showAll ? "Showing All" : "Show All"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-md relative group">
          <SearchBar onSearch={onSearch} />
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
        <AnimatePresence>
          {paginatedData?.map((character: any) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 md:gap-6">
          <button
            disabled={page === 1}
            onClick={() => {
              setPage(1);
              handleUpdateParams({ p: "1" });
              setTimeout(scrollToSection, 100);
            }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-all font-bold text-xs"
            title="First Cycle"
          >
            FIRST
          </button>

          <button
            disabled={page === 1}
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
              handleUpdateParams({ p: newPage.toString() });
              setTimeout(scrollToSection, 100);
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-20 hover:bg-white/10 transition-all"
          >
            Prev
          </button>

          <div className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <span className="hidden sm:inline">Module</span>
            {isEditingPage ? (
              <input
                type="text"
                autoFocus
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  setIsEditingPage(false);
                  setInputPage(page.toString());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const newPage = parseInt(inputPage, 10);
                    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
                      setPage(newPage);
                      handleUpdateParams({ p: newPage.toString() });
                      setIsEditingPage(false);
                      setTimeout(scrollToSection, 100);
                    } else {
                      setInputPage(page.toString());
                      setIsEditingPage(false);
                    }
                  } else if (e.key === "Escape") {
                    setIsEditingPage(false);
                    setInputPage(page.toString());
                  }
                }}
                className="w-10 bg-primary/20 border border-primary/30 rounded-lg px-1 py-0.5 text-primary text-center focus:outline-none focus:border-primary transition-all"
              />
            ) : (
              <button
                onClick={() => {
                  setIsEditingPage(true);
                  setInputPage(page.toString());
                }}
                className="text-primary hover:scale-110 transition-transform cursor-pointer italic px-1"
              >
                {page}
              </button>
            )}
            <span>/ {totalPages}</span>
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => {
              const newPage = Math.min(totalPages, page + 1);
              setPage(newPage);
              handleUpdateParams({ p: newPage.toString() });
              setTimeout(scrollToSection, 100);
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-20 hover:bg-white/10 transition-all"
          >
            Next
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => {
              setPage(totalPages);
              handleUpdateParams({ p: totalPages.toString() });
              setTimeout(scrollToSection, 100);
            }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-all font-bold text-xs"
            title="Last Cycle"
          >
            LAST
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
