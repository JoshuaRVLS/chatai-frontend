"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import CharacterCard from "../CharacterCard/CharacterCard";
import { FiAlertTriangle, FiRefreshCw, FiHash, FiGrid, FiSearch, FiX, FiChevronDown, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { FaPencilAlt, FaTrash, FaPlus, FaUser, FaRobot } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, Variants } from "motion/react";
import { useConfirm } from "@/app/(pages)/providers/ConfirmationProvider";
import { CharactersData } from "@/@types/type"; // adjust the import path to your type definitions
import { useSettings } from "@/app/hooks/useSettings";

const MyCharacters: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { settings } = useSettings();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManageMode, setIsManageMode] = useState(false);
  const [page, setPage] = useState(1);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [inputPage, setInputPage] = useState("1");
  const pageSize = 32;
  const confirm = useConfirm();
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
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // NSFW Filtering
    if (!settings?.showNsfw && char.isNsfw) return false;

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
    setPage(1);
  }, [searchQuery]);

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

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Character deleted successfully");
        window.location.reload();
      } else {
        toast.error("Failed to delete character");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the character");
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (isPending)
    return (
      <div className="min-h-screen bg-[#09090b] pt-24 px-6">
        <div className="w-full space-y-6 animate-pulse">
          <div className="h-10 bg-white/5 rounded-xl w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[240px] bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] pt-20 px-6">
        <p className="text-zinc-500 text-sm font-black uppercase tracking-widest">Error syncing archival data</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#09090b] pt-24 pb-16 px-6 md:px-8 relative overflow-hidden">
      {/* Subtle Monochrome Grain/Blur */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/2 blur-[100px]" />
      </div>

      <motion.div
        key="characters-page"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
        ref={gridRef}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-white/10 rounded-full" />
              <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tight uppercase leading-none">
                Archives
              </h1>
            </div>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-3 leading-none">
              Control Center • {data?.length || 0} Entities Indexed
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsManageMode(!isManageMode)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${isManageMode
                ? "bg-white text-zinc-950 border-white shadow-xl"
                : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/10 hover:text-white"
                }`}
            >
              <FaPencilAlt size={10} />
              {isManageMode ? "Finish Editing" : "Manage"}
            </button>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/create_character"
                className="px-5 py-2.5 bg-white text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl hover:bg-zinc-200"
              >
                <FaPlus />
                <span>Deploy New</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Stats & Search Column */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/1 border border-white/5 rounded-2xl p-6">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Search Database</p>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-modern"
                />
              </div>
            </div>

            <div className="bg-white/1 border border-white/5 rounded-2xl p-6">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Archive Stats</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Entities</span>
                  <span className="text-xl font-black text-white italic tracking-tight">{data?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-9">
            {filteredCharacters && filteredCharacters.length > 0 ? (
              <motion.div
                key={`page-${page}`}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
              >
                {paginatedCharacters?.map((character) => (
                  <motion.div
                    key={character.id}
                    variants={cardVariants}
                    className="group relative"
                  >
                    <div className="relative z-10">
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
                    <div className="absolute inset-0 bg-white/1 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <div className={`absolute top-4 right-4 z-20 flex gap-2 transition-all ${isManageMode
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                      }`}>
                      <Link
                        href={`/edit_character/${character.id}`}
                        className="w-8 h-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all shadow-xl"
                        title="Modify"
                      >
                        <FaPencilAlt size={14} />
                      </Link>
                      <button
                        onClick={() => deleteChar(character.id, character.name)}
                        className="w-8 h-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/40 transition-all shadow-xl"
                        title="Terminate"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex items-center justify-center bg-white/1 border border-dashed border-white/5 rounded-2xl p-8 text-center"
              >
                <div className="max-w-xs space-y-4">
                  <div className="w-12 h-12 mx-auto bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                    <FaRobot className="text-zinc-800 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white italic tracking-tight uppercase mb-1">
                      Archive Null
                    </h3>
                    <p className="text-zinc-700 text-[8px] font-black uppercase tracking-widest leading-relaxed">
                      No matching entities within the current sector parameters.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => { setPage(1); setTimeout(scrollToSection, 100); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                >
                  FIRST
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => { setPage(p => Math.max(1, p - 1)); setTimeout(scrollToSection, 100); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                >
                  PREV
                </button>

                <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                  <span>Page</span>
                  {isEditingPage ? (
                    <input
                      type="text"
                      autoFocus
                      value={inputPage}
                      onChange={(e) => setInputPage(e.target.value.replace(/\D/g, ""))}
                      onBlur={() => { setIsEditingPage(false); setInputPage(page.toString()); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const newPage = parseInt(inputPage, 10);
                          if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
                            setPage(newPage); setIsEditingPage(false); setTimeout(scrollToSection, 100);
                          } else { setInputPage(page.toString()); setIsEditingPage(false); }
                        } else if (e.key === "Escape") { setIsEditingPage(false); setInputPage(page.toString()); }
                      }}
                      className="bg-white/2 border border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 w-48 transition-colors"
                    />
                  ) : (
                    <button
                      onClick={() => { setIsEditingPage(true); setInputPage(page.toString()); }}
                      className="text-white hover:scale-110 transition-transform cursor-pointer italic px-1 font-black"
                    >
                      {page}
                    </button>
                  )}
                  <span>of {totalPages}</span>
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setTimeout(scrollToSection, 100); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                >
                  NEXT
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => { setPage(totalPages); setTimeout(scrollToSection, 100); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                >
                  LAST
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MyCharacters;
