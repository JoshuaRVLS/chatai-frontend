"use client";

import React from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";

interface Tab {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}

interface SettingsSidebarProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    onDeleteClick: () => void;
}

const SettingsSidebar = ({ tabs, activeTab, setActiveTab, onDeleteClick }: SettingsSidebarProps) => {
    return (
        <aside className="space-y-6 h-full flex flex-col">
            <nav className="flex flex-col gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group w-full ${activeTab === tab.id
                                ? "bg-primary/10 border border-primary/20 text-primary"
                                : "bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10 hover:text-white"
                            }`}
                    >
                        <div
                            className={`text-xl transition-transform duration-300 p-2 rounded-xl ${activeTab === tab.id
                                    ? "bg-primary/20 text-primary scale-110"
                                    : "bg-white/5 group-hover:scale-110 group-hover:bg-white/10"
                                }`}
                        >
                            {tab.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-black text-sm uppercase tracking-wide truncate ${activeTab === tab.id ? "text-white" : ""}`}>
                                {tab.label}
                            </p>
                            <p className="text-[9px] opacity-60 uppercase tracking-widest mt-0.5 truncate">
                                {tab.description}
                            </p>
                        </div>
                        {activeTab === tab.id ? (
                            <FiChevronRight className="text-primary animate-pulse" />
                        ) : (
                            <FiChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-white/30" />
                        )}
                    </button>
                ))}
            </nav>

            <div className="h-px bg-white/5 mx-4 my-2" />

            <div className="mt-auto">
                <button
                    onClick={onDeleteClick}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group w-full hover:bg-error/10 border border-transparent hover:border-error/20 text-white/30 hover:text-error"
                >
                    <div className="text-xl group-hover:scale-110 transition-transform p-2 rounded-xl bg-white/5 group-hover:bg-error/20">
                        <FiTrash2 />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm uppercase tracking-wide">Danger Zone</p>
                        <p className="text-[9px] uppercase tracking-widest mt-0.5">Delete account</p>
                    </div>
                </button>
            </div>
        </aside>
    );
};

export default SettingsSidebar;
