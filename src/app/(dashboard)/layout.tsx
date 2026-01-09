import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-950">
            <Sidebar />
            {/* Spacer for fixed sidebar */}
            <div className="w-[260px] shrink-0 hidden lg:block" />

            <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 xl:p-16 relative z-0 flex flex-col">
                <div className="flex-1 w-full max-w-[1600px] mx-auto bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
