import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            {/* Spacer for fixed sidebar */}
            <div className="w-[260px] shrink-0 hidden lg:block" />
            <main className="flex-1 min-w-0 p-6 md:p-12 lg:p-20 relative z-0">
                {children}
            </main>
        </div>
    );
}
