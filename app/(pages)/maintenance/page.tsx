'use client';

import React from 'react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 max-w-lg w-full text-center space-y-8 animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl group">
                        <svg className="w-10 h-10 text-zinc-400 group-hover:text-white transition-colors animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
                        Under Maintenance
                    </h1>
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">
                        Evolution in progress
                    </p>
                </div>

                <div className="p-1 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <p className="text-xs font-black uppercase tracking-widest text-zinc-600 leading-loose mx-auto max-w-sm">
                    We're currently performing scheduled system upgrades to bring you a faster, more intelligent experience. We'll be back shortly.
                </p>

                <div className="pt-8">
                    <button
                        onClick={() => window.location.reload()}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all underline underline-offset-8 decoration-zinc-800"
                    >
                        Try connecting again
                    </button>
                </div>
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Powered by</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white tracking-widest">JChatAI v2.0</span>
            </div>
        </div>
    );
}
