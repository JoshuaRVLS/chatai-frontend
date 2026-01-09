import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-950">
            <Sidebar />

            {/* 
                THE TRULY MASSIVE MARGIN
                Direct margin-left to ensure undeniable separation from the sidebar
            */}
            <main className="flex-1 min-w-0 lg:ml-[260px] p-12 md:p-24 lg:p-40 xl:p-56 relative z-0 flex flex-col transition-all duration-500">
                {/* 
                    THE RIGHT-PAGE FLOATING CONTAINER
                    Centrally contained with its own deep shadow and thick border
                */}
                <div className="flex-1 w-full max-w-[1400px] mx-auto bg-zinc-900/40 border-2 border-white/10 rounded-[4rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col mb-20 animate-fade-in">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
