"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiX, FiCheck, FiBookOpen, FiChevronDown } from "react-icons/fi";
import { dropdownVariants } from "../Animations/variants";

interface Lorebook {
    id: string;
    name: string;
    description?: string;
}

interface LorebookSelectorProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    lorebooks: Lorebook[];
}

const LorebookSelector = ({ selectedIds, onChange, lorebooks }: LorebookSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLorebooks = useMemo(() => {
        return lorebooks.filter(lb => selectedIds.includes(lb.id));
    }, [lorebooks, selectedIds]);

    const filteredLorebooks = useMemo(() => {
        // If search query is present, filter by it
        let filtered = lorebooks;
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(lb => lb.name.toLowerCase().includes(lower));
        }
        return filtered;
    }, [lorebooks, searchQuery]);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-3" ref={containerRef}>
            {/* Selected Items (Chips) */}
            <div className="flex flex-wrap gap-2">
                {selectedLorebooks.length > 0 && selectedLorebooks.map(lb => (
                    <div
                        key={lb.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-text-primary text-bg-page border border-border-default text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-200 shadow-sm"
                    >
                        <FiBookOpen size={10} />
                        <span>{lb.name}</span>
                        <button
                            type="button"
                            onClick={() => toggleSelection(lb.id)}
                            className="ml-1 p-0.5 hover:bg-bg-page/20 rounded-full transition-colors"
                        >
                            <FiX size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Dropdown Trigger & Input */}
            <div className="relative z-50">
                <div
                    className="relative group cursor-text"
                    onClick={() => setIsOpen(true)}
                >
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={selectedLorebooks.length > 0 ? "Add another module..." : "Search available modules..."}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="w-full bg-input border border-border-input rounded-2xl py-4 pl-12 pr-12 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-border-hover focus:bg-surface-hover transition-all font-bold"
                    />
                    <FiChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 right-0 mt-2 bg-surface/90 backdrop-blur-xl border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[240px]"
                        >
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent min-h-0">
                                {filteredLorebooks.length > 0 ? (
                                    filteredLorebooks.map(lb => {
                                        const isSelected = selectedIds.includes(lb.id);
                                        return (
                                            <button
                                                key={lb.id}
                                                type="button"
                                                onClick={() => toggleSelection(lb.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1 last:mb-0 ${isSelected
                                                    ? "bg-text-primary text-bg-page"
                                                    : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "border-bg-page text-bg-page" : "border-border-default"
                                                    }`}>
                                                    {isSelected && <FiCheck size={10} strokeWidth={4} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[11px] font-black uppercase tracking-wider truncate">
                                                        {lb.name}
                                                    </h4>
                                                    {lb.description && (
                                                        <p className={`text-[9px] truncate mt-0.5 font-medium ${isSelected ? "text-bg-page/70" : "text-text-muted"}`}>
                                                            {lb.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">No modules found.</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-3 py-2 border-t border-border-default bg-surface/50 flex justify-between items-center text-[9px] font-black text-text-muted uppercase tracking-widest">
                                <span>{filteredLorebooks.length} Available</span>
                                <span>{selectedIds.length} Selected</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LorebookSelector;
