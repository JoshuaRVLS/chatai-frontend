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
        <div className="min-h-screen bg-black pt-28 pb-20 px-6 sm:px-12 relative overflow-hidden">
            {/* Background Blobs - Monochrome */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/2 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/1 blur-[100px] rounded-full" />
            </div>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative z-10 min-h-[80vh]">

                {/* SIDEBAR (MASTER) */}
                <motion.div
                    className={`w-full md:w-[320px] lg:w-[360px] shrink-0 ${showMobileDetail ? "hidden md:block" : "block"
                        }`}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                >
                    {/* Desktop Header (In Sidebar Column for Settings Layout) */}
                    <header className="mb-12">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-1.5 h-10 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                            <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                                Settings
                            </h1>
                        </div>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] ml-6 leading-relaxed">
                            System Preferences • V2.0
                        </p>
                    </header>

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
                            <div className="md:hidden flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-xl py-4 z-20 border-b border-white/5 -mx-4 px-4">
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

                            <div className="bg-zinc-900/20 md:backdrop-blur-3xl rounded-[2.5rem] border border-white/5 md:border-white/10 p-6 md:p-10 min-h-[600px] relative">
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
