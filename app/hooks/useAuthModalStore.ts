import { create } from 'zustand';

export type AuthView = 'login' | 'register' | 'verify';

interface AuthModalState {
    isOpen: boolean;
    view: AuthView;
    verifyEmail: string;
    openModal: (view?: AuthView) => void;
    closeModal: () => void;
    setView: (view: AuthView) => void;
    setVerifyEmail: (email: string) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
    isOpen: false,
    view: 'login',
    verifyEmail: '',
    openModal: (view = 'login') => set({ isOpen: true, view }),
    closeModal: () => set({ isOpen: false }),
    setView: (view) => set({ view }),
    setVerifyEmail: (email) => set({ verifyEmail: email }),
}));
