'use client';

import { useState } from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 glass backdrop-blur-xl">
            <div>
                <h1 className="text-sm font-black uppercase tracking-widest text-zinc-500">{title}</h1>
                {subtitle && <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-slate-950"></span>
                </button>
            </div>
        </header>
    );
}
