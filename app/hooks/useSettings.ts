"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../(pages)/providers/AuthProvider";

export const useSettings = () => {
    const { user } = useAuth();

    const { data, isPending, error, refetch } = useQuery({
        queryKey: ["settingsData", user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/users/${user?.id}`);
            const json = await res.json();
            return json.data;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    return {
        settings: data?.userSettings || { showNsfw: false, blurNsfw: true },
        isPending,
        error,
        refetch,
        userData: data
    };
};
