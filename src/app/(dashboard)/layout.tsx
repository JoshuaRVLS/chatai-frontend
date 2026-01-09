import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#09090b] text-white selection:bg-white/10">
            <Sidebar />

            {/* Reliable spacer for the fixed sidebar */}
            <div className="hidden lg:block w-[260px] shrink-0" />

            {/* Balanced Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col">
                <div className="p-8 md:p-12 lg:p-16 w-full max-w-[1800px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
