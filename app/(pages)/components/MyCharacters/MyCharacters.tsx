"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import CharacterCard from "../CharacterCard/CharacterCard";
import { FiAlertTriangle, FiRefreshCw, FiHash, FiGrid, FiSearch, FiX, FiChevronDown, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { FaPencilAlt, FaTrash, FaPlus, FaUser, FaRobot } from "react-icons/fa";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from '@/app/lib/toast';
import { motion, Variants } from "motion/react";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { CharactersData } from "@/types/type"; // adjust the import path to your type definitions
import { useSettings } from "@/app/hooks/useSettings";

const MyCharacters: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { settings } = useSettings();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManageMode, setIsManageMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get("page")) || 1;
  const [inputPage, setInputPage] = useState(page.toString());

  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handlePageChange = (newPage: number) => {
    router.push(pathname + "?" + createQueryString("page", newPage.toString()), { scroll: false });
    setTimeout(scrollToSection, 100);
  };
  const pageSize = 10;
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const gridRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = React.useCallback(() => {
    if (gridRef.current) {
      const offset = 120;
      const elementPosition = gridRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth"
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const { isPending, data, error } = useQuery<CharactersData>({
    queryKey: ["myCharacters", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/my-characters/${user?.id}`);
      const json = await res.json();
      return json.data as CharactersData;
    },
    enabled: !!user?.id,
  });

  const filteredCharacters = data?.filter((char) => {
    if (!char) return false;

    const query = searchQuery.toLowerCase().trim();
    const name = char.name?.toLowerCase() || "";

    const tagsMatch = Array.isArray(char.tags)
      ? char.tags.some(tag => (tag.name?.toLowerCase() || "").includes(query))
      : false;

    const matchesSearch = name.includes(query) || tagsMatch;



    return matchesSearch;
  });

  useEffect(() => {
    if (data && !hasAnimated) setHasAnimated(true);
  }, [data, hasAnimated]);

  const totalPages = Math.ceil((filteredCharacters?.length || 0) / pageSize);
  const paginatedCharacters = filteredCharacters?.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    // When search query changes, reset to page 1
    if (page !== 1) {
      router.push(pathname + "?" + createQueryString("page", "1"), { scroll: false });
    }
  }, [searchQuery]);


  useEffect(() => {
    setInputPage(page.toString());
  }, [page]);

  const deleteChar = async (characterId: string, characterName: string) => {
    if (
      !(await confirm({
        title: "Terminate Entity",
        message: `Are you sure you want to delete "${characterName}"? This action cannot be undone and will erase all associated DNA records.`,
        confirmLabel: "Terminate",
        variant: "danger"
      }))
    )
      return;

    // Optimistic Update across all character queries
    const updateFn = (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.filter((char: any) => char.id !== characterId);
      }
      if (old.data && Array.isArray(old.data)) {
        return {
          ...old,
          data: old.data.filter((char: any) => char.id !== characterId)
        };
      }
      return old;
    };

    queryClient.setQueriesData({ queryKey: ["myCharacters"] }, updateFn);
    queryClient.setQueriesData({ queryKey: ["characters"] }, updateFn);
    queryClient.setQueriesData({ queryKey: ["current-user-characters"] }, updateFn);

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Character deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        queryClient.invalidateQueries({ queryKey: ["current-user-characters"] });
      } else {
        toast.error("Failed to delete character");
        queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        queryClient.invalidateQueries({ queryKey: ["current-user-characters"] });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the character");
      queryClient.invalidateQueries({ queryKey: ["myCharacters"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-characters"] });
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
    exit: { opacity: 0 }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (isPending)
    return (
      <div className="min-h-screen bg-surface pt-24 px-6">
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 bg-white/5 rounded-xl w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-[280px] bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface pt-20 px-6">
        <div className="text-center space-y-4">
          <FiAlertTriangle className="mx-auto text-3xl text-red-500/50" />
          <p className="text-zinc-500 text-sm font-black uppercase tracking-widest">Error syncing archival data</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-surface pt-24 pb-24 px-6 md:px-8 relative overflow-hidden">
      {/* Subtle Monochrome Grain/Blur */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/2 blur-[100px]" />
      </div>

      <motion.div
        key="characters-page"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto"
        ref={gridRef}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div className="space-y-3">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-1.5 h-8 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              <h1 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                My Characters
              </h1>
            </motion.div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-5 leading-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
              {data?.length || 0} Characters
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="SEARCH DATABASE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all uppercase tracking-wider w-48 sm:w-64"
              />
            </div>

            <button
              onClick={() => setIsManageMode(!isManageMode)}
              className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${isManageMode
                ? "bg-white text-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/10"
                }`}
            >
              <FaPencilAlt size={10} />
              {isManageMode ? "Done" : "Edit"}
            </button>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/create_character"
                className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-zinc-100 transition-all transform"
              >
                <FaPlus />
                <span>Create</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Content Area */}
        {filteredCharacters && filteredCharacters.length > 0 ? (
          <>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-16"
            >
              {paginatedCharacters?.map((character) => (
                <motion.div
                  key={character.id}
                  variants={cardVariants}
                  layoutId={character.id}
                  className="group relative"
                >
                  <div className="relative z-10 transition-transform duration-300 group-hover:scale-[1.02]">
                    <CharacterCard
                      characterName={character.name}
                      image={
                        character.photo?.id
                          ? `/api/image/${character.id}`
                          : null
                      }
                      characterId={character.id}
                      characterBio={character.bio}
                      authorName={character.author.username}
                      isNsfw={character.isNsfw}
                      tags={character.tags}
                    />
                  </div>

                  {/* Quick Controls overlay */}
                  <div className={`absolute -right-2 -top-2 z-30 flex flex-col gap-2 transition-all duration-200 ${isManageMode
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-4 pointer-events-none"
                    }`}>
                    <Link
                      href={`/edit_character/${character.id}`}
                      className="w-9 h-9 bg-zinc-900 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black hover:border-white transition-all shadow-lg"
                      title="Modify"
                    >
                      <FaPencilAlt size={12} />
                    </Link>
                    <button
                      onClick={() => deleteChar(character.id, character.name)}
                      className="w-9 h-9 bg-zinc-900 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-lg"
                      title="Terminate"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-center gap-4 py-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(1)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-zinc-500 transition-all text-lg"
                    title="First Page"
                  >
                    <FiChevronsLeft />
                  </button>
                  <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    className="px-6 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-zinc-400 transition-all"
                  >
                    <FiChevronsLeft className="text-sm" />
                    <span>Previous</span>
                  </button>

                  <div className="h-10 px-6 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Page</span>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="text"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value.replace(/\D/g, ""))}
                        onBlur={() => { if (!inputPage) setInputPage(page.toString()); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const newPage = parseInt(inputPage, 10);
                            if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
                              handlePageChange(newPage);
                            } else { setInputPage(page.toString()); }
                          }
                        }}
                        className="w-8 bg-transparent text-center text-white font-bold focus:outline-none border-b border-transparent focus:border-white/50 transition-colors"
                      />
                      <span className="text-zinc-600 font-bold">/</span>
                      <span className="text-zinc-400 font-bold">{totalPages}</span>
                    </div>
                  </div>

                  <button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    className="px-6 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-zinc-400 transition-all"
                  >
                    <span>Next</span>
                    <FiChevronsRight className="text-sm" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-zinc-500 transition-all text-lg"
                    title="Last Page"
                  >
                    <FiChevronsRight />
                  </button>
                </div>
                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                  Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredCharacters?.length || 0)} of {filteredCharacters?.length}
                </p>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-[400px] flex items-center justify-center bg-white/1 border border-dashed border-white/5 rounded-3xl p-12 text-center"
          >
            <div className="max-w-md space-y-6">
              <div className="w-20 h-20 mx-auto bg-linear-to-b from-white/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                <FaRobot className="text-zinc-700 text-4xl" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                  {data && data.length > 0 ? "No Matches Found" : "Archive Null"}
                </h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  {data && data.length > 0
                    ? "Your search or NSFW filter settings are hiding these entities."
                    : "No entities have been created in this sector yet."}
                </p>
              </div>
              {(searchQuery || (data && data.length > 0 && data.length !== filteredCharacters?.length)) && (
                <div className="flex flex-col gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs font-black text-white border-b border-white/20 hover:border-white pb-0.5 transition-all uppercase tracking-widest"
                    >
                      Clear Search Query
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MyCharacters;
