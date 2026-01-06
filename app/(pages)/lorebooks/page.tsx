import React from "react";
import { QueryClient } from "@tanstack/react-query";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import Lorebooks from "../components/Lorebooks/Lorebooks";

const page = async () => {
    const queryClient = new QueryClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) return null;

    await queryClient.prefetchQuery({
        queryKey: ["lorebooks"],
        queryFn: () =>
            fetch(`${process.env.NEXTAUTH_URL || ""}/api/lorebooks`).then((res) =>
                res.json().then((data) => data.data || [])
            ),
    });

    return <Lorebooks />;
};

export default page;
