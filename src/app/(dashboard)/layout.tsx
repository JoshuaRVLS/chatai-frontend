import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#09090b] text-white selection:bg-white/10">
            <Sidebar />

            {/* 
                THE MAIN CONTENT AREA
                - pl-[260px] to respect the fixed sidebar
                - Massive padding for that premium 'airy' feel
            */}
            <main className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
                <div className="flex-1 p-8 md:p-16 lg:p-24 xl:p-32">
                    <div className="max-w-[1500px] mx-auto w-full space-y-16">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
