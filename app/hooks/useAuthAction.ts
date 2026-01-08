import { useSession } from "next-auth/react";
import { useAuthModalStore } from "./useAuthModalStore";

export const useAuthAction = () => {
    const { data: session, status } = useSession();
    const openModal = useAuthModalStore((state) => state.openModal);

    const withAuth = (action: (...args: any[]) => void) => {
        return (...args: any[]) => {
            if (status === "unauthenticated") {
                openModal('login');
            } else if (status === "authenticated") {
                action(...args);
            }
            // If status is 'loading', we might want to wait or handle it, 
            // but usually, it's safer to do nothing or show a toast.
        };
    };

    return { withAuth, isAuthenticated: status === "authenticated", isLoading: status === "loading" };
};
