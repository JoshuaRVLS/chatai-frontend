import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        if (toast.type !== 'loading' && toast.duration !== Infinity) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, toast.duration || 4000);
        }

        return id;
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
    updateToast: (id, updates) =>
        set((state) => ({
            toasts: state.toasts.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            ),
        })),
}));
