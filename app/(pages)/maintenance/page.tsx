'use client';

import React from 'react';
import { FiCpu } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MaintenancePage() {
    const router = useRouter();
    const { data: session } = useSession();
    // Simplified checks to avoid hydration mismatch
    const isAdmin = session?.user?.email === 'admin@jchatai.com'; // Replace with real check

    return (
        <div className="min-h-screen bg-page flex flex-col items-center justify-center relative overflow-hidden selection:bg-text-primary selection:text-bg-page">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-size-[100%_2px,3px_100%] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,var(--bg-page),transparent)]" />
            </div>

            {/* Floating Orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-surface-hover/50 rounded-full blur-[100px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-surface-hover/30 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none" />

            <div className="z-10 text-center space-y-8 max-w-2xl px-6">
                {/* Icon Container */}
                <div className="relative inline-block group">
                    <div className="absolute inset-0 bg-text-primary/20 blur-xl rounded-full group-hover:bg-text-primary/30 transition-all duration-500" />
                    <div className="relative w-24 h-24 bg-surface/50 backdrop-blur-md rounded-3xl border border-border-default flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                        <FiCpu className="text-5xl text-text-primary animate-spin-slow" />
                    </div>
                    {/* Status Dot */}
                    <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-text-primary italic tracking-tighter uppercase leading-none">
                        System<br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-text-secondary to-text-muted">Upgrade</span>
                    </h1>

                    <div className="h-1 w-24 mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

                    <p className="text-text-muted text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                        Our digital architects are enhancing the neural pathways.
                        <span className="block mt-2 text-sm uppercase tracking-widest opacity-60">Estimated restoration: Shortly</span>
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="w-full max-w-sm mx-auto space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-text-muted mb-1 tracking-widest">
                        <span>System Status</span>
                        <span>Optimizing...</span>
                    </div>
                    <div className="h-1 bg-surface-hover w-full rounded-full overflow-hidden">
                        <div className="h-full bg-text-primary w-2/3 rounded-full animate-progress-indeterminate will-change-transform" />
                    </div>
                </div>

                {/* Admin Override - Hidden in production usually, or protected */}
                {isAdmin && (
                    <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                        <button
                            onClick={() => router.push('/')}
                            className="group relative px-8 py-3 bg-surface/50 hover:bg-surface border border-border-default rounded-xl overflow-hidden transition-all duration-300"
                        >
                            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-text-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <span className="relative text-xs font-black uppercase tracking-widest text-text-muted group-hover:text-text-primary transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Override Access
                            </span>
                        </button>
                    </div>
                )}

                <div className="pt-12 flex justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
                    <a href="#" className="text-text-muted hover:text-text-primary hover:underline decoration-border-default underline-offset-8 text-xs uppercase font-bold tracking-widest transition-all hover:decoration-text-primary">Status Page</a>
                    <a href="#" className="text-text-muted hover:text-text-primary hover:underline decoration-border-default underline-offset-8 text-xs uppercase font-bold tracking-widest transition-all hover:decoration-text-primary">Support</a>
                    <a href="#" className="text-text-muted hover:text-text-primary hover:underline decoration-border-default underline-offset-8 text-xs uppercase font-bold tracking-widest transition-all hover:decoration-text-primary">Discord</a>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/30">
                    JChatAI &copy; 2024
                </p>
            </div>
        </div>
    );
}
