"use client";

import { motion, AnimatePresence } from 'motion/react';
import { type Toast, useToastStore } from '@/app/hooks/useToastStore';
import {
    RiCheckFill,
    RiCloseCircleFill,
    RiInformationFill,
    RiLoader4Fill,
    RiCloseFill
} from 'react-icons/ri';
import { useEffect, useState } from 'react';

const icons = {
    success: <RiCheckFill className="w-5 h-5 text-emerald-400" />,
    error: <RiCloseCircleFill className="w-5 h-5 text-rose-400" />,
    info: <RiInformationFill className="w-5 h-5 text-blue-400" />,
    loading: <RiLoader4Fill className="w-5 h-5 text-zinc-400 animate-spin" />,
};

const colors = {
    success: 'border-emerald-500/20 bg-emerald-500/5',
    error: 'border-rose-500/20 bg-rose-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
    loading: 'border-zinc-500/20 bg-zinc-500/5',
};

export const ToastItem = ({ toast }: { toast: Toast }) => {
    const removeToast = useToastStore((state) => state.removeToast);
    const [progress, setProgress] = useState(100);
    const duration = toast.duration || 4000;

    useEffect(() => {
        if (toast.type === 'loading' || toast.duration === Infinity) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining === 0) clearInterval(interval);
        }, 16);

        return () => clearInterval(interval);
    }, [toast.type, toast.duration, duration]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`
        relative group min-w-[320px] max-w-md 
        glass-morphism overflow-hidden
        border border-white/10 rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        backdrop-blur-xl p-4 flex items-center gap-3
        ${colors[toast.type]}
      `}
        >
            <div className="shrink-0">
                {icons[toast.type]}
            </div>

            <p className="grow text-sm font-medium text-zinc-100">
                {toast.message}
            </p>

            <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 
          hover:bg-white/10 transition-all duration-200 text-zinc-400 hover:text-white"
            >
                <RiCloseFill className="w-4 h-4" />
            </button>

            {toast.type !== 'loading' && toast.duration !== Infinity && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-white/10 w-full">
                    <motion.div
                        className={`h-full ${toast.type === 'success' ? 'bg-emerald-500' :
                            toast.type === 'error' ? 'bg-rose-500' :
                                'bg-blue-500'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </motion.div>
    );
};
