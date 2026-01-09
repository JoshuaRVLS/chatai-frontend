'use client';

import { motion } from 'motion/react';
import { FiLock, FiMail } from 'react-icons/fi';
import Link from 'next/link';

export default function AccessDeniedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center space-y-8"
            >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <FiLock className="text-amber-500 text-3xl" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                        Access Restricted
                    </h1>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        This platform is currently in private beta. Only whitelisted testers can access the site.
                    </p>
                </div>

                <div className="bg-white/2.5 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 text-left">
                        <FiMail className="text-zinc-500 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-white uppercase tracking-widest">Want Access?</p>
                            <p className="text-[10px] text-zinc-600 mt-1">
                                Contact the administrator to request whitelist access for your email.
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                    ← Back to Login
                </Link>
            </motion.div>
        </div>
    );
}
