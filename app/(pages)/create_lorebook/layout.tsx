import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Lorebook - JChatAI",
    description: "Create a new semantic archive module.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
