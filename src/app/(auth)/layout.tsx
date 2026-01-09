import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - JChatAI Admin",
    description: "Sign in to the admin panel",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
