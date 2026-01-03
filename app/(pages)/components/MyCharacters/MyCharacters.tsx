"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import CharacterCard from "../CharacterCard/CharacterCard";
import { FaPencilAlt, FaTrash, FaPlus, FaUser, FaRobot } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, Variants } from "motion/react";
import { CharactersData } from "@/@types/type"; // adjust the import path to your type definitions

const MyCharacters: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { isPending, data, error } = useQuery<CharactersData>({
    queryKey: ["myCharacters", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/my-characters/${user?.id}`);
      const json = await res.json();
      return json.data as CharactersData;
    },
    enabled: !!user?.id,
  });

  const filteredCharacters = data?.filter((char) =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (data && !hasAnimated) setHasAnimated(true);
  }, [data, hasAnimated]);

  const deleteChar = async (characterId: string, characterName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${characterName}"? This action cannot be undone.`
      )
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
      <div className="min-h-screen bg-[#020617] pt-32 px-6">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-12 bg-white/5 rounded-2xl w-1/4" />
          <div className="h-64 bg-white/5 rounded-[2.5rem]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-white/5 rounded-[2.5rem]" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] pt-20 px-6">
        <p className="text-red-400 text-lg font-black uppercase tracking-widest">Error syncing neural data</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-20 px-6 sm:px-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        key="characters-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <h1 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                My Characters
              </h1>
            </div>
            <p className="text-white/30 text-xs sm:text-sm font-black uppercase tracking-[0.3em] ml-5 leading-loose">
              Neural Entities • Control Center • {data?.length || 0} Records Found
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/create_character"
              className="group relative px-8 py-5 bg-primary text-slate-950 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <FaPlus className="relative z-10" />
              <span className="relative z-10">Deploy New Entity</span>
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Stats & Search Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Search Database</p>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Enter character name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/10 group-focus-within:text-primary transition-colors">
                  <FaRobot />
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Archive Statistics</p>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-white/40 uppercase">Total Entities</span>
                  <span className="text-2xl font-black text-white italic tracking-tighter">{data?.length || 0}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-8">
            {filteredCharacters && filteredCharacters.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {filteredCharacters.map((character) => (
                  <motion.div
                    key={character.id}
                    variants={cardVariants}
                    className="group relative"
                  >
                    <div className="relative z-10">
                      <CharacterCard
                        characterName={character.name}
                        image={
                          character.photo?.data
                            ? `data:${character.photo.mimetype};base64,${Buffer.from(
                              Object.values(character.photo.data)
                            ).toString("base64")}`
                            : null
                        }
                        characterId={character.id}
                        characterBio={character.bio}
                        authorName={character.author.username}
                        tags={character.tags}
                      />
                    </div>

                    {/* Quick Controls overlay */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <Link
                        href={`/edit_character/${character.id}`}
                        className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/40 transition-all"
                        title="Modify DNA"
                      >
                        <FaPencilAlt size={14} />
                      </Link>
                      <button
                        onClick={() => deleteChar(character.id, character.name)}
                        className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/40 transition-all"
                        title="Terminate Entity"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] p-12 text-center"
              >
                <div className="max-w-xs space-y-6">
                  <div className="w-20 h-20 mx-auto bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center">
                    <FaRobot className="text-white/10 text-3xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">
                      Database Empty
                    </h3>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                      No neural entities matching your current search parameters.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MyCharacters;
