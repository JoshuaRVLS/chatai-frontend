import { create } from 'zustand';

export type AuthView = 'login' | 'register';

interface AuthModalState {
    isOpen: boolean;
    view: AuthView;
    openModal: (view?: AuthView) => void;
    closeModal: () => void;
    setView: (view: AuthView) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
    isOpen: false,
    view: 'login',
    openModal: (view = 'login') => set({ isOpen: true, view }),
    closeModal: () => set({ isOpen: false }),
    setView: (view) => set({ view }),
}));
