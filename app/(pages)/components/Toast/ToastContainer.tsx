"use client";

import { AnimatePresence } from 'motion/react';
import { useToastStore } from '@/app/hooks/useToastStore';
import { ToastItem } from './Toast';

export const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);

    return (
        <div
            className="fixed top-6 right-6 z-9999 flex flex-col gap-3 items-end pointer-events-none"
        >
            <div className="pointer-events-auto flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
