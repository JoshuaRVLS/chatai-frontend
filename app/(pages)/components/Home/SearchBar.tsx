"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiX, FiTrendingUp, FiEye } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/hooks/useSettings";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

const SearchSuggestionItem = ({
    char,
    settings,
    onSelect
}: {
    char: any;
    settings: any;
    onSelect: (id: string) => void;
}) => {
    const [tempUnblur, setTempUnblur] = useState(false);
    const shouldBlur = char.isNsfw && settings?.blurNsfw && !tempUnblur;

    const handleClick = (e: React.MouseEvent) => {
        if (shouldBlur) {
            e.preventDefault();
            e.stopPropagation();
            setTempUnblur(true);
            return;
        }
        onSelect(char.id);
    };

    return (
        <button
            onClick={handleClick}
            className="w-full flex items-center gap-3 sm:gap-5 p-3 sm:p-4 hover:bg-white/[0.03] rounded-2xl sm:rounded-[1.75rem] transition-all group"
        >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 overflow-hidden border border-white/5 group-hover:border-primary/30 shadow-lg">
                <img
                    src={`/api/image/${char.id}`}
                    alt={char.name}
                    className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${shouldBlur ? 'blur-md grayscale-[0.5]' : ''}`}
                />
                <AnimatePresence>
                    {shouldBlur && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                            <FiEye className="text-white/60 text-[10px]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex-1 text-left">
                <p className="text-xs sm:text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase italic flex items-center gap-2">
                    {char.name}
                    {char.isNsfw && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-orange-500/10 text-orange-500 border border-orange-500/20">NSFW</span>
                    )}
                </p>
                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                    <span className="text-[8px] sm:text-[10px] text-white/30 font-bold uppercase tracking-widest truncate max-w-[80px] sm:max-w-none">{char.author?.username}</span>
                    <div className="hidden xs:flex gap-1.5">
                        {char.tags?.slice(0, 1).map((tag: any) => (
                            <span key={tag.id} className="text-[8px] sm:text-[9px] text-primary/40 font-black uppercase tracking-tighter">#{tag.name}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/5 flex items-center justify-center text-white/5 group-hover:text-primary/40 group-hover:border-primary/20 transition-all">
                <FiSearch className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />
            </div>
        </button>
    );
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { settings } = useSettings();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.trim().length === 0) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    search: query,
                    pageSize: "6",
                    showAll: settings?.showNsfw ? "true" : "false"
                });
                const res = await fetch(`/api/characters?${params.toString()}`);
                const data = await res.json();
                if (data.success) {
                    setSuggestions(data.data);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query, settings?.showNsfw]);

    const handleSelect = (charId: string) => {
        router.push(`/character/${charId}`);
        setIsOpen(false);
        setQuery("");
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-40">
            <form onSubmit={handleSearchSubmit} className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

                <div className="relative flex items-center bg-[#0f172a]/40 border border-white/5 rounded-[1.5rem] sm:rounded-3xl p-1.5 sm:p-2 backdrop-blur-2xl group-focus-within:border-primary/30 transition-all duration-500 shadow-2xl">
                    <FiSearch className={`ml-3 sm:ml-5 transition-colors text-lg sm:text-xl ${loading ? 'text-primary animate-pulse' : 'text-white/20 group-focus-within:text-primary'}`} />

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length > 0 && setIsOpen(true)}
                        placeholder="Search..."
                        className="flex-1 bg-transparent border-none outline-none py-3 sm:py-4 px-2 sm:px-4 text-white placeholder:text-white/20 font-medium text-xs sm:text-sm"
                    />

                    <AnimatePresence>
                        {query && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                type="button"
                                onClick={() => { setQuery(""); onSearch(""); }}
                                className="p-3 hover:bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all mr-2"
                            >
                                <FiX size={16} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-4 bg-[#0f172a]/90 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50"
                    >
                        <div className="p-3">
                            <p className="px-6 py-4 text-[9px] uppercase tracking-[0.4em] font-black text-white/20 flex items-center gap-3 italic">
                                <span className="w-8 h-px bg-white/5" />
                                <FiTrendingUp size={10} /> Results
                            </p>

                            <div className="space-y-1">
                                {suggestions.map((char) => (
                                    <SearchSuggestionItem
                                        key={char.id}
                                        char={char}
                                        settings={settings}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;
