import React from "react";
import { QueryClient } from "@tanstack/react-query";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import LorebookDetail from "../../components/LorebookDetail/LorebookDetail";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const queryClient = new QueryClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) return null;

    await queryClient.prefetchQuery({
        queryKey: ["lorebook", id],
        queryFn: () =>
            fetch(`${process.env.NEXTAUTH_URL || ""}/api/lorebooks/${id}`).then((res) =>
                res.json().then((data) => data.data || null)
            ),
    });

    return <LorebookDetail lorebookId={id} />;
};

export default page;
