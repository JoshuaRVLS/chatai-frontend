"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import SettingsSidebar from "./SettingsSidebar";

interface SettingsLayoutProps {
    tabs: any[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    onDeleteClick: () => void;
    children: React.ReactNode;
    user: any;
}

const SettingsLayout = ({
    tabs,
    activeTab,
    setActiveTab,
    onDeleteClick,
    children,
    user
}: SettingsLayoutProps) => {
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Handle tab selection
    const handleTabSelect = (id: string) => {
        setActiveTab(id);
        setShowMobileDetail(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBack = () => {
        setShowMobileDetail(false);
    };

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label;

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Desktop Header */}
            <header className="mb-8 md:mb-12 hidden md:block">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-2"
                >
                    Settings
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/40 text-sm font-medium tracking-wide"
                >
                    Manage your neural link and system preferences.
                </motion.p>
            </header>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative overflow-hidden md:overflow-visible min-h-[80vh]">

                {/* SIDEBAR (MASTER) */}
                <motion.div
                    className={`w-full md:w-[320px] lg:w-[360px] shrink-0 ${showMobileDetail ? "hidden md:block" : "block"
                        }`}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="md:hidden mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">System</h1>
                        <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Select a configuration module</p>
                    </div>

                    <SettingsSidebar
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={handleTabSelect}
                        onDeleteClick={onDeleteClick}
                    />
                </motion.div>

                {/* CONTENT (DETAIL) */}
                <AnimatePresence mode="popLayout">
                    {(!showMobileDetail && typeof window !== 'undefined' && window.innerWidth < 768) ? null : (
                        <motion.main
                            className={`flex-1 min-w-0 ${showMobileDetail ? "block" : "hidden md:block"}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {/* Mobile Header with Back Button */}
                            <div className="md:hidden flex items-center gap-4 mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-xl py-4 z-20 border-b border-white/5 -mx-4 px-4">
                                <button
                                    onClick={handleBack}
                                    className="p-2 rounded-full bg-white/5 border border-white/10 text-white active:scale-95 transition-transform"
                                >
                                    <FiArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tighter text-white leading-none">
                                        {activeTabLabel}
                                    </h2>
                                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Configuration</p>
                                </div>
                            </div>

                            <div className="bg-zinc-900/30 md:bg-zinc-950/40 md:backdrop-blur-xl rounded-3xl border border-white/5 md:border-white/10 md:p-8 min-h-[600px]">
                                {children}
                            </div>
                        </motion.main>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default SettingsLayout;
